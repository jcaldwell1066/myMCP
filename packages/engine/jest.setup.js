// Jest setup file for engine tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3999'; // Use different port for tests
process.env.ENGINE_ID = 'test-engine';
process.env.IS_PRIMARY = 'true';
process.env.REDIS_URL = process.env.TEST_REDIS_URL || 'redis://localhost:6379';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Add custom matchers if needed
expect.extend({
  toBeValidGameState(received) {
    const pass = 
      received &&
      typeof received === 'object' &&
      received.player &&
      received.quests &&
      received.inventory &&
      received.session &&
      received.metadata;

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid game state`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid game state with player, quests, inventory, session, and metadata`,
        pass: false,
      };
    }
  },
}); 