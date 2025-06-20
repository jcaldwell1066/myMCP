import { Redis } from 'ioredis';
import { GameState, Player, Quest, Item, PlayerLevel, PlayerStatus, LocationStatus } from '@mymcp/types';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

export class RedisStateManager extends EventEmitter {
  private redis: Redis;
  private sub: Redis;
  private debugMode: boolean;

  constructor(redisUrl: string, debugMode = false) {
    super();
    this.debugMode = debugMode;
    
    // 🔴 BREAKPOINT: Constructor initialization
    this.redis = new Redis(redisUrl);
    this.sub = new Redis(redisUrl);
    
    this.setupSubscriptions();
    
    if (this.debugMode) {
      console.log('🐛 RedisStateManager initialized in debug mode');
    }
  }

  private setupSubscriptions() {
    // 🔴 BREAKPOINT: Setting up Redis subscriptions
    this.sub.subscribe('game:state:updates');
    this.sub.on('message', (channel, message) => {
      const update = JSON.parse(message);
      this.emit('stateUpdate', update);
    });
  }

  async getPlayerState(playerId: string): Promise<GameState | null> {
    // 🔴 BREAKPOINT: Fetching player state from Redis
    try {
      const pipeline = this.redis.pipeline();
      
      // Fetch all player data in one pipeline
      pipeline.hgetall(`game:state:${playerId}`);
      pipeline.smembers(`game:inventory:${playerId}`);
      pipeline.hgetall(`game:quest:active:${playerId}`);
      pipeline.smembers(`game:quest:completed:${playerId}`);
      pipeline.hgetall(`game:session:${playerId}`);
      
      const results = await pipeline.exec();
      
      if (!results || !results[0][1] || Object.keys(results[0][1]).length === 0) {
        return null;
      }

      // 🔴 BREAKPOINT: Assembling game state from Redis data
      const [
        [, playerData],
        [, inventoryItems],
        [, activeQuest],
        [, completedQuests],
        [, sessionData]
      ] = results as any;

      return this.assembleGameState(
        playerData,
        inventoryItems,
        activeQuest,
        completedQuests,
        sessionData
      );
    } catch (error) {
      console.error('Error fetching player state:', error);
      throw error;
    }
  }

  async createPlayerState(playerId: string, playerName?: string): Promise<GameState> {
    // 🔴 BREAKPOINT: Creating new player state
    const now = new Date();
    const sessionId = uuidv4();
    
    const pipeline = this.redis.pipeline();
    
    // Player data
    const playerData = {
      id: playerId,
      name: playerName || 'Hero',
      score: 0,
      level: 'novice',
      status: 'idle',
      location: 'town'
    };
    
    pipeline.hmset(`game:state:${playerId}`, playerData);
    
    // Session data
    const sessionData = {
      id: sessionId,
      startTime: now.toISOString(),
      lastAction: now.toISOString(),
      turnCount: 0
    };
    
    pipeline.hmset(`game:session:${playerId}`, sessionData);
    pipeline.expire(`game:session:${playerId}`, 86400); // 24 hour TTL
    
    // Add to players set
    pipeline.sadd('game:players', playerId);
    
    // Initialize empty inventory and quests
    pipeline.del(`game:inventory:${playerId}`);
    pipeline.del(`game:quest:completed:${playerId}`);
    
    await pipeline.exec();
    
    // Return assembled game state
    return this.createDefaultGameState(playerId, playerName);
  }

  async updatePlayerState(playerId: string, updates: Partial<GameState>): Promise<void> {
    // 🔴 BREAKPOINT: Updating player state
    const pipeline = this.redis.pipeline();
    
    if (updates.player) {
      // 🔴 BREAKPOINT: Updating player attributes
      const playerUpdates: any = {};
      Object.entries(updates.player).forEach(([key, value]) => {
        if (value !== undefined) {
          playerUpdates[key] = value.toString();
        }
      });
      
      if (Object.keys(playerUpdates).length > 0) {
        pipeline.hmset(`game:state:${playerId}`, playerUpdates);
      }
      
      // Handle location changes
      if (updates.player.location) {
        // Get current location
        const currentData = await this.redis.hget(`game:state:${playerId}`, 'location');
        const from = currentData || 'town';
        const to = updates.player.location;
        
        if (from !== to) {
          pipeline.srem(`game:location:${from}`, playerId);
          pipeline.sadd(`game:location:${to}`, playerId);
        }
      }
    }
    
    if (updates.inventory) {
      // 🔴 BREAKPOINT: Updating inventory
      pipeline.del(`game:inventory:${playerId}`);
      if (updates.inventory.items.length > 0) {
        const itemIds = updates.inventory.items.map(item => item.id);
        pipeline.sadd(`game:inventory:${playerId}`, ...itemIds);
        
        // Store item details
        for (const item of updates.inventory.items) {
          pipeline.hmset(`game:item:${item.id}`, item as any);
        }
      }
    }
    
    if (updates.quests) {
      // 🔴 BREAKPOINT: Updating quest state
      if (updates.quests.active) {
        pipeline.hmset(`game:quest:active:${playerId}`, {
          questId: updates.quests.active.id,
          questData: JSON.stringify(updates.quests.active)
        });
      } else {
        pipeline.del(`game:quest:active:${playerId}`);
      }
      
      if (updates.quests.completed) {
        for (const quest of updates.quests.completed) {
          pipeline.sadd(`game:quest:completed:${playerId}`, quest.id);
        }
      }
    }
    
    // Update session
    pipeline.hset(`game:session:${playerId}`, 'lastAction', new Date().toISOString());
    pipeline.hincrby(`game:session:${playerId}`, 'turnCount', 1);
    
    await pipeline.exec();
    
    // 🔴 BREAKPOINT: Publishing state update event
    await this.publishStateUpdate(playerId, updates);
  }

