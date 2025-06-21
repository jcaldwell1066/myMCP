import { GameSession, ChatMessage } from '@mymcp/types';
import { v4 as uuidv4 } from 'uuid';

describe('GameSession Model Tests', () => {
  describe('Session Creation', () => {
    test('should create a valid game session', () => {
      const now = new Date();
      const session: GameSession = {
        id: uuidv4(),
        startTime: now,
        lastAction: now,
        turnCount: 0,
        conversationHistory: []
      };

      expect(session.id).toBeDefined();
      expect(session.startTime).toEqual(now);
      expect(session.lastAction).toEqual(now);
      expect(session.turnCount).toBe(0);
      expect(session.conversationHistory).toHaveLength(0);
    });

    test('should create session with existing conversation history', () => {
      const messages: ChatMessage[] = [
        createTestChatMessage({ sender: 'player', message: 'Hello' }),
        createTestChatMessage({ sender: 'bot', message: 'Welcome!' })
      ];

      const session = createTestSession({ conversationHistory: messages });
      expect(session.conversationHistory).toHaveLength(2);
    });
  });

  describe('Session Duration', () => {
    test('should calculate session duration', () => {
      const startTime = new Date('2024-01-01T10:00:00Z');
      const lastAction = new Date('2024-01-01T11:30:00Z');
      
      const session = createTestSession({ startTime, lastAction });
      const duration = getSessionDuration(session);
      
      expect(duration.hours).toBe(1);
      expect(duration.minutes).toBe(30);
      expect(duration.seconds).toBe(0);
      expect(duration.totalMinutes).toBe(90);
    });

    test('should handle sessions less than a minute', () => {
      const startTime = new Date();
      const lastAction = new Date(startTime.getTime() + 45000); // 45 seconds later
      
      const session = createTestSession({ startTime, lastAction });
      const duration = getSessionDuration(session);
      
      expect(duration.hours).toBe(0);
      expect(duration.minutes).toBe(0);
      expect(duration.seconds).toBe(45);
    });
  });

  describe('Session Activity', () => {
    test('should determine if session is active', () => {
      const activeSession = createTestSession({
        lastAction: new Date()
      });
      expect(isSessionActive(activeSession, 5)).toBe(true);

      const inactiveSession = createTestSession({
        lastAction: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago
      });
      expect(isSessionActive(inactiveSession, 5)).toBe(false);
    });

    test('should calculate average turn duration', () => {
      const session = createTestSession({
        startTime: new Date('2024-01-01T10:00:00Z'),
        lastAction: new Date('2024-01-01T10:30:00Z'),
        turnCount: 10
      });

      const avgDuration = getAverageTurnDuration(session);
      expect(avgDuration).toBe(180); // 180 seconds per turn
    });
  });

  describe('Conversation History', () => {
    test('should add messages to conversation history', () => {
      const session = createTestSession();
      const message = createTestChatMessage({
        sender: 'player',
        message: 'Start quest'
      });

      const updatedSession = addMessageToSession(session, message);
      expect(updatedSession.conversationHistory).toHaveLength(1);
      expect(updatedSession.turnCount).toBe(1);
      expect(updatedSession.lastAction).toEqual(message.timestamp);
    });

    test('should maintain message order', () => {
      const session = createTestSession();
      const messages = [
        createTestChatMessage({ message: 'First', timestamp: new Date('2024-01-01T10:00:00Z') }),
        createTestChatMessage({ message: 'Second', timestamp: new Date('2024-01-01T10:01:00Z') }),
        createTestChatMessage({ message: 'Third', timestamp: new Date('2024-01-01T10:02:00Z') })
      ];

      const updatedSession = messages.reduce((sess, msg) => 
        addMessageToSession(sess, msg), session
      );

      expect(updatedSession.conversationHistory[0].message).toBe('First');
      expect(updatedSession.conversationHistory[2].message).toBe('Third');
    });

    test('should limit conversation history size', () => {
      const session = createTestSession();
      const messages = Array(150).fill(null).map((_, i) => 
        createTestChatMessage({ message: `Message ${i}` })
      );

      const updatedSession = messages.reduce((sess, msg) => 
        addMessageToSession(sess, msg, 100), session
      );

      expect(updatedSession.conversationHistory).toHaveLength(100);
      expect(updatedSession.conversationHistory[0].message).toBe('Message 50');
    });
  });

  describe('Session Statistics', () => {
    test('should calculate message statistics', () => {
      const messages: ChatMessage[] = [
        createTestChatMessage({ sender: 'player', type: 'chat' }),
        createTestChatMessage({ sender: 'player', type: 'chat' }),
        createTestChatMessage({ sender: 'bot', type: 'chat' }),
        createTestChatMessage({ sender: 'bot', type: 'system' }),
        createTestChatMessage({ sender: 'bot', type: 'quest' })
      ];

      const session = createTestSession({ conversationHistory: messages });
      const stats = getSessionStatistics(session);

      expect(stats.totalMessages).toBe(5);
      expect(stats.playerMessages).toBe(2);
      expect(stats.botMessages).toBe(3);
      expect(stats.messageTypes.chat).toBe(3);
      expect(stats.messageTypes.system).toBe(1);
      expect(stats.messageTypes.quest).toBe(1);
    });
  });
});

