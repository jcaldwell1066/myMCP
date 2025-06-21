import { EventBroadcaster } from '../EventBroadcaster';
import Redis from 'ioredis';

// Mock Redis
jest.mock('ioredis');

describe('EventBroadcaster Tests', () => {
  let broadcaster: EventBroadcaster;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    // Create mock Redis client
    mockRedis = {
      publish: jest.fn().mockResolvedValue(1),
      sadd: jest.fn().mockResolvedValue(1),
      setex: jest.fn().mockResolvedValue('OK'),
      disconnect: jest.fn(),
      on: jest.fn()
    } as any;

    // Mock Redis constructor
    (Redis as any).mockImplementation(() => mockRedis);

    broadcaster = new EventBroadcaster('redis://localhost:6379');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should create Redis client when URL provided', () => {
      expect(Redis).toHaveBeenCalledWith('redis://localhost:6379');
    });

    test('should not create Redis client without URL', () => {
      jest.clearAllMocks();
      const broadcasterWithoutRedis = new EventBroadcaster();
      expect(Redis).not.toHaveBeenCalled();
    });
  });

  describe('Chat Broadcasting', () => {
    test('should broadcast chat messages', async () => {
      const playerId = 'player-123';
      const message = 'Hello world';
      const response = 'Welcome!';

      await broadcaster.broadcastChat(playerId, message, response);

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:chat',
        expect.stringContaining('"playerId":"player-123"')
      );
      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:chat',
        expect.stringContaining('"message":"Hello world"')
      );
      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:chat',
        expect.stringContaining('"response":"Welcome!"')
      );
    });
  });

  describe('Quest Events', () => {
    test('should broadcast quest started', async () => {
      await broadcaster.broadcastQuestStarted(
        'player-123',
        'quest-456',
        'Dragon Slayer',
        'Defeat the ancient dragon'
      );

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:quest:started',
        expect.stringContaining('"questId":"quest-456"')
      );
    });

    test('should broadcast quest completed', async () => {
      const rewards = { score: 100, items: ['sword'] };
      
      await broadcaster.broadcastQuestCompleted(
        'player-123',
        'quest-456',
        'Dragon Slayer',
        rewards
      );

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:quest:completed',
        expect.stringContaining('"questId":"quest-456"')
      );
      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:quest:completed',
        expect.stringContaining('"rewards"')
      );
    });

    test('should broadcast quest step completed', async () => {
      await broadcaster.broadcastQuestStepCompleted(
        'player-123',
        'quest-456',
        'step-1',
        'Find the dragon\'s lair'
      );

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:quest:step',
        expect.stringContaining('"stepId":"step-1"')
      );
      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:quest:step',
        expect.stringContaining('"status":"completed"')
      );
    });
  });

  describe('Player Events', () => {
    test('should broadcast level up', async () => {
      await broadcaster.broadcastLevelUp('player-123', 'novice', 'apprentice');

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:player:levelup',
        expect.stringContaining('"oldLevel":"novice"')
      );
      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:player:levelup',
        expect.stringContaining('"newLevel":"apprentice"')
      );
    });

    test('should broadcast achievement', async () => {
      await broadcaster.broadcastAchievement(
        'player-123',
        'First Quest',
        'Completed your first quest!'
      );

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:player:achievement',
        expect.stringContaining('"achievement":"First Quest"')
      );
    });

    test('should broadcast location change', async () => {
      await broadcaster.broadcastLocationChange('player-123', 'town', 'forest');

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:player:location',
        expect.stringContaining('"from":"town"')
      );
      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:player:location',
        expect.stringContaining('"location":"forest"')
      );
    });

    test('should broadcast score change', async () => {
      await broadcaster.broadcastScoreChange('player-123', 100, 150);

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:player:score',
        expect.stringContaining('"oldScore":100')
      );
      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:player:score',
        expect.stringContaining('"newScore":150')
      );
      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:player:score',
        expect.stringContaining('"change":50')
      );
    });
  });

  describe('State Updates', () => {
    test('should broadcast state update', async () => {
      const stateUpdate = {
        player: {
          id: 'player-123',
          name: 'Test Hero',
          score: 200,
          level: 'apprentice' as const,
          status: 'idle' as const,
          location: 'forest' as const
        }
      };

      await broadcaster.broadcastStateUpdate('player-123', stateUpdate);

      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:state:update',
        expect.stringContaining('"playerId":"player-123"')
      );
      expect(mockRedis.publish).toHaveBeenCalledWith(
        'game:state:update',
        expect.stringContaining('"location":"forest"')
      );
    });
  });

  describe('Player Activity Tracking', () => {
    test('should track player activity', async () => {
      await broadcaster.trackPlayerActivity('player-123');

      expect(mockRedis.sadd).toHaveBeenCalledWith('game:players', 'player-123');
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'game:player:player-123:lastActive',
        3600,
        expect.any(String)
      );
    });

    test('should track activity when publishing events', async () => {
      await broadcaster.broadcastChat('player-123', 'Hello', 'Hi');

      expect(mockRedis.sadd).toHaveBeenCalledWith('game:players', 'player-123');
      expect(mockRedis.setex).toHaveBeenCalledWith(
        'game:player:player-123:lastActive',
        3600,
        expect.any(String)
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle publish errors gracefully', async () => {
      mockRedis.publish.mockRejectedValueOnce(new Error('Publish failed'));

      // Should not throw
      await expect(
        broadcaster.broadcastChat('player-123', 'Hello', 'Hi')
      ).resolves.not.toThrow();
    });

    test('should handle Redis not available', async () => {
      const broadcasterWithoutRedis = new EventBroadcaster();
      
      // Should not throw when Redis is not available
      await expect(
        broadcasterWithoutRedis.broadcastChat('player-123', 'Hello', 'Hi')
      ).resolves.not.toThrow();
    });
  });

  describe('Connection Management', () => {
    test('should disconnect Redis client', async () => {
      await broadcaster.disconnect();

      expect(mockRedis.disconnect).toHaveBeenCalled();
    });

    test('should handle disconnect when no Redis client', async () => {
      const broadcasterWithoutRedis = new EventBroadcaster();
      
      // Should not throw
      await expect(broadcasterWithoutRedis.disconnect()).resolves.not.toThrow();
    });
  });

  describe('Event Structure', () => {
    test('should include proper event structure', async () => {
      const beforePublish = Date.now();
      await broadcaster.broadcastChat('player-123', 'Hello', 'Hi');
      const afterPublish = Date.now();

      const publishCall = mockRedis.publish.mock.calls[0];
      const eventData = JSON.parse(publishCall[1] as string);

      expect(eventData).toMatchObject({
        type: 'game:chat',
        playerId: 'player-123',
        timestamp: expect.any(Number),
        data: expect.objectContaining({
          playerId: 'player-123',
          message: 'Hello',
          response: 'Hi',
          type: 'player_message'
        })
      });

      expect(eventData.timestamp).toBeGreaterThanOrEqual(beforePublish);
      expect(eventData.timestamp).toBeLessThanOrEqual(afterPublish);
    });
  });
}); 