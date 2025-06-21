import { Server as SocketServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';
import { GameState, Player, ChatMessage, GameAction } from '@mymcp/types';
import { EventEmitter } from 'events';

interface EngineConfig {
  engineId: string;
  port: number;
  isPrimary: boolean;
  redisUrl: string;
  peerEngines: string[];
}

interface MultiplayerEvent {
  type: 'STATE_UPDATE' | 'CHAT' | 'PLAYER_ACTION' | 'QUEST_UPDATE' | 'GLOBAL_ANNOUNCEMENT';
  sourceEngine: string;
  playerId: string;
  data: any;
  timestamp: Date;
}

export class MultiplayerService extends EventEmitter {
  private io: SocketServer;
  private pubClient: Redis;
  private subClient: Redis;
  private engineConfig: EngineConfig;
  private playerSessions: Map<string, Set<string>> = new Map(); // playerId -> socketIds
  
  constructor(server: any, config: EngineConfig) {
    super();
    this.engineConfig = config;
    
    // Initialize Redis clients
    this.pubClient = new Redis(config.redisUrl);
    this.subClient = this.pubClient.duplicate();
    
    // Add error handlers to prevent unhandled error warnings
    this.pubClient.on('error', (err) => {
      console.error('[MultiplayerService] Redis pub client error:', err);
    });
    
    this.subClient.on('error', (err) => {
      console.error('[MultiplayerService] Redis sub client error:', err);
    });
    
    // Initialize Socket.IO with Redis adapter
    this.io = new SocketServer(server, {
      cors: {
        origin: ["http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
        credentials: true
      }
    });
    
    this.io.adapter(createAdapter(this.pubClient, this.subClient));
    
    // Subscribe to engine-to-engine events
    this.subscribeToEngineEvents();
    
    // Set up Socket.IO event handlers
    this.setupSocketHandlers();
  }
  
  private subscribeToEngineEvents() {
    // Subscribe to global game events
    this.subClient.subscribe('game:state:updates');
    this.subClient.subscribe('game:chat:global');
    this.subClient.subscribe('game:quest:updates');
    this.subClient.subscribe('game:player:presence');
    
    this.subClient.on('message', (channel, message) => {
      const event: MultiplayerEvent = JSON.parse(message);
      
      // Don't process our own events
      if (event.sourceEngine === this.engineConfig.engineId) return;
      
      this.handleEngineEvent(channel, event);
    });
  }
  
  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);
      
      // Player authentication/identification
      socket.on('identify', async (data: { playerId: string }) => {
        const { playerId } = data;
        
        // Join player-specific room
        socket.join(`player:${playerId}`);
        
        // Track player session
        if (!this.playerSessions.has(playerId)) {
          this.playerSessions.set(playerId, new Set());
        }
        this.playerSessions.get(playerId)!.add(socket.id);
        
        // Broadcast player presence
        this.publishEvent('game:player:presence', {
          type: 'PLAYER_ONLINE',
          playerId,
          engineId: this.engineConfig.engineId,
          timestamp: new Date()
        });
        
        // Send current online players
        const onlinePlayers = await this.getOnlinePlayers();
        socket.emit('players:online', onlinePlayers);
      });
      
      // Global chat messages
      socket.on('chat:global', (data: { playerId: string, message: string }) => {
        const chatEvent: MultiplayerEvent = {
          type: 'CHAT',
          sourceEngine: this.engineConfig.engineId,
          playerId: data.playerId,
          data: {
            message: data.message,
            channel: 'global'
          },
          timestamp: new Date()
        };
        
        // Publish to Redis for other engines
        this.publishEvent('game:chat:global', chatEvent);
        
        // Broadcast to local clients
        this.io.emit('chat:global', chatEvent);
      });
      
      // Quest progress sharing
      socket.on('quest:progress', (data: { playerId: string, questId: string, progress: any }) => {
        const questEvent: MultiplayerEvent = {
          type: 'QUEST_UPDATE',
          sourceEngine: this.engineConfig.engineId,
          playerId: data.playerId,
          data: {
            questId: data.questId,
            progress: data.progress
          },
          timestamp: new Date()
        };
        
        this.publishEvent('game:quest:updates', questEvent);
      });
      
      // Location-based events (for shared spaces)
      socket.on('player:location', (data: { playerId: string, location: string }) => {
        socket.join(`location:${data.location}`);
        this.io.to(`location:${data.location}`).emit('player:entered', {
          playerId: data.playerId,
          location: data.location
        });
      });
      
      socket.on('disconnect', () => {
        // Clean up player sessions
        for (const [playerId, socketIds] of this.playerSessions.entries()) {
          if (socketIds.has(socket.id)) {
            socketIds.delete(socket.id);
            if (socketIds.size === 0) {
              this.playerSessions.delete(playerId);
              
              // Broadcast player offline
              this.publishEvent('game:player:presence', {
                type: 'PLAYER_OFFLINE',
                playerId,
                engineId: this.engineConfig.engineId,
                timestamp: new Date()
              });
            }
          }
        }
      });
    });
  }
  
  private handleEngineEvent(channel: string, event: MultiplayerEvent) {
    switch (channel) {
      case 'game:chat:global':
        // Broadcast global chat to all local clients
        this.io.emit('chat:global', event);
        break;
        
      case 'game:quest:updates':
        // Notify interested players about quest progress
        this.io.emit('quest:update', event);
        break;
        
      case 'game:player:presence':
        // Update player presence
        this.io.emit('player:presence', event);
        break;
        
      case 'game:state:updates':
        // Sync specific game state updates
        this.io.to(`player:${event.playerId}`).emit('state:update', event);
        break;
    }
  }
  
  publishEvent(channel: string, event: any) {
    this.pubClient.publish(channel, JSON.stringify({
      ...event,
      sourceEngine: this.engineConfig.engineId
    }));
  }
  
  async getOnlinePlayers(): Promise<Player[]> {
    // Implement Redis-based player presence tracking
    const onlineKeys = await this.pubClient.keys('presence:*');
    const players: Player[] = [];
    
    for (const key of onlineKeys) {
      const playerData = await this.pubClient.get(key);
      if (playerData) {
        players.push(JSON.parse(playerData));
      }
    }
    
    return players;
  }
  
  // Broadcast game state update to specific player across all engines
  broadcastPlayerUpdate(playerId: string, update: Partial<GameState>) {
    const event: MultiplayerEvent = {
      type: 'STATE_UPDATE',
      sourceEngine: this.engineConfig.engineId,
      playerId,
      data: update,
      timestamp: new Date()
    };
    
    // Local broadcast
    this.io.to(`player:${playerId}`).emit('state:update', update);
    
    // Cross-engine broadcast
    this.publishEvent('game:state:updates', event);
  }
  
  // Send announcement to all players across all engines
  broadcastGlobalAnnouncement(message: string, metadata?: any) {
    const event: MultiplayerEvent = {
      type: 'GLOBAL_ANNOUNCEMENT',
      sourceEngine: this.engineConfig.engineId,
      playerId: 'system',
      data: { message, metadata },
      timestamp: new Date()
    };
    
    this.io.emit('announcement', event);
    this.publishEvent('game:announcements', event);
  }
  
  // Public getters for status endpoint
  get connectedClients(): number {
    return this.io.sockets.sockets.size;
  }
  
  get onlinePlayers(): string[] {
    return Array.from(this.playerSessions.keys());
  }
  
  get config(): EngineConfig {
    return this.engineConfig;
  }
} 