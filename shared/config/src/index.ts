// Shared configuration for myMCP project

export const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
      credentials: true,
    },
  },

  // Game configuration
  game: {
    defaultScore: 0,
    maxInventorySize: 10,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    autosaveInterval: 5 * 60 * 1000, // 5 minutes
  },

  // Quest configuration
  quests: {
    globalMeeting: {
      id: 'global-meeting',
      title: 'Council of Three Realms',
      maxAllies: 3,
      timeoutMinutes: 15,
    },
    serverHealth: {
      id: 'server-health',
      title: 'Dungeon Keeper\'s Vigil',
      maxDepth: 5,
      checkIntervalMs: 5000,
    },
    hmacSecurity: {
      id: 'hmac-security',
      title: 'Cryptomancer\'s Seal',
      algorithms: ['SHA256', 'SHA512'],
      maxMessages: 5,
    },
  },

  // Storage configuration
  storage: {
    type: process.env.STORAGE_TYPE || 'file', // 'file' | 'memory' | 'database'
    filePath: process.env.STORAGE_FILE || './data/gamestate.json',
    backupInterval: 60 * 60 * 1000, // 1 hour
  },

  // LLM integration (when implemented)
  llm: {
    provider: process.env.LLM_PROVIDER || 'mock',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
    maxTokens: 150,
    temperature: 0.7,
  },

  // MCP configuration
  mcp: {
    protocol: 'stdio',
    timeout: 30000,
    tools: [
      'get_state',
      'set_state',
      'start_quest',
      'complete_quest',
      'chat',
    ],
  },

  // Development configuration
  development: {
    logLevel: process.env.LOG_LEVEL || 'info',
    hotReload: process.env.NODE_ENV === 'development',
    debugMode: process.env.DEBUG === 'true',
  },

  // Fantasy theme configuration
  theme: {
    name: 'classic-fantasy',
    colors: {
      primary: '#6B46C1',  // Purple
      secondary: '#059669', // Green
      accent: '#DC2626',    // Red
      neutral: '#374151',   // Gray
    },
    ascii: {
      enabled: true,
      style: 'classic',
    },
  },
};

export type Config = typeof config;

// Environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  config.development.logLevel = 'error';
  config.development.debugMode = false;
}

if (process.env.NODE_ENV === 'test') {
  config.server.port = 0; // Random port for testing
  config.storage.type = 'memory';
  config.development.logLevel = 'silent';
}
