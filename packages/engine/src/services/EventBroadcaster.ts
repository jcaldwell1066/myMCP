import Redis from 'ioredis';
import { GameState } from '@mymcp/types';

export interface GameEvent {
  type: string;
  playerId: string;
  timestamp: number;
  data: any;
}

export class EventBroadcaster {
  private redis: Redis | null = null;
  private enabled: boolean = false;

  constructor(redisUrl?: string) {
    if (redisUrl) {
      try {
        this.redis = new Redis(redisUrl, {
          connectTimeout: 10000,
          retryStrategy: (times: number) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          enableOfflineQueue: true
        });
        
        // Add error handler to prevent unhandled error warnings
        this.redis.on('error', (err) => {
          console.error('[EventBroadcaster] Redis client error:', err);
        });
        
        this.enabled = true;
        console.log('📡 Event broadcaster initialized');
      } catch (error) {
        console.warn('⚠️ Event broadcaster not available:', error);
      }
    }
  }

  // Broadcast chat messages
  async broadcastChat(playerId: string, message: string, response: string) {
    await this.publish('game:chat', {
      playerId,
      message,
      response,
      type: 'player_message'
    });
  }

  // Broadcast quest events
  async broadcastQuestStarted(playerId: string, questId: string, questName: string, description?: string) {
    await this.publish('game:quest:started', {
      playerId,
      questId,
      questName,
      description
    });
  }

  async broadcastQuestCompleted(playerId: string, questId: string, questName: string, rewards?: any) {
    await this.publish('game:quest:completed', {
      playerId,
      questId,
      questName,
      rewards
    });
  }

  async broadcastQuestStepCompleted(playerId: string, questId: string, stepId: string, stepName: string) {
    await this.publish('game:quest:step', {
      playerId,
      questId,
      stepId,
      stepName,
      status: 'completed'
    });
  }

  // Broadcast player events
  async broadcastLevelUp(playerId: string, oldLevel: string, newLevel: string) {
    await this.publish('game:player:levelup', {
      playerId,
      oldLevel,
      newLevel
    });
  }

  async broadcastAchievement(playerId: string, achievement: string, description?: string) {
    await this.publish('game:player:achievement', {
      playerId,
      achievement,
      description
    });
  }

  async broadcastLocationChange(playerId: string, from: string, to: string, broadcast: boolean = true) {
    await this.publish('game:player:location', {
      playerId,
      from,
      location: to,
      broadcast
    });
  }

  async broadcastScoreChange(playerId: string, oldScore: number, newScore: number) {
    await this.publish('game:player:score', {
      playerId,
      oldScore,
      newScore,
      change: newScore - oldScore
    });
  }

  // Broadcast state updates
  async broadcastStateUpdate(playerId: string, state: Partial<GameState>) {
    await this.publish('game:state:update', {
      playerId,
      player: state.player,
      quests: state.quests,
      inventory: state.inventory,
      location: state.player?.location
    });
  }

  // Track active players
  async trackPlayerActivity(playerId: string) {
    if (this.redis) {
      await this.redis.sadd('game:players', playerId);
      await this.redis.setex(`game:player:${playerId}:lastActive`, 3600, Date.now().toString());
    }
  }

  // Generic event publisher
  private async publish(channel: string, data: any) {
    if (!this.enabled || !this.redis) return;

    const event: GameEvent = {
      type: channel,
      playerId: data.playerId,
      timestamp: Date.now(),
      data
    };

    try {
      await this.redis.publish(channel, JSON.stringify(event));
      // Also track player activity
      if (data.playerId) {
        await this.trackPlayerActivity(data.playerId);
      }
    } catch (error) {
      console.error(`Failed to publish event to ${channel}:`, error);
    }
  }

  async disconnect() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }
} 