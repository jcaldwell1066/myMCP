import { EventBroadcaster } from '../EventBroadcaster';
import Redis from 'ioredis';
import { EventEmitter } from 'events';

// Mock Redis
jest.mock('ioredis');

describe('EventBroadcaster Tests', () => {
  let broadcaster: EventBroadcaster;
  let mockPubClient: jest.Mocked<Redis>;
  let mockSubClient: jest.Mocked<Redis>;
  let eventEmitter: EventEmitter;

  beforeEach(() => {
    // Create mock Redis clients
    mockPubClient = {
      publish: jest.fn().mockResolvedValue(1),
      disconnect: jest.fn(),
      on: jest.fn()
    } as any;

    mockSubClient = {
      subscribe: jest.fn().mockResolvedValue('OK'),
      unsubscribe: jest.fn().mockResolvedValue('OK'),
      on: jest.fn(),
      disconnect: jest.fn()
    } as any;

    // Mock Redis constructor
    (Redis as any).mockImplementation(() => mockPubClient);

    eventEmitter = new EventEmitter();
    broadcaster = new EventBroadcaster();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should create publisher and subscriber clients', () => {
      expect(Redis).toHaveBeenCalledTimes(2);
    });

    test('should handle connection errors gracefully', () => {
      const errorHandler = mockPubClient.on.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];

      expect(() => {
        errorHandler?.(new Error('Connection failed'));
      }).not.toThrow();
    });
  });

  describe('Publishing Events', () => {
    test('should publish player events', async () => {
      const event = {
        type: 'player:joined',
        playerId: 'player-123',
        data: { name: 'TestPlayer' }
      };

      await broadcaster.publishPlayerEvent(event);

      expect(mockPubClient.publish).toHaveBeenCalledWith(
        'game:player:player-123',
        JSON.stringify(event)
      );
    });

    test('should publish quest events', async () => {
      const event = {
        type: 'quest:started',
        questId: 'quest-456',
        playerId: 'player-123',
        data: { title: 'Test Quest' }
      };

      await broadcaster.publishQuestEvent(event);

      expect(mockPubClient.publish).toHaveBeenCalledWith(
        'game:quest:quest-456',
        JSON.stringify(event)
      );
    });

    test('should publish chat messages', async () => {
      const message = {
        id: 'msg-789',
        playerId: 'player-123',
        message: 'Hello world',
        timestamp: new Date()
      };

      await broadcaster.publishChatMessage(message);

      expect(mockPubClient.publish).toHaveBeenCalledWith(
        'game:chat',
        JSON.stringify(message)
      );
    });

    test('should publish state updates', async () => {
      const update = {
        playerId: 'player-123',
        changes: { score: 100, level: 'apprentice' },
        timestamp: new Date()
      };

      await broadcaster.publishStateUpdate(update);

      expect(mockPubClient.publish).toHaveBeenCalledWith(
        'game:state:updates',
        JSON.stringify(update)
      );
    });

    test('should handle publish errors', async () => {
      mockPubClient.publish.mockRejectedValueOnce(new Error('Publish failed'));

      await expect(
        broadcaster.publishPlayerEvent({ type: 'test', playerId: '123' })
      ).rejects.toThrow('Publish failed');
    });
  });

  describe('Subscribing to Events', () => {
    test('should subscribe to player events', async () => {
      const callback = jest.fn();
      
      await broadcaster.subscribeToPlayerEvents('player-123', callback);

      expect(mockSubClient.subscribe).toHaveBeenCalledWith('game:player:player-123');
    });

    test('should subscribe to quest events', async () => {
      const callback = jest.fn();
      
      await broadcaster.subscribeToQuestEvents('quest-456', callback);

      expect(mockSubClient.subscribe).toHaveBeenCalledWith('game:quest:quest-456');
    });

    test('should subscribe to chat messages', async () => {
      const callback = jest.fn();
      
      await broadcaster.subscribeToChatMessages(callback);

      expect(mockSubClient.subscribe).toHaveBeenCalledWith('game:chat');
    });

    test('should subscribe to state updates', async () => {
      const callback = jest.fn();
      
      await broadcaster.subscribeToStateUpdates(callback);

      expect(mockSubClient.subscribe).toHaveBeenCalledWith('game:state:updates');
    });

    test('should handle incoming messages', async () => {
      const callback = jest.fn();
      await broadcaster.subscribeToPlayerEvents('player-123', callback);

      // Simulate incoming message
      const messageHandler = mockSubClient.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      const testEvent = { type: 'test', data: 'test data' };
      messageHandler?.('game:player:player-123', JSON.stringify(testEvent));

      expect(callback).toHaveBeenCalledWith(testEvent);
    });

    test('should handle invalid JSON in messages', async () => {
      const callback = jest.fn();
      await broadcaster.subscribeToChatMessages(callback);

      const messageHandler = mockSubClient.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      // Send invalid JSON
      messageHandler?.('game:chat', 'invalid json {');

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('Unsubscribing from Events', () => {
    test('should unsubscribe from specific channels', async () => {
      await broadcaster.unsubscribeFromPlayerEvents('player-123');

      expect(mockSubClient.unsubscribe).toHaveBeenCalledWith('game:player:player-123');
    });

    test('should unsubscribe from all channels', async () => {
      await broadcaster.unsubscribeAll();

      expect(mockSubClient.unsubscribe).toHaveBeenCalledWith();
    });

    test('should remove event listeners when unsubscribing', async () => {
      const callback = jest.fn();
      
      await broadcaster.subscribeToPlayerEvents('player-123', callback);
      await broadcaster.unsubscribeFromPlayerEvents('player-123');

      // Verify callback is removed (implementation specific)
      expect(broadcaster.getActiveSubscriptions()).not.toContain('game:player:player-123');
    });
  });

  describe('Broadcast Patterns', () => {
    test('should broadcast to multiple players', async () => {
      const playerIds = ['player-1', 'player-2', 'player-3'];
      const event = { type: 'global:announcement', message: 'Server restart' };

      await broadcaster.broadcastToPlayers(playerIds, event);

      expect(mockPubClient.publish).toHaveBeenCalledTimes(3);
      playerIds.forEach(playerId => {
        expect(mockPubClient.publish).toHaveBeenCalledWith(
          `game:player:${playerId}`,
          JSON.stringify(event)
        );
      });
    });

    test('should broadcast to all connected clients', async () => {
      const event = { type: 'system:broadcast', message: 'Global update' };

      await broadcaster.broadcastToAll(event);

      expect(mockPubClient.publish).toHaveBeenCalledWith(
        'game:broadcast',
        JSON.stringify(event)
      );
    });
  });

  describe('Event Filtering', () => {
    test('should filter events by type', async () => {
      const callback = jest.fn();
      const filter = (event: any) => event.type === 'player:joined';

      await broadcaster.subscribeToPlayerEvents('player-123', callback, filter);

      const messageHandler = mockSubClient.on.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];

      // Send matching event
      messageHandler?.(
        'game:player:player-123', 
        JSON.stringify({ type: 'player:joined', data: 'test' })
      );

      // Send non-matching event
      messageHandler?.(
        'game:player:player-123', 
        JSON.stringify({ type: 'player:left', data: 'test' })
      );

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({ type: 'player:joined', data: 'test' });
    });
  });

  describe('Connection Management', () => {
    test('should reconnect on connection loss', async () => {
      const reconnectHandler = mockPubClient.on.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];

      reconnectHandler?.();

      // Verify reconnection logic
      expect(broadcaster.isConnected()).toBe(true);
    });

    test('should clean up resources on disconnect', async () => {
      await broadcaster.disconnect();

      expect(mockPubClient.disconnect).toHaveBeenCalled();
      expect(mockSubClient.disconnect).toHaveBeenCalled();
    });

    test('should handle disconnect errors gracefully', async () => {
      mockPubClient.disconnect.mockRejectedValueOnce(new Error('Disconnect failed'));

      await expect(broadcaster.disconnect()).resolves.not.toThrow();
    });
  });

  describe('Performance', () => {
    test('should batch multiple publishes', async () => {
      const events = Array(10).fill(null).map((_, i) => ({
        type: 'test',
        playerId: `player-${i}`,
        data: { index: i }
      }));

      await broadcaster.publishBatch(events);

      // Should use pipeline for better performance
      expect(mockPubClient.pipeline).toHaveBeenCalled();
    });

    test('should handle rate limiting', async () => {
      const startTime = Date.now();
      
      // Publish many events rapidly
      const promises = Array(100).fill(null).map(() =>
        broadcaster.publishPlayerEvent({ type: 'test', playerId: '123' })
      );

      await Promise.all(promises);

      const duration = Date.now() - startTime;
      
      // Should implement rate limiting
      expect(duration).toBeGreaterThan(100); // At least 1ms per event
    });
  });
});

// Add type extensions for testing
declare module '../EventBroadcaster' {
  interface EventBroadcaster {
    getActiveSubscriptions(): string[];
    isConnected(): boolean;
    broadcastToPlayers(playerIds: string[], event: any): Promise<void>;
    broadcastToAll(event: any): Promise<void>;
    subscribeToPlayerEvents(
      playerId: string, 
      callback: Function, 
      filter?: Function
    ): Promise<void>;
    unsubscribeFromPlayerEvents(playerId: string): Promise<void>;
    unsubscribeAll(): Promise<void>;
    disconnect(): Promise<void>;
    publishBatch(events: any[]): Promise<void>;
  }
} 