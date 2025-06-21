// Mock Redis
jest.mock('ioredis', () => {
  const Redis = jest.fn(() => ({
    ping: jest.fn().mockResolvedValue('PONG'),
    info: jest.fn().mockResolvedValue('redis_version:6.2.0\r\nused_memory_human:1.5M\r\nconnected_clients:5\r\n'),
    quit: jest.fn().mockResolvedValue('OK'),
    on: jest.fn(),
    duplicate: jest.fn(() => ({
      subscribe: jest.fn(),
      on: jest.fn(),
      quit: jest.fn()
    })),
    scard: jest.fn().mockResolvedValue(10),
    smembers: jest.fn().mockResolvedValue(['player1', 'player2']),
    hgetall: jest.fn().mockResolvedValue({ name: 'Test Player', score: '100', level: 'novice' }),
    hget: jest.fn().mockResolvedValue(new Date().toISOString()),
    zrevrange: jest.fn().mockResolvedValue(['player1', '100', 'player2', '90']),
    dbsize: jest.fn().mockResolvedValue(100),
    exists: jest.fn().mockResolvedValue(1),
    pipeline: jest.fn(() => ({
      exec: jest.fn().mockResolvedValue([])
    })),
    publish: jest.fn().mockResolvedValue(1)
  }));
  
  return { Redis };
});

// Mock fetch for engine health checks
global.fetch = jest.fn();

// Mock timers
jest.useFakeTimers();

// Silence console during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
}; 