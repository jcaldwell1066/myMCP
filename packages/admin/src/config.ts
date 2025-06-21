export const config = {
  port: process.env.ADMIN_PORT || 3500,
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  corsOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:5173',
    'http://localhost:5174'
  ],
  auth: {
    enabled: process.env.ADMIN_AUTH_ENABLED === 'true',
    secret: process.env.ADMIN_SECRET || 'admin-secret-key',
    sessionTimeout: 3600000 // 1 hour
  },
  monitoring: {
    healthCheckInterval: 5000, // 5 seconds
    metricsInterval: 10000, // 10 seconds
    alertThresholds: {
      cpuUsage: 80,
      memoryUsage: 85,
      redisLatency: 100, // ms
      engineResponseTime: 500 // ms
    }
  },
  engines: {
    // List of known engine endpoints
    endpoints: process.env.ENGINE_ENDPOINTS?.split(',') || [
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003'
    ]
  },
  redis: {
    maxQueryResults: 100,
    allowedCommands: [
      'GET', 'SET', 'HGET', 'HGETALL', 'HSET', 'HMSET',
      'SMEMBERS', 'SADD', 'SREM', 'ZRANGE', 'ZREVRANGE',
      'KEYS', 'SCAN', 'TYPE', 'TTL', 'EXISTS', 'INFO',
      'PING', 'CLIENT', 'CONFIG'
    ],
    dangerousCommands: ['FLUSHDB', 'FLUSHALL', 'DEL', 'RENAME']
  }
}; 