describe('ChatMessage Model Tests', () => {
  describe('Message Creation', () => {
    test('should create valid chat message', () => {
      const message: ChatMessage = {
        id: uuidv4(),
        timestamp: new Date(),
        sender: 'player',
        message: 'Hello world',
        type: 'chat'
      };

      expect(message.id).toBeDefined();
      expect(message.timestamp).toBeInstanceOf(Date);
      expect(message.sender).toBe('player');
      expect(message.message).toBe('Hello world');
      expect(message.type).toBe('chat');
    });

    test('should create message with metadata', () => {
      const message = createTestChatMessage({
        sender: 'bot',
        metadata: {
          provider: 'openai',
          model: 'gpt-4',
          tokensUsed: 150,
          responseTime: 1200,
          cached: false,
          confidence: 0.95,
          contentFiltered: false
        }
      });

      expect(message.metadata).toBeDefined();
      expect(message.metadata?.provider).toBe('openai');
      expect(message.metadata?.tokensUsed).toBe(150);
      expect(message.metadata?.confidence).toBe(0.95);
    });
  });

  describe('Message Validation', () => {
    test('should validate message content', () => {
      const validMessages = [
        'Hello',
        'This is a longer message with multiple words',
        'Messages can have numbers 123 and symbols !@#',
        'A'.repeat(1000) // Long message
      ];

      validMessages.forEach(content => {
        expect(isValidMessageContent(content)).toBe(true);
      });

      const invalidMessages = [
        '',
        ' ',
        'A'.repeat(5001) // Too long
      ];

      invalidMessages.forEach(content => {
        expect(isValidMessageContent(content)).toBe(false);
      });
    });

    test('should validate message types', () => {
      const validTypes: ChatMessage['type'][] = ['chat', 'system', 'quest'];
      
      validTypes.forEach(type => {
        const message = createTestChatMessage({ type });
        expect(isValidMessageType(message.type)).toBe(true);
      });
    });
  });

  describe('Message Filtering', () => {
    test('should filter messages by sender', () => {
      const messages: ChatMessage[] = [
        createTestChatMessage({ sender: 'player' }),
        createTestChatMessage({ sender: 'bot' }),
        createTestChatMessage({ sender: 'player' }),
        createTestChatMessage({ sender: 'bot' })
      ];

      const playerMessages = filterMessagesBySender(messages, 'player');
      expect(playerMessages).toHaveLength(2);
      expect(playerMessages.every(m => m.sender === 'player')).toBe(true);
    });

    test('should filter messages by type', () => {
      const messages: ChatMessage[] = [
        createTestChatMessage({ type: 'chat' }),
        createTestChatMessage({ type: 'system' }),
        createTestChatMessage({ type: 'quest' }),
        createTestChatMessage({ type: 'chat' })
      ];

      const chatMessages = filterMessagesByType(messages, 'chat');
      expect(chatMessages).toHaveLength(2);
      
      const systemMessages = filterMessagesByType(messages, 'system');
      expect(systemMessages).toHaveLength(1);
    });

    test('should filter messages by time range', () => {
      const now = new Date();
      const messages: ChatMessage[] = [
        createTestChatMessage({ timestamp: new Date(now.getTime() - 3600000) }), // 1 hour ago
        createTestChatMessage({ timestamp: new Date(now.getTime() - 1800000) }), // 30 min ago
        createTestChatMessage({ timestamp: new Date(now.getTime() - 300000) }),  // 5 min ago
        createTestChatMessage({ timestamp: now })
      ];

      const recentMessages = filterMessagesByTimeRange(
        messages,
        new Date(now.getTime() - 600000), // Last 10 minutes
        now
      );
      expect(recentMessages).toHaveLength(2);
    });
  });

  describe('Message Analysis', () => {
    test('should extract quest-related messages', () => {
      const messages: ChatMessage[] = [
        createTestChatMessage({ type: 'quest', message: 'Quest started' }),
        createTestChatMessage({ type: 'chat', message: 'I want to start a quest' }),
        createTestChatMessage({ type: 'quest', message: 'Quest completed' }),
        createTestChatMessage({ type: 'system', message: 'System update' })
      ];

      const questMessages = extractQuestMessages(messages);
      expect(questMessages).toHaveLength(3); // Including chat message about quest
    });

    test('should calculate response times', () => {
      const messages: ChatMessage[] = [
        createTestChatMessage({ 
          sender: 'player', 
          timestamp: new Date('2024-01-01T10:00:00Z') 
        }),
        createTestChatMessage({ 
          sender: 'bot', 
          timestamp: new Date('2024-01-01T10:00:02Z'),
          metadata: { responseTime: 2000 }
        }),
        createTestChatMessage({ 
          sender: 'player', 
          timestamp: new Date('2024-01-01T10:00:05Z') 
        }),
        createTestChatMessage({ 
          sender: 'bot', 
          timestamp: new Date('2024-01-01T10:00:06Z'),
          metadata: { responseTime: 1000 }
        })
      ];

      const avgResponseTime = calculateAverageResponseTime(messages);
      expect(avgResponseTime).toBe(1500); // Average of 2000 and 1000
    });
  });
});

