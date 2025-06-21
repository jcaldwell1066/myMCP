import { EventEmitter } from 'events';
import { SystemMetrics, AdminEvent, Player, GameState } from '@mymcp/types';
import { Redis } from 'ioredis';
import { config } from '../config';

export interface DashboardData {
  overview: {
    totalPlayers: number;
    activePlayers: number;
    totalQuests: number;
    completedQuests: number;
    systemHealth: 'healthy' | 'warning' | 'critical';
    engines: EngineStatus[];
  };
  recentEvents: AdminEvent[];
  topPlayers: LeaderboardEntry[];
  systemMetrics: SystemMetrics;
  redisInfo: RedisInfo;
}

export interface EngineStatus {
  id: string;
  url: string;
  status: 'online' | 'offline' | 'degraded';
  role: 'leader' | 'worker' | 'standalone';
  lastPing: Date;
  metrics?: {
    connectedClients: number;
    activePlayers: number;
    uptime: number;
  };
}

export interface LeaderboardEntry {
  playerId: string;
  playerName: string;
  score: number;
  level: string;
  questsCompleted: number;
}

export interface RedisInfo {
  connected: boolean;
  version: string;
  usedMemory: string;
  connectedClients: number;
  totalKeys: number;
}

export class AdminDashboardService extends EventEmitter {
  private redis: Redis;
  private events: AdminEvent[] = [];
  private maxEvents = 100;

  constructor() {
    super();
    this.redis = new Redis(config.redisUrl, {
      connectTimeout: 10000,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true
    });
    
    this.redis.on('error', (err) => {
      console.error('AdminDashboardService Redis error:', err.message);
    });
    
    this.redis.on('connect', () => {
      console.log('AdminDashboardService Redis connected');
    });
  }

  async initialize() {
    // Set up event listeners
    this.redis.on('connect', () => {
      this.logEvent('info', 'admin', 'Redis connected');
    });

    this.redis.on('error', (err) => {
      this.logEvent('error', 'admin', 'Redis error', err);
    });

    // Subscribe to game events
    const sub = this.redis.duplicate();
    
    // Add error handler for subscription client
    sub.on('error', (err) => {
      console.error('AdminDashboardService subscription Redis error:', err.message);
    });
    
    sub.subscribe('game:state:updates', 'game:player:presence', 'admin:alerts');
    
    sub.on('message', (channel, message) => {
      this.handleRedisMessage(channel, message);
    });
  }

  async getDashboardData(): Promise<DashboardData> {
    const [
      overview,
      topPlayers,
      systemMetrics,
      redisInfo
    ] = await Promise.all([
      this.getOverview(),
      this.getTopPlayers(),
      this.getSystemMetrics(),
      this.getRedisInfo()
    ]);

    return {
      overview,
      recentEvents: this.getRecentEvents(),
      topPlayers,
      systemMetrics,
      redisInfo
    };
  }

  private async getOverview() {
    const [
      totalPlayers,
      activePlayers,
      engines
    ] = await Promise.all([
      this.redis.scard('game:players'),
      this.getActivePlayers(),
      this.getEngineStatuses()
    ]);

    // Calculate quest statistics
    const questStats = await this.getQuestStatistics();

    // Determine system health
    const systemHealth = this.calculateSystemHealth(engines);

    return {
      totalPlayers,
      activePlayers: activePlayers.length,
      totalQuests: questStats.total,
      completedQuests: questStats.completed,
      systemHealth,
      engines
    };
  }

  private async getActivePlayers(): Promise<string[]> {
    // Get players who were active in the last 5 minutes
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const players = await this.redis.smembers('game:players');
    const activePlayers: string[] = [];

    for (const playerId of players) {
      const lastAction = await this.redis.hget(`game:session:${playerId}`, 'lastAction');
      if (lastAction && new Date(lastAction).getTime() > fiveMinutesAgo) {
        activePlayers.push(playerId);
      }
    }

    return activePlayers;
  }

  private async getEngineStatuses(): Promise<EngineStatus[]> {
    const engines: EngineStatus[] = [];

    for (const endpoint of config.engines.endpoints) {
      try {
        const response = await fetch(`${endpoint}/api/status`);
        if (response.ok) {
          const data = await response.json() as any;
          engines.push({
            id: data.engineId,
            url: endpoint,
            status: 'online',
            role: data.isPrimary ? 'leader' : 'worker',
            lastPing: new Date(),
            metrics: {
              connectedClients: data.connectedClients,
              activePlayers: data.activePlayers,
              uptime: data.uptime
            }
          });
        } else {
          engines.push({
            id: endpoint,
            url: endpoint,
            status: 'offline',
            role: 'standalone' as const,
            lastPing: new Date()
          });
        }
      } catch (error) {
        engines.push({
          id: endpoint,
          url: endpoint,
          status: 'offline',
          role: 'standalone' as const,
          lastPing: new Date()
        });
      }
    }

    return engines;
  }