  async getAllPlayers(): Promise<string[]> {
    return this.redis.smembers('game:players');
  }

  async getPlayersInLocation(location: string): Promise<string[]> {
    return this.redis.smembers(`game:location:${location}`);
  }

  async movePlayer(playerId: string, to: string): Promise<void> {
    // 🔴 BREAKPOINT: Moving player between locations
    // Get current location
    const playerData = await this.redis.hgetall(`game:state:${playerId}`);
    const from = playerData.location || 'town';
    
    if (from === to) return;
    
    const pipeline = this.redis.pipeline();
    pipeline.srem(`game:location:${from}`, playerId);
    pipeline.sadd(`game:location:${to}`, playerId);
    pipeline.hset(`game:state:${playerId}`, 'location', to);
    
    await pipeline.exec();
    
    // Emit location change event
    this.emit('locationChange', { playerId, from, to });
  }

  async getLeaderboard(limit = 10): Promise<Array<{playerId: string, score: number}>> {
    const scores = await this.redis.zrevrange('game:leaderboard:score', 0, limit - 1, 'WITHSCORES');
    const leaderboard = [];
    
    for (let i = 0; i < scores.length; i += 2) {
      leaderboard.push({
        playerId: scores[i],
        score: parseInt(scores[i + 1])
      });
    }
    
    return leaderboard;
  }

  async updateScore(playerId: string, score: number): Promise<void> {
    await this.redis.zadd('game:leaderboard:score', score, playerId);
  }

  private async publishStateUpdate(playerId: string, updates: Partial<GameState>) {
    const event = {
      playerId,
      updates,
      timestamp: Date.now(),
      engineId: process.env.ENGINE_ID || 'unknown'
    };
    
    await this.redis.publish('game:state:updates', JSON.stringify(event));
  }

  private assembleGameState(
    playerData: any,
    inventoryItems: string[],
    activeQuest: any,
    completedQuests: string[],
    sessionData: any
  ): GameState {
    // 🔴 BREAKPOINT: Assembling complete game state
    const now = new Date();
    
    // Parse player data
    const player: Player = {
      id: playerData.id,
      name: playerData.name || 'Hero',
      score: parseInt(playerData.score) || 0,
      level: (playerData.level as PlayerLevel) || 'novice',
      status: (playerData.status as PlayerStatus) || 'idle',
      location: (playerData.location as LocationStatus) || 'town'
    };
    
    // Parse inventory
    const items: Item[] = inventoryItems.map(itemId => ({
      id: itemId,
      name: 'Unknown Item', // Would fetch from game:item:{id} in real implementation
      description: 'An item',
      type: 'treasure' as const
    }));
    
    // Parse active quest
    let active: Quest | null = null;
    if (activeQuest && activeQuest.questData) {
      try {
        active = JSON.parse(activeQuest.questData);
      } catch (e) {
        console.error('Failed to parse active quest:', e);
      }
    }
    
    // Create game state
    return {
      player,
      quests: {
        available: [], // Would load from quest definitions
        active,
        completed: completedQuests.map(id => ({ id } as Quest))
      },
      inventory: {
        items,
        capacity: 10,
        status: items.length === 0 ? 'empty' : items.length >= 10 ? 'full' : 'has-item'
      },
      session: {
        id: sessionData.id || uuidv4(),
        startTime: new Date(sessionData.startTime || now),
        lastAction: new Date(sessionData.lastAction || now),
        turnCount: parseInt(sessionData.turnCount) || 0,
        conversationHistory: []
      },
      metadata: {
        version: '2.0.0',
        lastUpdated: now
      }
    };
  }

  private createDefaultGameState(playerId: string, playerName?: string): GameState {
    const now = new Date();
    
    return {
      player: {
        id: playerId,
        name: playerName || 'Hero',
        score: 0,
        level: 'novice',
        status: 'idle',
        location: 'town'
      },
      quests: {
        available: [],
        active: null,
        completed: []
      },
      inventory: {
        items: [],
        capacity: 10,
        status: 'empty'
      },
      session: {
        id: uuidv4(),
        startTime: now,
        lastAction: now,
        turnCount: 0,
        conversationHistory: []
      },
      metadata: {
        version: '2.0.0',
        lastUpdated: now
      }
    };
  }

  async disconnect() {
    await this.redis.quit();
    await this.sub.quit();
  }
} 