// Helper functions
function createTestSession(overrides: Partial<GameSession> = {}): GameSession {
  const now = new Date();
  return {
    id: uuidv4(),
    startTime: now,
    lastAction: now,
    turnCount: 0,
    conversationHistory: [],
    ...overrides
  };
}

function createTestChatMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: uuidv4(),
    timestamp: new Date(),
    sender: 'player',
    message: 'Test message',
    type: 'chat',
    ...overrides
  };
}

function getSessionDuration(session: GameSession) {
  const durationMs = session.lastAction.getTime() - session.startTime.getTime();
  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
  const totalMinutes = Math.floor(durationMs / (1000 * 60));
  
  return { hours, minutes, seconds, totalMinutes };
}

function isSessionActive(session: GameSession, inactivityThresholdMinutes: number): boolean {
  const now = Date.now();
  const lastActionTime = session.lastAction.getTime();
  const inactiveMs = now - lastActionTime;
  return inactiveMs < (inactivityThresholdMinutes * 60 * 1000);
}

function getAverageTurnDuration(session: GameSession): number {
  if (session.turnCount === 0) return 0;
  const totalDurationMs = session.lastAction.getTime() - session.startTime.getTime();
  return Math.floor(totalDurationMs / session.turnCount / 1000); // seconds per turn
}

function addMessageToSession(
  session: GameSession, 
  message: ChatMessage,
  maxHistorySize = Number.MAX_SAFE_INTEGER
): GameSession {
  const newHistory = [...session.conversationHistory, message];
  
  // Trim history if needed
  const trimmedHistory = newHistory.length > maxHistorySize
    ? newHistory.slice(newHistory.length - maxHistorySize)
    : newHistory;
  
  return {
    ...session,
    conversationHistory: trimmedHistory,
    turnCount: session.turnCount + 1,
    lastAction: message.timestamp
  };
}

function getSessionStatistics(session: GameSession) {
  const messages = session.conversationHistory;
  const playerMessages = messages.filter(m => m.sender === 'player').length;
  const botMessages = messages.filter(m => m.sender === 'bot').length;
  
  const messageTypes = messages.reduce((acc, msg) => {
    acc[msg.type] = (acc[msg.type] || 0) + 1;
    return acc;
  }, {} as Record<ChatMessage['type'], number>);
  
  return {
    totalMessages: messages.length,
    playerMessages,
    botMessages,
    messageTypes
  };
}

function isValidMessageContent(content: string): boolean {
  return content.trim().length > 0 && content.length <= 5000;
}

function isValidMessageType(type: ChatMessage['type']): boolean {
  return ['chat', 'system', 'quest'].includes(type);
}

function filterMessagesBySender(messages: ChatMessage[], sender: ChatMessage['sender']): ChatMessage[] {
  return messages.filter(m => m.sender === sender);
}

function filterMessagesByType(messages: ChatMessage[], type: ChatMessage['type']): ChatMessage[] {
  return messages.filter(m => m.type === type);
}

function filterMessagesByTimeRange(
  messages: ChatMessage[], 
  startTime: Date, 
  endTime: Date
): ChatMessage[] {
  return messages.filter(m => 
    m.timestamp >= startTime && m.timestamp <= endTime
  );
}

function extractQuestMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(m => 
    m.type === 'quest' || 
    m.message.toLowerCase().includes('quest')
  );
}

function calculateAverageResponseTime(messages: ChatMessage[]): number {
  const responseTimes = messages
    .filter(m => m.sender === 'bot' && m.metadata?.responseTime)
    .map(m => m.metadata!.responseTime!);
  
  if (responseTimes.length === 0) return 0;
  
  const sum = responseTimes.reduce((acc, time) => acc + time, 0);
  return Math.round(sum / responseTimes.length);
} 