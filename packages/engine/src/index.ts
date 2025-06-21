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
  ChatMessage,
  PlayerLevel,
  PlayerStatus,
  LocationStatus,
  QuestStep,
  Item
} from '@mymcp/types';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { config } from 'dotenv';
import { LLMService, LLMProvider } from './services/LLMService';
import { UnifiedChatService } from './services/UnifiedChatService';
import { MultiplayerService } from './services/MultiplayerService';
import { EventBroadcaster } from './services/EventBroadcaster';
import { createServer } from 'http';

// Load environment variables from project root
config({ path: join(__dirname, '../../../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Add multiplayer configuration
const ENGINE_ID = process.env.ENGINE_ID || `engine-${PORT}`;
const IS_PRIMARY = process.env.IS_PRIMARY === 'true';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

// Initialize event broadcaster
const eventBroadcaster = new EventBroadcaster(REDIS_URL);

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

// Initialize LLM service
const llmService = new LLMService();

// Initialize unified chat service
const unifiedChatService = new UnifiedChatService();

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
        {
          id: 'release-milestone-v2',
          title: 'Path to Release: Version 2.0',
          description: 'Guide the project to its next major release milestone by completing critical development tasks.',
          realWorldSkill: 'Software release management and project coordination',
          fantasyTheme: 'Forging the legendary artifact of deployment',
          status: 'available',
          steps: [
            {
              id: 'complete-testing',
              description: 'Ensure all test suites pass and achieve 80% code coverage',
              completed: false,
            },
            {
              id: 'update-documentation',
              description: 'Update all documentation including API docs and user guides',
              completed: false,
            },
            {
              id: 'deploy-staging',
              description: 'Successfully deploy to staging environment and verify functionality',
              completed: false,
            },
          ],
          reward: {
            score: 200,
            items: ['Release Artifact', 'Deployment Scroll', 'Version Badge'],
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

// Player update validation schema - simple approach without method chaining
const playerUpdateSchema = Joi.object({
  name: Joi.string(),
  score: Joi.number(),
  level: Joi.string().valid('novice', 'apprentice', 'expert', 'master'),
  status: Joi.string().valid('idle', 'chatting', 'in-quest', 'completed-quest'),
  location: Joi.string().valid('town', 'forest', 'cave', 'shop'),
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3500', 'http://localhost:5173'],
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));

// WebSocket broadcast function
function broadcastStateUpdate(playerId: string, update: StateUpdate) {
  // Use multiplayer service for cross-engine updates if available
  if (multiplayerService) {
    multiplayerService.broadcastPlayerUpdate(playerId, update.data as Partial<GameState>);
  } else {
    // Fallback to local WebSocket broadcast
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
}

// API Routes

// Health check with LLM status
app.get('/health', (req, res) => {
  const llmStatus = llmService.getProviderStatus();
  const hasWorkingLLM = Object.values(llmStatus).some(working => working);
  
  res.json({
    status: 'ok',
    message: 'myMCP Engine is running strong!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    activeStates: Object.keys(gameStatesCache).length,
    wsConnections: wsClients.size,
    llm: {
      enabled: hasWorkingLLM,
      providers: llmStatus,
      availableProviders: llmService.getAvailableProviders(),
    },
  });
});

// Status endpoint for admin dashboard
app.get('/api/status', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  res.json({
    status: 'ok',
    engineId: ENGINE_ID,
    isPrimary: IS_PRIMARY,
    connectedClients: wsClients.size,
    onlinePlayers: Object.keys(gameStatesCache).filter(playerId => {
      const state = gameStatesCache[playerId];
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return state.session.lastAction > fiveMinutesAgo;
    }),
    uptime: process.uptime(),
    memory: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal
    },
    cpu: cpuUsage.user / 1000000 // Convert to seconds
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
      'GET /api/status',
      'GET /api/state/:playerId?',
      'PUT /api/state/:playerId/player',
      'POST /api/actions/:playerId?',
      'GET /api/quests/:playerId?',
      'GET /api/context/completions/:playerId?',
      'GET /api/players',
      'GET /api/quest-catalog',
      'GET /api/stats',
      'GET /api/llm/status',
      'GET /api/chat/:playerId/stream',
    ],
    mcpIntegration: {
      phase: 1,
      status: 'complete',
      mcpServerPath: '../mcpserver',
      resources: 7,
      tools: 9,
    },
    timestamp: new Date(),
  });
});

// Get all players
app.get('/api/players', (req, res) => {
  const players = Object.entries(gameStatesCache).map(([id, state]) => ({
    id,
    name: state.player.name,
    score: state.player.score,
    level: state.player.level,
    status: state.player.status,
    location: state.player.location,
    currentQuest: state.player.currentQuest,
  }));
  
  const response: APIResponse<any[]> = {
    success: true,
    data: players,
    timestamp: new Date(),
  };
  
  res.json(response);
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
  
  // Validate player updates
  const { error, value } = playerUpdateSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: `Validation error: ${error.details[0].message}`,
      timestamp: new Date(),
    });
  }
  
  const playerUpdates = value as {
    name?: string;
    score?: number;
    level?: PlayerLevel;
    status?: PlayerStatus;
    location?: LocationStatus;
  };
  
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

// Helper function to execute game actions (used by LLM intent system)
async function executeGameAction(action: GameAction, gameState: GameState): Promise<any> {
  switch (action.type) {
    case 'START_QUEST':
      const questId = action.payload.questId;
      const quest = gameState.quests.available.find((q: Quest) => q.id === questId);
      if (quest) {
        quest.status = 'active';
        gameState.quests.active = quest;
        gameState.quests.available = gameState.quests.available.filter((q: Quest) => q.id !== questId);
        gameState.player.currentQuest = quest.id;
        gameState.player.status = 'in-quest';
        
        // Broadcast quest started event
        await eventBroadcaster.broadcastQuestStarted(
          gameState.player.id,
          quest.id,
          quest.title,
          quest.description
        );
        
        return { quest: quest.title, status: 'started' };
      } else {
        throw new Error('Quest not found');
      }
      
    case 'COMPLETE_QUEST_STEP':
      if (gameState.quests.active) {
        const stepId = action.payload.stepId;
        const step = gameState.quests.active.steps.find((s: QuestStep) => s.id === stepId);
        if (step) {
          step.completed = true;
          
          // Broadcast quest step completed
          await eventBroadcaster.broadcastQuestStepCompleted(
            gameState.player.id,
            gameState.quests.active.id,
            step.id,
            step.description
          );
          
          return { step: step.description, completed: true };
        }
      }
      throw new Error('Step not found or no active quest');
      
    case 'COMPLETE_QUEST':
      if (gameState.quests.active) {
        const activeQuest = gameState.quests.active;
        const oldScore = gameState.player.score;
        
        activeQuest.status = 'completed';
        gameState.player.score += activeQuest.reward.score;
        gameState.quests.completed.push(activeQuest);
        gameState.quests.active = null;
        gameState.player.currentQuest = undefined;
        gameState.player.status = 'idle';
        
        // Add reward items
        if (activeQuest.reward.items) {
          activeQuest.reward.items.forEach((item: string) => {
            gameState.inventory.items.push({
              id: uuidv4(),
              name: item,
              description: `Reward from ${activeQuest.title}`,
              type: 'treasure',
            });
          });
        }
        
        // Broadcast quest completed
        await eventBroadcaster.broadcastQuestCompleted(
          gameState.player.id,
          activeQuest.id,
          activeQuest.title,
          activeQuest.reward
        );
        
        // Broadcast score change
        await eventBroadcaster.broadcastScoreChange(
          gameState.player.id,
          oldScore,
          gameState.player.score
        );
        
        return { 
          quest: activeQuest.title, 
          reward: activeQuest.reward,
          status: 'completed' 
        };
      }
      throw new Error('No active quest to complete');
      
    default:
      throw new Error(`Unsupported action type for LLM execution: ${action.type}`);
  }
}

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
  
  // Type the validated value
  const validatedAction = value as {
    type: GameAction['type'];
    payload: any;
    playerId: string;
  };
  
  const action: GameAction = {
    type: validatedAction.type,
    payload: validatedAction.payload,
    playerId: validatedAction.playerId,
    timestamp: new Date(),
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
      const quest = gameState.quests.available.find((q: Quest) => q.id === questId);
      if (quest) {
        quest.status = 'active';
        gameState.quests.active = quest;
        gameState.quests.available = gameState.quests.available.filter((q: Quest) => q.id !== questId);
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
        const step = gameState.quests.active.steps.find((s: QuestStep) => s.id === stepId);
        if (step) {
          step.completed = true;
          result = { step: step.description, completed: true };
        } else {
          return res.status(404).json({
            success: false,
            error: `Quest step '${stepId}' not found in active quest`,
            timestamp: new Date(),
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: 'No active quest to complete steps for',
          timestamp: new Date(),
        });
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
          activeQuest.reward.items.forEach((item: string) => {
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
      } else {
        return res.status(400).json({
          success: false,
          error: 'No active quest to complete',
          timestamp: new Date(),
        });
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
      
      // Use UnifiedChatService for intent recognition and action execution
      const unifiedResponse = await unifiedChatService.generateUnifiedResponse(
        action.payload.message, 
        gameState
      );
      
      // Execute any actions the LLM determined
      const executedActions = [];
      for (const detectedAction of unifiedResponse.actions || []) {
        try {
          const actionResult = await executeGameAction(detectedAction, gameState);
          executedActions.push({ action: detectedAction, result: actionResult });
          console.log(`🤖 LLM executed action: ${detectedAction.type}`);
        } catch (error) {
          console.error(`❌ Failed to execute LLM action:`, error);
        }
      }
      
      const botResponse: ChatMessage = {
        id: uuidv4(),
        timestamp: new Date(),
        sender: 'bot',
        message: unifiedResponse.text,
        type: 'chat',
        metadata: unifiedResponse.metadata,
      };
      gameState.session.conversationHistory.push(botResponse);
      
      // Broadcast chat event
      await eventBroadcaster.broadcastChat(
        playerId,
        action.payload.message,
        unifiedResponse.text
      );
      
      result = { 
        playerMessage: message,
        botResponse: botResponse,
        llmMetadata: unifiedResponse.metadata,
        intents: unifiedResponse.intents,
        executedActions,
        gameStateUpdated: unifiedResponse.gameStateUpdated
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
  
  // Update level based on score and detect level changes
  const score = gameState.player.score;
  const oldLevel = gameState.player.level;
  
  if (score >= 1000) gameState.player.level = 'master';
  else if (score >= 500) gameState.player.level = 'expert';
  else if (score >= 100) gameState.player.level = 'apprentice';
  else gameState.player.level = 'novice';
  
  // Broadcast level up if changed
  if (oldLevel !== gameState.player.level) {
    await eventBroadcaster.broadcastLevelUp(
      playerId,
      oldLevel,
      gameState.player.level
    );
  }
  
  gameStatesCache[playerId] = gameState;
  saveGameStates(gameStatesCache);
  
  // Broadcast state update
  await eventBroadcaster.broadcastStateUpdate(playerId, gameState);
  
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

// LLM status endpoint
app.get('/api/llm/status', (req, res) => {
  const providers = llmService.getAvailableProviders();
  const status = llmService.getProviderStatus();
  
  res.json({
    success: true,
    data: {
      availableProviders: providers,
      providerStatus: status,
      totalProviders: providers.length,
      hasWorkingProvider: Object.values(status).some(working => working),
    },
    timestamp: new Date(),
  });
});

// Streaming chat endpoint
app.get('/api/chat/:playerId/stream', async (req, res) => {
  const playerId = req.params.playerId || 'default-player';
  const message = req.query.message as string;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message parameter required',
      timestamp: new Date(),
    });
  }
  
  let gameState = gameStatesCache[playerId];
  if (!gameState) {
    gameState = createDefaultGameState(playerId);
  }
  
  // Set up Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
  });
  
  try {
    let fullResponse = '';
    
    for await (const chunk of llmService.generateResponseStream(message, gameState)) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk, fullResponse })}\n\n`);
    }
    
    res.write(`data: ${JSON.stringify({ done: true, fullResponse })}\n\n`);
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: (error as Error).message })}\n\n`);
  } finally {
    res.end();
  }
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
    gameState.quests.available.forEach((quest: Quest) => {
      suggestions.push(quest.title);
    });
  }
  
  if (prefix.toLowerCase().includes('cast') || prefix.toLowerCase().includes('spell')) {
    suggestions.push('fireball', 'heal', 'teleport', 'shield');
  }
  
  if (prefix.toLowerCase().includes('use') || prefix.toLowerCase().includes('item')) {
    gameState.inventory.items.forEach((item: Item) => {
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

// MCP-specific endpoints for better integration

// List all active players
app.get('/api/players', (req, res) => {
  const players = Object.keys(gameStatesCache).map(playerId => {
    const state = gameStatesCache[playerId];
    return {
      id: playerId,
      name: state.player.name,
      level: state.player.level,
      score: state.player.score,
      status: state.player.status,
      location: state.player.location,
      lastAction: state.session.lastAction,
      activeQuest: state.quests.active?.title || null,
    };
  });
  
  res.json({
    success: true,
    data: players,
    total: players.length,
    timestamp: new Date(),
  });
});

// Get quest definitions (without player-specific state)
app.get('/api/quest-catalog', (req, res) => {
  // Create a fresh state to get the default quest catalog
  const defaultState = createDefaultGameState('temp');
  
  res.json({
    success: true,
    data: {
      quests: defaultState.quests.available.map((quest: Quest) => ({
        id: quest.id,
        title: quest.title,
        description: quest.description,
        realWorldSkill: quest.realWorldSkill,
        fantasyTheme: quest.fantasyTheme,
        steps: quest.steps.map((step: QuestStep) => ({
          id: step.id,
          description: step.description,
        })),
        reward: quest.reward,
      })),
    },
    timestamp: new Date(),
  });
});

// Get server statistics
app.get('/api/stats', (req, res) => {
  const players = Object.values(gameStatesCache);
  const totalPlayers = players.length;
  const activePlayers = players.filter(p => p.player.status !== 'idle').length;
  const totalScore = players.reduce((sum, p) => sum + p.player.score, 0);
  const averageScore = totalPlayers > 0 ? Math.round(totalScore / totalPlayers) : 0;
  
  const questStats = players.reduce((stats, player) => {
    stats.totalCompleted += player.quests.completed.length;
    if (player.quests.active) stats.activeQuests++;
    return stats;
  }, { totalCompleted: 0, activeQuests: 0 });
  
  res.json({
    success: true,
    data: {
      players: {
        total: totalPlayers,
        active: activePlayers,
        idle: totalPlayers - activePlayers,
      },
      scores: {
        total: totalScore,
        average: averageScore,
        highest: Math.max(...players.map((p: GameState) => p.player.score), 0),
      },
      quests: {
        completed: questStats.totalCompleted,
        active: questStats.activeQuests,
      },
      system: {
        uptime: process.uptime(),
        wsConnections: wsClients.size,
        memoryUsage: process.memoryUsage(),
      },
    },
    timestamp: new Date(),
  });
});

// Add new endpoint for multi-engine status
app.get('/api/multiplayer/status', (req, res) => {
  if (!multiplayerService) {
    return res.status(503).json({
      success: false,
      error: 'Multiplayer service not available',
      timestamp: new Date()
    });
  }
  
  res.json({
    success: true,
    data: {
      engineId: ENGINE_ID,
      isPrimary: IS_PRIMARY,
      connectedClients: multiplayerService.connectedClients,
      onlinePlayers: multiplayerService.onlinePlayers,
      peerEngines: multiplayerService.config.peerEngines
    },
    timestamp: new Date()
  });
});

// LLM-powered bot response generation
async function generateBotResponse(userMessage: string, gameState: GameState): Promise<{
  message: string;
  metadata: any;
}> {
  try {
    const llmResponse = await llmService.generateResponse(userMessage, gameState);
    
    return {
      message: llmResponse.text,
      metadata: llmResponse.metadata,
    };
  } catch (error) {
    console.error('LLM response generation failed:', error);
    
    // Enhanced fallback that still uses context
    const contextualFallback = generateContextualFallback(userMessage, gameState);
    return {
      message: contextualFallback,
      metadata: {
        provider: 'fallback' as LLMProvider,
        model: 'contextual-template',
        tokensUsed: 0,
        responseTime: 0,
        cached: false,
        confidence: 0.2,
        contentFiltered: false,
        error: (error as Error).message,
      },
    };
  }
}

// Enhanced fallback function that leverages game context
function generateContextualFallback(userMessage: string, gameState: GameState): string {
  const message = userMessage.toLowerCase();
  const playerName = gameState.player.name;
  const currentHour = new Date().getHours();
  const timeGreeting = currentHour < 12 ? 'this fine morning' : 
                      currentHour < 18 ? 'this day' : 'this evening';
  
  // Quest-specific responses
  if (gameState.quests.active) {
    const quest = gameState.quests.active;
    const completedSteps = quest.steps.filter((s: QuestStep) => s.completed).length;
    const totalSteps = quest.steps.length;
    const nextStep = quest.steps.find((s: QuestStep) => !s.completed);
    
    if (message.includes('quest') || message.includes('current') || message.includes('progress')) {
      return `Greetings, ${playerName}! Thou art currently engaged in the noble quest "${quest.title}". Progress stands at ${completedSteps} of ${totalSteps} steps completed. ${nextStep ? `Thy next challenge: ${nextStep.description}` : 'Thou art nearly finished with this grand adventure!'}`;
    }
    
    if (message.includes('help') || message.includes('stuck') || message.includes('what')) {
      return `Fear not, brave ${playerName}! In thy current quest "${quest.title}", remember: ${quest.description} ${nextStep ? `Focus thy efforts on: ${nextStep.description}` : 'Thou hast made excellent progress!'}`;
    }
  }
  
  // Score and level responses
  if (message.includes('score') || message.includes('points') || message.includes('level')) {
    const levelMessages = {
      novice: 'Every master was once a beginner, young adventurer.',
      apprentice: 'Thy skills grow stronger with each challenge overcome.',
      expert: 'Impressive prowess! The realm takes notice of thy deeds.',
      master: 'Legendary! Thy name shall be remembered in the annals of history.',
    };
    
    return `Thy current score stands at ${gameState.player.score} points, marking thee as a ${gameState.player.level} among adventurers. ${levelMessages[gameState.player.level as keyof typeof levelMessages]} Keep questing onwards!`;
  }
  
  // Location-based responses
  if (message.includes('where') || message.includes('location')) {
    const locationDescriptions = {
      town: 'the bustling merchant town, where adventures begin and tales are told',
      forest: 'the mystical woodland, where ancient secrets whisper through the leaves',
      cave: 'the shadowy caverns, where treasures and dangers lurk in equal measure',
      shop: 'the magical emporium, where wonders and necessities can be procured',
    };
    
    return `Thou findest thyself in ${locationDescriptions[gameState.player.location as keyof typeof locationDescriptions] || 'an unknown realm'}. What adventures shall we pursue ${timeGreeting}?`;
  }
  
  // Greeting responses
  if (message.includes('hello') || message.includes('hi') || message.includes('greet')) {
    return `Hail and well met, ${playerName}! 'Tis good to see thee ${timeGreeting}. ${gameState.quests.active ? `Thy quest "${gameState.quests.active.title}" awaits thy attention.` : `The realm offers many adventures for one of thy ${gameState.player.level} standing.`} How may this humble guide assist thee?`;
  }
  
  // Quest-related inquiries
  if (message.includes('adventure') || message.includes('quest') && !gameState.quests.active) {
    const availableCount = gameState.quests.available.length;
    return `Excellent timing, ${playerName}! The realm currently offers ${availableCount} quests worthy of thy ${gameState.player.level} skills. Each promises great rewards and the chance to grow thy abilities. Shall we explore these opportunities together?`;
  }
  
  // Help responses
  if (message.includes('help') || message.includes('commands') || message.includes('what can')) {
    return `Of course, ${playerName}! I can aid thee with managing quests, tracking thy progress, understanding thy current standing, and providing guidance on thy adventures. Ask me about thy score, available quests, current objectives, or simply converse about the mysteries of our realm.`;
  }
  
  // Inventory responses
  if (message.includes('item') || message.includes('inventory') || message.includes('treasure')) {
    const itemCount = gameState.inventory.items.length;
    if (itemCount > 0) {
      const itemNames = gameState.inventory.items.map((item: Item) => item.name).join(', ');
      return `Thy inventory contains ${itemCount} items of note: ${itemNames}. Each has been earned through thy noble deeds and adventures.`;
    } else {
      return `Thy inventory awaits treasures from future adventures, ${playerName}. Complete quests and explore the realm to gather items of power and value.`;
    }
  }
  
  // Default thoughtful responses based on game state
  const generalResponses = [
    `The ancient wisdom suggests many paths, ${playerName}. Share more of thy thoughts that I might offer fitting counsel.`,
    `Interesting perspective, brave adventurer. The mysteries of the realm often reveal themselves through such inquiries.`,
    `Thy ${gameState.player.level} wisdom grows with each question posed. Tell me more about what troubles or intrigues thee.`,
    `The winds of ${gameState.player.location} carry whispers of such things. What specific guidance dost thou seek ${timeGreeting}?`,
  ];
  
  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
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
const httpServer = createServer(app);

// Initialize multiplayer service if Redis is available
let multiplayerService: MultiplayerService | null = null;
try {
  multiplayerService = new MultiplayerService(httpServer, {
    engineId: ENGINE_ID,
    port: Number(PORT),
    isPrimary: IS_PRIMARY,
    redisUrl: REDIS_URL,
    peerEngines: [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://localhost:3003'
    ].filter(url => !url.includes(PORT.toString()))
  });
  console.log('🌐 Multiplayer service initialized');
} catch (error) {
  console.warn('⚠️ Multiplayer service not available (Redis may not be running):', error);
}

httpServer.listen(PORT, () => {
  console.log(`🚀 myMCP Engine ${ENGINE_ID} running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API base: http://localhost:${PORT}/api`);
  console.log(`🎮 Game states: ${Object.keys(gameStatesCache).length} loaded`);
  console.log(`🌐 Multiplayer: ${IS_PRIMARY ? 'PRIMARY' : 'WORKER'} engine`);
  if (multiplayerService) {
    console.log(`📡 Redis: ${REDIS_URL}`);
  }
  console.log(`⚡ Ready for ${multiplayerService ? 'multiplayer' : 'single-player'} action!`);
});

// WebSocket server for real-time updates
const wss = new WebSocketServer({ server: httpServer });

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
  httpServer.close(() => {
    process.exit(0);
  });
});

export default app;

