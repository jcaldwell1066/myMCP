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
import { config } from 'dotenv';
import { LLMService, LLMProvider } from './services/LLMService';

// Load environment variables from project root
config({ path: join(__dirname, '..', '..', '..', '.env') });

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

// Initialize LLM service
const llmService = new LLMService();

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
      
      // Generate LLM response (now async)
      const botResponseData = await generateBotResponse(action.payload.message, gameState);
      
      const botResponse: ChatMessage = {
        id: uuidv4(),
        timestamp: new Date(),
        sender: 'bot',
        message: botResponseData.message,
        type: 'chat',
        metadata: botResponseData.metadata, // Store LLM metadata
      };
      gameState.session.conversationHistory.push(botResponse);
      
      result = { 
        playerMessage: message,
        botResponse: botResponse,
        llmMetadata: botResponseData.metadata,
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
    const completedSteps = quest.steps.filter(s => s.completed).length;
    const totalSteps = quest.steps.length;
    const nextStep = quest.steps.find(s => !s.completed);
    
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
      const itemNames = gameState.inventory.items.map(item => item.name).join(', ');
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
