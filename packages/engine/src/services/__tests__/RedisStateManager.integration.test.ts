import { RedisStateManager } from '../RedisStateManager';
import { GameState } from '@mymcp/types';
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

describe('RedisStateManager Integration Tests', () => {
  let manager: RedisStateManager;
  let redis: Redis;
  const testPlayerIds = ['alice-test', 'bob-test', 'charlie-test'];

  beforeAll(async () => {
    redis = new Redis(REDIS_URL);
    manager = new RedisStateManager(REDIS_URL);
    
    // Clean up any existing test data
    for (const playerId of testPlayerIds) {
      await redis.del(
        `game:state:${playerId}`,
        `game:inventory:${playerId}`,
        `game:quest:active:${playerId}`,
        `game:quest:completed:${playerId}`,
        `game:session:${playerId}`
      );
      await redis.srem('game:players', playerId);
      await redis.zrem('game:leaderboard:score', playerId);
    }
    
    // Also clean up any leftover test data from previous runs
    await redis.zrem('game:leaderboard:score', 'test-player-debug');
  });

  afterAll(async () => {
    // Clean up test data
    for (const playerId of testPlayerIds) {
      await redis.del(
        `game:state:${playerId}`,
        `game:inventory:${playerId}`,
        `game:quest:active:${playerId}`,
        `game:quest:completed:${playerId}`,
        `game:session:${playerId}`
      );
      await redis.srem('game:players', playerId);
      await redis.zrem('game:leaderboard:score', playerId);
    }
    
    await redis.zrem('game:leaderboard:score', 'test-player-debug');
    
    await manager.disconnect();
    await redis.quit();
  });

  describe('Player State Management', () => {
    test('should create and retrieve player state', async () => {
      const playerId = testPlayerIds[0];
      const createdState = await manager.createPlayerState(playerId, 'Alice Test');
      
      expect(createdState).toBeValidGameState();
      expect(createdState.player.id).toBe(playerId);
      expect(createdState.player.name).toBe('Alice Test');
      
      const retrievedState = await manager.getPlayerState(playerId);
      expect(retrievedState).toBeValidGameState();
      expect(retrievedState?.player.id).toBe(playerId);
    });

    test('should return null for non-existent player', async () => {
      const state = await manager.getPlayerState('non-existent-player');
      expect(state).toBeNull();
    });

    test('should update player attributes', async () => {
      const playerId = testPlayerIds[1];
      await manager.createPlayerState(playerId, 'Bob Test');
      
      await manager.updatePlayerState(playerId, {
        player: {
          id: playerId,
          name: 'Bob Test',
          score: 250,
          level: 'expert',
          status: 'in-quest',
          location: 'cave'
        }
      });
      
      const updatedState = await manager.getPlayerState(playerId);
      expect(updatedState?.player.score).toBe(250);
      expect(updatedState?.player.level).toBe('expert');
      expect(updatedState?.player.location).toBe('cave');
    });
  });

  describe('Location Management', () => {
    test('should track player locations', async () => {
      const playerId = testPlayerIds[2];
      await manager.createPlayerState(playerId, 'Charlie Test');
      
      // Move player to forest
      await manager.movePlayer(playerId, 'forest');
      
      const playersInForest = await manager.getPlayersInLocation('forest');
      expect(playersInForest).toContain(playerId);
      
      // Move to cave
      await manager.movePlayer(playerId, 'cave');
      
      const playersInCave = await manager.getPlayersInLocation('cave');
      const playersStillInForest = await manager.getPlayersInLocation('forest');
      
      expect(playersInCave).toContain(playerId);
      expect(playersStillInForest).not.toContain(playerId);
    });

    test('should emit location change events', (done) => {
      const playerId = testPlayerIds[0];
      
      manager.once('locationChange', (event) => {
        expect(event.playerId).toBe(playerId);
        expect(event.from).toBe('town');
        expect(event.to).toBe('forest');
        done();
      });
      
      manager.movePlayer(playerId, 'forest');
    });
  });

  describe('Leaderboard Management', () => {
    test('should maintain score leaderboard', async () => {
      // Set up scores
      await manager.updateScore(testPlayerIds[0], 300);
      await manager.updateScore(testPlayerIds[1], 500);
      await manager.updateScore(testPlayerIds[2], 100);
      
      const leaderboard = await manager.getLeaderboard(3);
      
      expect(leaderboard).toHaveLength(3);
      expect(leaderboard[0]).toEqual({ playerId: testPlayerIds[1], score: 500 });
      expect(leaderboard[1]).toEqual({ playerId: testPlayerIds[0], score: 300 });
      expect(leaderboard[2]).toEqual({ playerId: testPlayerIds[2], score: 100 });
    });
  });

  describe('Multiplayer Features', () => {
    test('should list all players', async () => {
      const allPlayers = await manager.getAllPlayers();
      
      // Should contain at least our test players
      expect(allPlayers).toEqual(expect.arrayContaining(testPlayerIds));
    });

    test('should handle concurrent updates', async () => {
      const playerId = testPlayerIds[0];
      
      // Simulate concurrent updates
      const updates = Promise.all([
        manager.updatePlayerState(playerId, {
          player: { 
            id: playerId, 
            name: 'Alice Test',
            score: 400,
            level: 'expert',
            status: 'idle',
            location: 'town'
          }
        }),
        manager.updateScore(playerId, 400),
        manager.movePlayer(playerId, 'shop')
      ]);
      
      await expect(updates).resolves.toBeDefined();
      
      const finalState = await manager.getPlayerState(playerId);
      expect(finalState?.player.score).toBe(400);
      expect(finalState?.player.location).toBe('shop');
    });
  });

  describe('State Update Events', () => {
    test.skip('should publish and receive state updates', (done) => {
      const playerId = testPlayerIds[0];
      
      manager.once('stateUpdate', (update) => {
        expect(update.playerId).toBe(playerId);
        expect(update.updates.player?.score).toBe(600);
        done();
      });
      
      // Give subscription time to set up (increased for remote Redis)
      setTimeout(() => {
        manager.updatePlayerState(playerId, {
          player: {
            id: playerId,
            name: 'Alice Test',
            score: 600,
            level: 'master',
            status: 'idle',
            location: 'town'
          }
        });
      }, 500); // Increased delay for remote Redis
    }, 15000); // Increased timeout for remote Redis
  });
}); 