  private async getQuestStatistics() {
    const players = await this.redis.smembers('game:players');
    let total = 0;
    let completed = 0;

    for (const playerId of players) {
      const completedQuests = await this.redis.scard(`game:quest:completed:${playerId}`);
      completed += completedQuests;
      
      const activeQuest = await this.redis.exists(`game:quest:active:${playerId}`);
      if (activeQuest) total += 1;
      
      total += completedQuests;
    }

    return { total, completed };
  }

  private calculateSystemHealth(engines: EngineStatus[]): 'healthy' | 'warning' | 'critical' {
    const onlineEngines = engines.filter(e => e.status === 'online').length;
    const totalEngines = engines.length;

    if (onlineEngines === 0) return 'critical';
    if (onlineEngines < totalEngines / 2) return 'warning';
    return 'healthy';
  }

  private async getTopPlayers(limit = 10): Promise<LeaderboardEntry[]> {
    const scores = await this.redis.zrevrange('game:leaderboard:score', 0, limit - 1, 'WITHSCORES');
    const leaderboard: LeaderboardEntry[] = [];

    for (let i = 0; i < scores.length; i += 2) {
      const playerId = scores[i];
      const score = parseInt(scores[i + 1]);
      
      const playerData = await this.redis.hgetall(`game:state:${playerId}`);
      const questsCompleted = await this.redis.scard(`game:quest:completed:${playerId}`);

      leaderboard.push({
        playerId,
        playerName: playerData.name || 'Unknown',
        score,
        level: playerData.level || 'novice',
        questsCompleted
      });
    }

    return leaderboard;
  }

  private async getSystemMetrics(): Promise<SystemMetrics> {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const activeSessions = await this.getActivePlayers();
    const questStats = await this.getQuestStatistics();

    return {
      uptime,
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        percentage: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
      },
      cpu: {
        usage: process.cpuUsage().user / 1000000 // Convert to seconds
      },
      activeSessions: activeSessions.length,
      totalQuests: questStats.total,
      completedQuests: questStats.completed
    };
  }

  private async getRedisInfo(): Promise<RedisInfo> {
    try {
      const info = await this.redis.info();
      const stats = this.parseRedisInfo(info);
      const dbSize = await this.redis.dbsize();

      return {
        connected: true,
        version: stats.redis_version || 'unknown',
        usedMemory: stats.used_memory_human || 'unknown',
        connectedClients: parseInt(stats.connected_clients) || 0,
        totalKeys: dbSize
      };
    } catch (error) {
      return {
        connected: false,
        version: 'unknown',
        usedMemory: 'unknown',
        connectedClients: 0,
        totalKeys: 0
      };
    }
  }

  private parseRedisInfo(info: string): Record<string, string> {
    const lines = info.split('\r\n');
    const result: Record<string, string> = {};

    for (const line of lines) {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          result[key] = value;
        }
      }
    }

    return result;
  }

  private handleRedisMessage(channel: string, message: string) {
    try {
      const data = JSON.parse(message);
      
      switch (channel) {
        case 'game:state:updates':
          this.emit('stateUpdate', data);
          break;
        case 'game:player:presence':
          this.emit('playerPresence', data);
          break;
        case 'admin:alerts':
          this.logEvent(data.type || 'info', data.source || 'system', data.message, data.details);
          break;
      }
    } catch (error) {
      console.error('Error handling Redis message:', error);
    }
  }

  logEvent(type: 'info' | 'warning' | 'error', source: string, message: string, details?: any) {
    const event: AdminEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      source: source as any,
      message,
      details
    };

    this.events.unshift(event);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    this.emit('event', event);

    // Publish to Redis for other admin instances
    this.redis.publish('admin:events', JSON.stringify(event));
  }

  getRecentEvents(limit = 20): AdminEvent[] {
    return this.events.slice(0, limit);
  }

  async searchPlayers(query: string): Promise<Player[]> {
    const players = await this.redis.smembers('game:players');
    const results: Player[] = [];

    for (const playerId of players) {
      const playerData = await this.redis.hgetall(`game:state:${playerId}`);
      
      if (
        playerId.toLowerCase().includes(query.toLowerCase()) ||
        (playerData.name && playerData.name.toLowerCase().includes(query.toLowerCase()))
      ) {
        results.push({
          id: playerId,
          name: playerData.name || 'Unknown',
          score: parseInt(playerData.score) || 0,
          level: playerData.level as any || 'novice',
          status: playerData.status as any || 'idle',
          location: playerData.location as any || 'town'
        });
      }
    }

    return results;
  }

  async getPlayerDetails(playerId: string): Promise<GameState | null> {
    const playerData = await this.redis.hgetall(`game:state:${playerId}`);
    if (!playerData || Object.keys(playerData).length === 0) {
      return null;
    }

    // Get full game state
    const pipeline = this.redis.pipeline();
    pipeline.smembers(`game:inventory:${playerId}`);
    pipeline.hgetall(`game:quest:active:${playerId}`);
    pipeline.smembers(`game:quest:completed:${playerId}`);
    pipeline.hgetall(`game:session:${playerId}`);
    
    const results = await pipeline.exec();
    
    // Assemble game state (similar to RedisStateManager)
    // ... implementation details ...
    
    return null; // Placeholder
  }

  async disconnect() {
    await this.redis.quit();
  }
} 