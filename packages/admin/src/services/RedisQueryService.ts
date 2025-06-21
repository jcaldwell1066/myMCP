import { Redis } from 'ioredis';
import { config } from '../config';

export interface RedisQuery {
  command: string;
  args: string[];
  timestamp: Date;
  executionTime?: number;
  result?: any;
  error?: string;
}

export interface RedisKeyInfo {
  key: string;
  type: string;
  ttl: number;
  memory?: number;
}

export class RedisQueryService {
  private redis: Redis;
  private queryHistory: RedisQuery[] = [];
  private maxHistorySize = 50;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      connectTimeout: 10000,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`Redis connection retry attempt ${times}, waiting ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true;
        }
        return false;
      }
    });
    
    this.redis.on('error', (err) => {
      console.error('Redis Query Service error:', err.message);
    });
    
    this.redis.on('connect', () => {
      console.log('Redis Query Service connected');
    });
  }

  async executeQuery(command: string, args: string[] = []): Promise<RedisQuery> {
    const query: RedisQuery = {
      command: command.toUpperCase(),
      args,
      timestamp: new Date()
    };

    // Check if command is allowed
    if (!this.isCommandAllowed(query.command)) {
      query.error = `Command '${query.command}' is not allowed`;
      this.addToHistory(query);
      throw new Error(query.error);
    }

    // Warn about dangerous commands
    if (this.isDangerousCommand(query.command)) {
      console.warn(`Executing dangerous command: ${query.command}`);
    }

    const start = Date.now();

    try {
      // Execute the Redis command using type-safe wrapper
      const result = await this.executeRedisCommand(query.command, args);
      query.executionTime = Date.now() - start;
      query.result = this.formatResult(result);
      this.addToHistory(query);
      return query;
    } catch (error) {
      query.executionTime = Date.now() - start;
      query.error = error instanceof Error ? error.message : 'Unknown error';
      this.addToHistory(query);
      throw error;
    }
  }

  /**
   * Type-safe wrapper for executing Redis commands
   */
  private async executeRedisCommand(command: string, args: string[]): Promise<any> {
    const cmd = command.toLowerCase();
    
    // Map commands to their Redis client methods
    switch (cmd) {
      // String commands
      case 'get': return this.redis.get(args[0]);
      case 'set': return this.redis.set(args[0], args[1]);
      case 'mget': return this.redis.mget(...args);
      case 'mset': return this.redis.mset(...args);
      
      // Hash commands
      case 'hget': return this.redis.hget(args[0], args[1]);
      case 'hgetall': return this.redis.hgetall(args[0]);
      case 'hset': return this.redis.hset(args[0], args[1], args[2]);
      case 'hmset': return this.redis.hmset(args[0], ...args.slice(1));
      
      // Set commands
      case 'smembers': return this.redis.smembers(args[0]);
      case 'sadd': return this.redis.sadd(args[0], ...args.slice(1));
      case 'srem': return this.redis.srem(args[0], ...args.slice(1));
      case 'scard': return this.redis.scard(args[0]);
      
      // Sorted set commands
      case 'zrange': 
        if (args[args.length - 1]?.toUpperCase() === 'WITHSCORES') {
          return this.redis.zrange(args[0], args[1], args[2], 'WITHSCORES');
        }
        return this.redis.zrange(args[0], args[1], args[2]);
      case 'zrevrange':
        if (args[args.length - 1]?.toUpperCase() === 'WITHSCORES') {
          return this.redis.zrevrange(args[0], args[1], args[2], 'WITHSCORES');
        }
        return this.redis.zrevrange(args[0], args[1], args[2]);
      
      // Key commands
      case 'keys': return this.redis.keys(args[0]);
      case 'scan': {
        // Handle scan command - simplified approach
        const cursor = args[0] || '0';
        // For now, just support basic scan without options
        // Full scan command support would require complex argument parsing
        return this.redis.scan(cursor);
      }
      case 'type': return this.redis.type(args[0]);
      case 'ttl': return this.redis.ttl(args[0]);
      case 'exists': return this.redis.exists(...args);
      case 'del': return this.redis.del(...args);
      case 'expire': return this.redis.expire(args[0], parseInt(args[1]));
      
      // Server commands
      case 'info': return this.redis.info(...args);
      case 'ping': return this.redis.ping();
      case 'dbsize': return this.redis.dbsize();
      case 'flushdb': return this.redis.flushdb();
      case 'flushall': return this.redis.flushall();
      
      // Client commands
      case 'client':
        if (args[0]?.toLowerCase() === 'list') return this.redis.client('LIST');
        throw new Error(`Unsupported CLIENT subcommand: ${args[0]}`);
      
      case 'config':
        if (args[0]?.toLowerCase() === 'get') return this.redis.config('GET', args[1]);
        throw new Error(`Unsupported CONFIG subcommand: ${args[0]}`);
      
      default:
        throw new Error(`Unsupported command: ${command}`);
    }
  }

  async searchKeys(pattern: string, limit = 100): Promise<RedisKeyInfo[]> {
    const keys: RedisKeyInfo[] = [];
    const stream = this.redis.scanStream({
      match: pattern,
      count: 100
    });

    return new Promise((resolve, reject) => {
      stream.on('data', async (resultKeys: string[]) => {
        for (const key of resultKeys) {
          if (keys.length >= limit) {
            stream.destroy();
            break;
          }

          try {
            const [type, ttl] = await Promise.all([
              this.redis.type(key),
              this.redis.ttl(key)
            ]);

            keys.push({ key, type, ttl });
          } catch (error) {
            console.error(`Error getting info for key ${key}:`, error);
          }
        }
      });

      stream.on('end', () => resolve(keys));
      stream.on('error', reject);
    });
  }

  async getKeyDetails(key: string): Promise<any> {
    const type = await this.redis.type(key);
    const ttl = await this.redis.ttl(key);
    let value: any;
    let size = 0;

    switch (type) {
      case 'string':
        value = await this.redis.get(key);
        size = value ? value.length : 0;
        break;
      case 'hash':
        value = await this.redis.hgetall(key);
        size = Object.keys(value).length;
        break;
      case 'list':
        value = await this.redis.lrange(key, 0, 99); // Limit to first 100 items
        size = await this.redis.llen(key);
        break;
      case 'set':
        const members = await this.redis.smembers(key);
        value = members.slice(0, 100); // Limit to first 100 members
        size = await this.redis.scard(key);
        break;
      case 'zset':
        value = await this.redis.zrange(key, 0, 99, 'WITHSCORES');
        size = await this.redis.zcard(key);
        break;
      default:
        value = null;
    }

    return {
      key,
      type,
      ttl,
      size,
      value: this.formatValue(value, type)
    };
  }

  async getRedisStats(): Promise<any> {
    const info = await this.redis.info();
    const dbSize = await this.redis.dbsize();
    const stats = this.parseRedisInfo(info);

    return {
      version: stats.redis_version,
      mode: stats.redis_mode || 'standalone',
      connectedClients: parseInt(stats.connected_clients) || 0,
      usedMemory: stats.used_memory_human,
      usedMemoryPeak: stats.used_memory_peak_human,
      totalKeys: dbSize,
      uptime: parseInt(stats.uptime_in_seconds) || 0,
      commandsProcessed: parseInt(stats.total_commands_processed) || 0,
      instantaneousOps: parseInt(stats.instantaneous_ops_per_sec) || 0,
      keyspaceHits: parseInt(stats.keyspace_hits) || 0,
      keyspaceMisses: parseInt(stats.keyspace_misses) || 0,
      evictedKeys: parseInt(stats.evicted_keys) || 0,
      expiredKeys: parseInt(stats.expired_keys) || 0
    };
  }

  async flushHistory(): Promise<void> {
    this.queryHistory = [];
  }

  getQueryHistory(): RedisQuery[] {
    return [...this.queryHistory];
  }

  private isCommandAllowed(command: string): boolean {
    return config.redis.allowedCommands.includes(command) || 
           config.redis.dangerousCommands.includes(command);
  }

  private isDangerousCommand(command: string): boolean {
    return config.redis.dangerousCommands.includes(command);
  }

  private addToHistory(query: RedisQuery) {
    this.queryHistory.unshift(query);
    if (this.queryHistory.length > this.maxHistorySize) {
      this.queryHistory = this.queryHistory.slice(0, this.maxHistorySize);
    }
  }

  private formatResult(result: any): any {
    if (result === null || result === undefined) return result;
    
    // Handle large results
    if (Array.isArray(result) && result.length > config.redis.maxQueryResults) {
      return {
        truncated: true,
        length: result.length,
        data: result.slice(0, config.redis.maxQueryResults)
      };
    }

    // Handle buffers
    if (Buffer.isBuffer(result)) {
      return result.toString('utf8');
    }

    if (Array.isArray(result)) {
      return result.map(item => this.formatResult(item));
    }

    return result;
  }

  private formatValue(value: any, type: string): any {
    if (type === 'string' && value && value.length > 1000) {
      return {
        truncated: true,
        length: value.length,
        preview: value.substring(0, 1000) + '...'
      };
    }

    if (type === 'zset' && Array.isArray(value)) {
      // Format sorted set with scores
      const formatted: any[] = [];
      for (let i = 0; i < value.length; i += 2) {
        formatted.push({
          member: value[i],
          score: parseFloat(value[i + 1])
        });
      }
      return formatted;
    }

    return value;
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

  // Saved queries functionality
  private savedQueries: Map<string, { name: string; command: string; args: string[]; description?: string }> = new Map([
    ['all-players', {
      name: 'All Players',
      command: 'SMEMBERS',
      args: ['game:players'],
      description: 'List all registered players'
    }],
    ['leaderboard', {
      name: 'Top 10 Leaderboard',
      command: 'ZREVRANGE',
      args: ['game:leaderboard:score', '0', '9', 'WITHSCORES'],
      description: 'Get top 10 players by score'
    }],
    ['redis-info', {
      name: 'Redis Server Info',
      command: 'INFO',
      args: [],
      description: 'Get Redis server information'
    }],
    ['active-sessions', {
      name: 'Active Sessions',
      command: 'KEYS',
      args: ['game:session:*'],
      description: 'Find all active game sessions'
    }]
  ]);

  getSavedQueries() {
    return Array.from(this.savedQueries.entries()).map(([id, query]) => ({
      id,
      ...query
    }));
  }

  async executeSavedQuery(queryId: string): Promise<RedisQuery> {
    const savedQuery = this.savedQueries.get(queryId);
    if (!savedQuery) {
      throw new Error(`Saved query '${queryId}' not found`);
    }

    return this.executeQuery(savedQuery.command, savedQuery.args);
  }

  addSavedQuery(id: string, name: string, command: string, args: string[], description?: string) {
    this.savedQueries.set(id, { name, command, args, description });
  }

  removeSavedQuery(id: string) {
    this.savedQueries.delete(id);
  }

  async disconnect() {
    await this.redis.quit();
  }
} 