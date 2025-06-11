/**
 * myMCP Engine - Express.js Game State Management API
 * The central nervous system of our lunch and learn
 * chatbot project!
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { Server } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import Joi from 'joi';
import { 
  GameState, 
  Player, 
  Quest, 
  GameAction, 
  APIResponse,
  StateUpdate,
  ChatMessage 
} from '@mymcp/types';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

// Game state storage
const DATA_DIR = join(process.cwd(), 'data');
const GAME_STATES_FILE = join(DATA_DIR, 'game-states.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// WebSocket clients for real-time updates
const wsClients = new Set<WebSocket>();

// Game state cache (in-memory for performance)
let gameStatesCache: Record<string, GameState> = {};

// Load game states from file
function loadGameStates(): Record<string, GameState> {
  if (!existsSync(GAME_STATES_FILE)) {
    return {};
  }
  
  try {
    const data = readFileSync(GAME_STATES_FILE, 'utf8');
    const states = JSON.parse(data);
    
    // Convert date strings back to Date objects
    Object.values(states).forEach((state: any) => {
      state.session.startTime = new Date(state.session.startTime);
      state.session.lastAction = new Date(state.session.lastAction);
      state.session.conversationHistory = state.session.conversationHistory.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      state.metadata.lastUpdated = new Date(state.metadata.lastUpdated);
    });
    
    return states;
  } catch (error) {
    console.error('Failed to load game states:', error);
    return {};
  }
}

// Save game states to file
function saveGameStates(states: Record<string, GameState>): boolean {
  try {
    writeFileSync(GAME_STATES_FILE, JSON.stringify(states, null, 2));
    return true;
  } catch (error) {
    console.error('Failed to save game states:', error);
    return false;
  }
}

// Initialize game states cache
gameStatesCache = loadGameStates();

// Create default game state
function createDefaultGameState(playerId: string = 'default-player'): GameState {
  const now = new Date();
  
  return {
    player: {
      id: playerId,
      name: 'Hero',
      score: 0,
      level: 'novice',
      status: 'idle',
      location: 'town',
    },
    quests: {
      available: [
        {
          id: 'global-meeting',
          title: 'Council of Three Realms',
          description: 'Unite allies from distant kingdoms to coordinate a grand council meeting.',
          realWorldSkill: 'Timezone coordination and meeting scheduling',
          fantasyTheme: 'Gathering allies across distant realms',
          status: 'available',
          steps: [
            {
              id: 'find-allies',
              description: 'Locate suitable allies in different time zones',
              completed: false,
            },
            {
              id: 'coordinate-meeting',
              description: 'Find optimal meeting time for all parties',
              completed: false,
            },
            {
              id: 'confirm-attendance',
              description: 'Confirm all allies can attend the council',
              completed: false,
            },
          ],
          reward: {
            score: 100,
            items: ['Council Seal', 'Diplomatic Medallion'],
          },
        },
        {
          id: 'server-health',
          title: 'Dungeon Keeper\'s Vigil',
          description: 'Monitor the ancient servers deep in the Mountain of Processing.',
          realWorldSkill: 'Server monitoring and system health checks',
          fantasyTheme: 'Guardian of mystical computing crystals',
          status: 'available',
          steps: [
            {
              id: 'enter-dungeon',
              description: 'Venture into the server caverns',
              completed: false,
            },
            {
              id: 'check-crystals',
              description: 'Examine the health of processing crystals',
              completed: false,
            },
            {
              id: 'report-status',
              description: 'Document crystal conditions',
              completed: false,
            },
          ],
          reward: {
            score: 75,
            items: ['Crystal Monitor', 'System Rune'],
          },
        },
        {
          id: 'hmac-security',
          title: 'Cryptomancer\'s Seal',
          description: 'Master the arcane arts of message authentication and integrity.',
          realWorldSkill: 'HMAC cryptographic implementation',
          fantasyTheme: 'Forging magical seals of authenticity',
          status: 'available',
          steps: [
            {
              id: 'learn-theory',
              description: 'Study the ancient cryptographic texts',
              completed: false,
            },
            {
              id: 'craft-seal',
              description: 'Create your first authentication seal',
              completed: false,
            },
            {
              id: 'verify-seal',
              description: 'Prove the seal\'s authenticity',
              completed: false,
            },
          ],
          reward: {
            score: 125,
            items: ['Cryptomancer Staff', 'HMAC Grimoire'],
          },
        },
      ],
      active: null,
      completed: [],
    },
    inventory: {
      items: [],
      capacity: 10,
      status: 'empty',
    },
    session: {
      id: uuidv4(),
      startTime: now,
      lastAction: now,
      turnCount: 0,
      conversationHistory: [],
    },
    metadata: {
      version: '1.0.0',
      lastUpdated: now,
    },
  };
}

// Validation schemas
const gameActionSchema = Joi.object({
  type: Joi.string().valid(
    'SET_SCORE',
    'START_QUEST',
    'COMPLETE_QUEST_STEP',
    'COMPLETE_QUEST',
    'CHAT',
    'USE_ITEM',
    'CHANGE_LOCATION',
    'UPDATE_PLAYER_STATUS'
  ).required(),
  payload: Joi.object().required(),
  playerId: Joi.string().required(),
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3001', 'http://localhost:5173'],
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// WebSocket broadcast function
function broadcastStateUpdate(playerId: string, update: StateUpdate) {
  const message = JSON.stringify({
    type: 'STATE_UPDATE',
    playerId,
    update,
  });
  
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'myMCP Engine is running strong!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    activeStates: Object.keys(gameStatesCache).length,
    wsConnections: wsClients.size,
  });
});

// Debug route to test routing
app.get('/debug', (req, res) => {
  res.json({
    message: 'Debug endpoint working!',
    requestInfo: {
      url: req.url,
      path: req.path,
      method: req.method,
      params: req.params,
      query: req.query,
      headers: req.headers,
    },
    timestamp: new Date(),
  });
});

// Debug API route
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'API debug endpoint working!',
    availableRoutes: [
      'GET /api/state/:playerId?',
      'PUT /api/state/:playerId/player',
      'POST /api/actions/:playerId?',
      'GET /api/quests/:playerId?',
      'GET /api/context/completions/:playerId?',
    ],
    timestamp: new Date(),
  });
});

// Get current game state
app.get('/api/state/:playerId?', (req, res) => {
  const playerId = req.params.playerId || 'default-player';
  
  let gameState = gameStatesCache[playerId];
  if (!gameState) {
    gameState = createDefaultGameState(playerId);
    gameStatesCache[playerId] = gameState;
    saveGameStates(gameStatesCache);
  }
  
  const response: APIResponse<GameState> = {
    success: true,
    data: gameState,
    timestamp: new Date(),
  };
  
  res.json(response);
});

// Update player state
app.put('/api/state/:playerId/player', (req, res) => {
  const playerId = req.params.playerId || 'default-player';
  const playerUpdates = req.body;
  
  let gameState = gameStatesCache[playerId];
  if (!gameState) {
    gameState = createDefaultGameState(playerId);
  }
  
  // Update player fields
  gameState.player = { ...gameState.player, ...playerUpdates };
  gameState.metadata.lastUpdated = new Date();
  gameState.session.lastAction = new Date();
  
  // Update level based on score
  if (playerUpdates.score !== undefined) {
    const score = playerUpdates.score;
    if (score >= 1000) gameState.player.level = 'master';
    else if (score >= 500) gameState.player.level = 'expert';
    else if (score >= 100) gameState.player.level = 'apprentice';
    else gameState.player.level = 'novice';
  }
  
  gameStatesCache[playerId] = gameState;
  saveGameStates(gameStatesCache);
  
  // Broadcast update
  const update: StateUpdate = {
    type: 'PARTIAL_UPDATE',
    timestamp: new Date(),
    version: 1,
    data: { player: gameState.player },
  };
  broadcastStateUpdate(playerId, update);
  
  const response: APIResponse<Player> = {
    success: true,
    data: gameState.player,
    timestamp: new Date(),
  };
  
  res.json(response);
});

// Execute game action
app.post('/api/actions/:playerId?', async (req, res) => {
  const playerId = req.params.playerId || 'default-player';
  
  // Validate action
  const { error, value } = gameActionSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message,
      timestamp: new Date(),
    });
  }
  
  const action: GameAction = {
    ...value,
    timestamp: new Date(),
    playerId,
  };
  
  let gameState = gameStatesCache[playerId];
  if (!gameState) {
    gameState = createDefaultGameState(playerId);
  }
  
  // Process action based on type
  let result: any = {};
  
  switch (action.type) {
    case 'SET_SCORE':
      gameState.player.score = action.payload.score;
      result = { score: gameState.player.score };
      break;
      
    case 'START_QUEST':
      const questId = action.payload.questId;
      const quest = gameState.quests.available.find(q => q.id === questId);
      if (quest) {
        quest.status = 'active';
        gameState.quests.active = quest;
        gameState.quests.available = gameState.quests.available.filter(q => q.id !== questId);
        gameState.player.currentQuest = quest.id;
        gameState.player.status = 'in-quest';
        result = { quest: quest.title, status: 'started' };
      } else {
        return res.status(404).json({
          success: false,
          error: 'Quest not found',
          timestamp: new Date(),
        });
      }
      break;
      
    case 'COMPLETE_QUEST_STEP':
      if (gameState.quests.active) {
        const stepId = action.payload.stepId;
        const step = gameState.quests.active.steps.find(s => s.id === stepId);
        if (step) {
          step.completed = true;
          result = { step: step.description, completed: true };
        }
      }
      break;
      
    case 'COMPLETE_QUEST':
      if (gameState.quests.active) {
        const activeQuest = gameState.quests.active;
        activeQuest.status = 'completed';
        gameState.player.score += activeQuest.reward.score;
        gameState.quests.completed.push(activeQuest);
        gameState.quests.active = null;
        gameState.player.currentQuest = undefined;
        gameState.player.status = 'idle';
        
        // Add reward items
        if (activeQuest.reward.items) {
          activeQuest.reward.items.forEach(item => {
            gameState.inventory.items.push({
              id: uuidv4(),
              name: item,
              description: `Reward from ${activeQuest.title}`,
              type: 'treasure',
            });
          });
        }
        
        result = { 
          quest: activeQuest.title, 
          reward: activeQuest.reward,
          status: 'completed' 
        };
      }
      break;
      
    case 'CHAT':
      const message: ChatMessage = {
        id: uuidv4(),
        timestamp: new Date(),
        sender: 'player',
        message: action.payload.message,
        type: 'chat',
      };
      gameState.session.conversationHistory.push(message);
      
      // Simple bot response (will be enhanced with LLM in Task 7)
      const botResponse: ChatMessage = {
        id: uuidv4(),
        timestamp: new Date(),
        sender: 'bot',
        message: generateBotResponse(action.payload.message, gameState),
        type: 'chat',
      };
      gameState.session.conversationHistory.push(botResponse);
      
      result = { 
        playerMessage: message,
        botResponse: botResponse 
      };
      break;
      
    default:
      return res.status(400).json({
        success: false,
        error: `Unknown action type: ${action.type}`,
        timestamp: new Date(),
      });
  }
  
  // Update metadata
  gameState.metadata.lastUpdated = new Date();
  gameState.session.lastAction = new Date();
  gameState.session.turnCount++;
  
  // Update level based on score
  const score = gameState.player.score;
  if (score >= 1000) gameState.player.level = 'master';
  else if (score >= 500) gameState.player.level = 'expert';
  else if (score >= 100) gameState.player.level = 'apprentice';
  else gameState.player.level = 'novice';
  
  gameStatesCache[playerId] = gameState;
  saveGameStates(gameStatesCache);
  
  // Broadcast update
  const update: StateUpdate = {
    type: 'PARTIAL_UPDATE',
    timestamp: new Date(),
    version: gameState.session.turnCount,
    data: gameState,
  };
  broadcastStateUpdate(playerId, update);
  
  const response: APIResponse = {
    success: true,
    data: result,
    timestamp: new Date(),
  };
  
  res.json(response);
});

// Get available quests
app.get('/api/quests/:playerId?', (req, res) => {
  const playerId = req.params.playerId || 'default-player';
  
  let gameState = gameStatesCache[playerId];
  if (!gameState) {
    gameState = createDefaultGameState(playerId);
    gameStatesCache[playerId] = gameState;
  }
  
  res.json({
    success: true,
    data: {
      available: gameState.quests.available,
      active: gameState.quests.active,
      completed: gameState.quests.completed,
    },
    timestamp: new Date(),
  });
});

// Get tab completion suggestions
app.get('/api/context/completions/:playerId?', (req, res) => {
  const playerId = req.params.playerId || 'default-player';
  const prefix = req.query.prefix as string || '';
  
  let gameState = gameStatesCache[playerId];
  if (!gameState) {
    gameState = createDefaultGameState(playerId);
  }
  
  const suggestions: string[] = [];
  
  // Context-aware suggestions based on game state
  if (prefix.toLowerCase().includes('quest')) {
    gameState.quests.available.forEach(quest => {
      suggestions.push(quest.title);
    });
  }
  
  if (prefix.toLowerCase().includes('cast') || prefix.toLowerCase().includes('spell')) {
    suggestions.push('fireball', 'heal', 'teleport', 'shield');
  }
  
  if (prefix.toLowerCase().includes('use') || prefix.toLowerCase().includes('item')) {
    gameState.inventory.items.forEach(item => {
      suggestions.push(item.name);
    });
  }
  
  // Default commands
  if (!prefix || prefix.length < 2) {
    suggestions.push('status', 'chat', 'start-quest', 'get-score', 'help');
  }
  
  res.json({
    success: true,
    data: suggestions.filter(s => 
      s.toLowerCase().includes(prefix.toLowerCase())
    ).slice(0, 10),
    timestamp: new Date(),
  });
});

// Simple bot response generation (will be enhanced with LLM)
function generateBotResponse(userMessage: string, gameState: GameState): string {
  const message = userMessage.toLowerCase();
  
  // Context-aware responses
  if (gameState.quests.active) {
    if (message.includes('quest') || message.includes('current')) {
      return `You are currently on the "${gameState.quests.active.title}" quest. ${gameState.quests.active.description}`;
    }
  }
  
  if (message.includes('score') || message.includes('points')) {
    return `Your current score is ${gameState.player.score} points. You are a ${gameState.player.level} level adventurer!`;
  }
  
  if (message.includes('quest') || message.includes('adventure')) {
    const availableCount = gameState.quests.available.length;
    return `You have ${availableCount} quests available! The realm needs heroes like you.`;
  }
  
  if (message.includes('hello') || message.includes('hi')) {
    return `Greetings, ${gameState.player.name}! How may I assist you on your journey?`;
  }
  
  if (message.includes('help')) {
    return 'I can help you manage quests, track your progress, and guide your adventures. What would you like to know?';
  }
  
  // Default responses
  const defaults = [
    'The ancient texts speak of such things... tell me more.',
    'Interesting perspective, brave adventurer.',
    'Your wisdom grows with each question you ask.',
    'The realm is full of mysteries. Keep exploring!',
  ];
  
  return defaults[Math.floor(Math.random() * defaults.length)];
}

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    timestamp: new Date(),
  });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`🚀 myMCP Engine running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API base: http://localhost:${PORT}/api`);
  console.log(`🎮 Game states: ${Object.keys(gameStatesCache).length} loaded`);
  console.log(`⚡ Ready for lunch and learn action!`);
});

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('🔌 WebSocket client connected');
  wsClients.add(ws);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'WELCOME',
    message: 'Connected to myMCP Engine',
    timestamp: new Date(),
  }));
  
  ws.on('close', () => {
    console.log('🔌 WebSocket client disconnected');
    wsClients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    wsClients.delete(ws);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    process.exit(0);
  });
});

export default app;
