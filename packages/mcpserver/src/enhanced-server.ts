#!/usr/bin/env node

/**
 * Enhanced myMCP MCP Server
 * Comprehensive MCP integration implementing the full resource/tool/prompt mapping
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module equivalents for __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Engine API configuration
const ENGINE_BASE_URL = process.env.ENGINE_BASE_URL || 'http://localhost:3000';
const DEFAULT_PLAYER_ID = process.env.DEFAULT_PLAYER_ID || 'mcp-player';

// Add comprehensive error handling
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Create enhanced MCP server instance
const server = new Server(
  {
    name: 'myMCP-enhanced-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
      prompts: {},
    },
  }
);

// Helper function to make engine API calls
async function callEngineAPI(method: string, path: string, data?: any): Promise<any> {
  try {
    const url = `${ENGINE_BASE_URL}${path}`;
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error: any) {
    console.error(`Engine API call failed: ${method} ${path}`, error.message);
    if (error.response?.data) {
      throw new McpError(
        ErrorCode.InternalError,
        `Engine API error: ${error.response.data.error || error.message}`
      );
    }
    throw new McpError(ErrorCode.InternalError, `Failed to connect to game engine: ${error.message}`);
  }
}

// Extract player ID from resource URI
function extractPlayerIdFromUri(uri: string): string {
  const url = new URL(uri);
  const pathParts = url.pathname.split('/');
  return pathParts[pathParts.length - 1] || DEFAULT_PLAYER_ID;
}

// 🔍 RESOURCES Implementation
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      // Player Resources
      {
        uri: `mcp://game/player/${DEFAULT_PLAYER_ID}`,
        mimeType: 'application/json',
        name: 'Player Profile',
        description: 'Player profile with stats, level, achievements, and current quest',
      },
      {
        uri: `mcp://game/quests/${DEFAULT_PLAYER_ID}`,
        mimeType: 'application/json',
        name: 'Quest Catalog',
        description: 'Available, active, completed, and recommended quests',
      },
      {
        uri: `mcp://game/state/${DEFAULT_PLAYER_ID}`,
        mimeType: 'application/json',
        name: 'Full Game State',
        description: 'Complete game state including all player data',
      },
      {
        uri: `mcp://game/inventory/${DEFAULT_PLAYER_ID}`,
        mimeType: 'application/json',
        name: 'Player Inventory',
        description: 'Player inventory items and equipment',
      },
      {
        uri: `mcp://game/chat-history/${DEFAULT_PLAYER_ID}`,
        mimeType: 'application/json',
        name: 'Chat History',
        description: 'Recent conversation history with the game',
      },
      {
        uri: `mcp://game/world/${DEFAULT_PLAYER_ID}`,
        mimeType: 'application/json',
        name: 'Game World',
        description: 'Current location, available locations, NPCs, and world state',
      },
      // System Resources
      {
        uri: 'mcp://system/health',
        mimeType: 'application/json',
        name: 'System Health',
        description: 'Engine health status and system information',
      },
      {
        uri: 'mcp://system/llm-status',
        mimeType: 'application/json',
        name: 'LLM Status',
        description: 'LLM provider status and configuration',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const url = new URL(uri);
  const playerId = extractPlayerIdFromUri(uri);
  
  try {
    switch (url.pathname.replace(`/${playerId}`, '')) {
      case '/game/player': {
        const response = await callEngineAPI('GET', `/api/state/${playerId}`);
        const playerData = {
          name: response.data?.player?.name || 'Hero',
          level: response.data?.player?.level || 'apprentice',
          score: response.data?.player?.score || 0,
          currentQuest: response.data?.player?.currentQuest || null,
          achievements: response.data?.player?.achievements || [],
          stats: response.data?.player?.stats || {},
          location: response.data?.player?.location || 'town',
        };
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(playerData, null, 2),
            },
          ],
        };
      }
      
      case '/game/quests': {
        const response = await callEngineAPI('GET', `/api/state/${playerId}`);
        const questData = {
          available: response.data?.quests?.available || [],
          active: response.data?.quests?.active || {},
          completed: response.data?.quests?.completed || [],
          recommended: response.data?.quests?.recommended || [],
        };
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(questData, null, 2),
            },
          ],
        };
      }
      
      case '/game/state': {
        const response = await callEngineAPI('GET', `/api/state/${playerId}`);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(response.data || {}, null, 2),
            },
          ],
        };
      }
      
      case '/game/inventory': {
        const response = await callEngineAPI('GET', `/api/state/${playerId}`);
        const inventoryData = response.data?.inventory || { items: [], equipment: {} };
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(inventoryData, null, 2),
            },
          ],
        };
      }
      
      case '/game/chat-history': {
        const response = await callEngineAPI('GET', `/api/state/${playerId}`);
        const chatHistory = response.data?.conversation || [];
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(chatHistory, null, 2),
            },
          ],
        };
      }
      
      case '/game/world': {
        const response = await callEngineAPI('GET', `/api/state/${playerId}`);
        const worldData = {
          currentLocation: response.data?.player?.location || 'town',
          availableLocations: response.data?.world?.locations || [],
          npcs: response.data?.world?.npcs || [],
          worldState: response.data?.world?.state || {},
        };
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(worldData, null, 2),
            },
          ],
        };
      }
      
      case '/system/health': {
        const response = await callEngineAPI('GET', '/health');
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(response || {}, null, 2),
            },
          ],
        };
      }
      
      case '/system/llm-status': {
        const response = await callEngineAPI('GET', '/api/llm/status');
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(response || {}, null, 2),
            },
          ],
        };
      }
      
      default:
        throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
    }
  } catch (error: any) {
    console.error('Resource read error:', error);
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, `Failed to read resource: ${error.message}`);
  }
});

// 🔧 TOOLS Implementation
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Quest Management Tools
      {
        name: 'start_quest',
        description: 'Start a new quest for the player',
        inputSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', description: 'Player ID', default: DEFAULT_PLAYER_ID },
            questId: { type: 'string', description: 'Quest ID to start' },
          },
          required: ['questId'],
        },
      },
      {
        name: 'complete_quest_step',
        description: 'Complete a step in the current quest',
        inputSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', description: 'Player ID', default: DEFAULT_PLAYER_ID },
            stepId: { type: 'string', description: 'Quest step ID to complete' },
          },
          required: ['stepId'],
        },
      },
      {
        name: 'complete_quest',
        description: 'Complete the current quest',
        inputSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', description: 'Player ID', default: DEFAULT_PLAYER_ID },
          },
        },
      },
      
      // Player Management Tools
      {
        name: 'update_player',
        description: 'Update player information',
        inputSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', description: 'Player ID', default: DEFAULT_PLAYER_ID },
            updates: { 
              type: 'object', 
              description: 'Player updates',
              properties: {
                name: { type: 'string' },
                level: { type: 'string' },
                score: { type: 'number' },
              }
            },
          },
          required: ['updates'],
        },
      },
      {
        name: 'set_player_score',
        description: 'Set the player score',
        inputSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', description: 'Player ID', default: DEFAULT_PLAYER_ID },
            score: { type: 'number', description: 'New score value' },
          },
          required: ['score'],
        },
      },
      {
        name: 'change_location',
        description: 'Move player to a new location',
        inputSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', description: 'Player ID', default: DEFAULT_PLAYER_ID },
            location: { type: 'string', description: 'New location name' },
          },
          required: ['location'],
        },
      },
      
      // Chat & Interaction Tools
      {
        name: 'send_chat_message',
        description: 'Send a chat message to the game and get AI response',
        inputSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', description: 'Player ID', default: DEFAULT_PLAYER_ID },
            message: { type: 'string', description: 'Chat message to send' },
          },
          required: ['message'],
        },
      },
      {
        name: 'get_completions',
        description: 'Get context-aware completions for input',
        inputSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', description: 'Player ID', default: DEFAULT_PLAYER_ID },
            prefix: { type: 'string', description: 'Text prefix for completions' },
          },
          required: ['prefix'],
        },
      },
      
      // Inventory Tools
      {
        name: 'use_item',
        description: 'Use an item from the player inventory',
        inputSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', description: 'Player ID', default: DEFAULT_PLAYER_ID },
            itemId: { type: 'string', description: 'Item ID to use' },
          },
          required: ['itemId'],
        },
      },
      
      // General Game State Tool
      {
        name: 'get_game_state',
        description: 'Get the current game state',
        inputSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', description: 'Player ID', default: DEFAULT_PLAYER_ID },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const playerId = args?.playerId || DEFAULT_PLAYER_ID;

  try {
    switch (name) {
      // Quest Management
      case 'start_quest': {
        if (!args?.questId) {
          throw new McpError(ErrorCode.InvalidRequest, 'questId is required');
        }
        const response = await callEngineAPI('POST', `/api/actions/${playerId}`, {
          type: 'START_QUEST',
          payload: { questId: args.questId },
          playerId,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Quest "${args.questId}" started successfully! ${response.data?.message || ''}`,
            },
          ],
        };
      }
      
      case 'complete_quest_step': {
        if (!args?.stepId) {
          throw new McpError(ErrorCode.InvalidRequest, 'stepId is required');
        }
        const response = await callEngineAPI('POST', `/api/actions/${playerId}`, {
          type: 'COMPLETE_QUEST_STEP',
          payload: { stepId: args.stepId },
          playerId,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Quest step "${args.stepId}" completed! ${response.data?.message || ''}`,
            },
          ],
        };
      }
      
      case 'complete_quest': {
        const response = await callEngineAPI('POST', `/api/actions/${playerId}`, {
          type: 'COMPLETE_QUEST',
          payload: {},
          playerId,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Quest completed successfully! ${response.data?.message || ''}`,
            },
          ],
        };
      }
      
      // Player Management
      case 'update_player': {
        if (!args?.updates) {
          throw new McpError(ErrorCode.InvalidRequest, 'updates object is required');
        }
        const response = await callEngineAPI('PUT', `/api/state/${playerId}/player`, args.updates);
        return {
          content: [
            {
              type: 'text',
              text: `Player updated successfully! ${JSON.stringify(response.data || {})}`,
            },
          ],
        };
      }
      
      case 'set_player_score': {
        if (typeof args?.score !== 'number') {
          throw new McpError(ErrorCode.InvalidRequest, 'score must be a number');
        }
        const response = await callEngineAPI('POST', `/api/actions/${playerId}`, {
          type: 'SET_SCORE',
          payload: { score: args.score },
          playerId,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Player score set to ${args.score}! ${response.data?.message || ''}`,
            },
          ],
        };
      }
      
      case 'change_location': {
        if (!args?.location) {
          throw new McpError(ErrorCode.InvalidRequest, 'location is required');
        }
        const response = await callEngineAPI('POST', `/api/actions/${playerId}`, {
          type: 'CHANGE_LOCATION',
          payload: { location: args.location },
          playerId,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Moved to ${args.location}! ${response.data?.message || ''}`,
            },
          ],
        };
      }
      
      // Chat & Interaction
      case 'send_chat_message': {
        if (!args?.message) {
          throw new McpError(ErrorCode.InvalidRequest, 'message is required');
        }
        const response = await callEngineAPI('POST', `/api/actions/${playerId}`, {
          type: 'CHAT',
          payload: { message: args.message },
          playerId,
        });
        return {
          content: [
            {
              type: 'text',
              text: response.data?.botResponse?.message || 'Message sent successfully!',
            },
          ],
        };
      }
      
      case 'get_completions': {
        if (!args?.prefix) {
          throw new McpError(ErrorCode.InvalidRequest, 'prefix is required');
        }
        const response = await callEngineAPI('GET', `/api/context/completions?playerId=${playerId}&prefix=${encodeURIComponent(args.prefix as string)}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data?.completions || [], null, 2),
            },
          ],
        };
      }
      
      // Inventory
      case 'use_item': {
        if (!args?.itemId) {
          throw new McpError(ErrorCode.InvalidRequest, 'itemId is required');
        }
        const response = await callEngineAPI('POST', `/api/actions/${playerId}`, {
          type: 'USE_ITEM',
          payload: { itemId: args.itemId },
          playerId,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Used item "${args.itemId}"! ${response.data?.message || ''}`,
            },
          ],
        };
      }
      
      // General
      case 'get_game_state': {
        const response = await callEngineAPI('GET', `/api/state/${playerId}`);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response.data || {}, null, 2),
            },
          ],
        };
      }
      
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error: any) {
    console.error('Tool execution error:', error);
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error.message}`);
  }
});

// 💬 PROMPTS Implementation
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'game/character-creation',
        description: 'Generate character backstory and personality',
        arguments: [
          {
            name: 'playerName',
            description: 'The player\'s chosen name',
            required: true,
          },
          {
            name: 'preferredClass',
            description: 'Preferred character class or role',
            required: false,
          },
        ],
      },
      {
        name: 'game/quest-briefing',
        description: 'Explain quest objectives and context',
        arguments: [
          {
            name: 'questId',
            description: 'The quest to brief',
            required: true,
          },
          {
            name: 'playerLevel',
            description: 'Current player level for appropriate context',
            required: false,
          },
        ],
      },
      {
        name: 'game/help-context',
        description: 'Context-aware help text',
        arguments: [
          {
            name: 'currentLocation',
            description: 'Player\'s current location',
            required: false,
          },
          {
            name: 'currentQuest',
            description: 'Player\'s active quest',
            required: false,
          },
        ],
      },
      {
        name: 'game/progress-summary',
        description: 'Player progress overview',
        arguments: [
          {
            name: 'playerId',
            description: 'Player ID for progress summary',
            required: false,
          },
        ],
      },
      {
        name: 'game/next-actions',
        description: 'Suggest next steps for the player',
        arguments: [
          {
            name: 'playerId',
            description: 'Player ID for personalized suggestions',
            required: false,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const playerId = args?.playerId || DEFAULT_PLAYER_ID;
  
  try {
    // Get current game state for context
    const gameState = await callEngineAPI('GET', `/api/state/${playerId}`);
    const player = gameState.data?.player || {};
    
    switch (name) {
      case 'game/character-creation': {
        const playerName = args?.playerName || player.name || 'Hero';
        const preferredClass = args?.preferredClass || 'adventurer';
        
        return {
          description: `Character creation for ${playerName}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Create a detailed character backstory for "${playerName}", a ${preferredClass} starting their adventure. Include personality traits, motivations, and background that would make them compelling in a text-based RPG. Make it immersive and engaging, with specific details about their past and what drives them forward.`,
              },
            },
          ],
        };
      }
      
      case 'game/quest-briefing': {
        const questId = args?.questId;
        const playerLevel = args?.playerLevel || player.level || 'apprentice';
        
        if (!questId) {
          throw new McpError(ErrorCode.InvalidRequest, 'questId is required for quest briefing');
        }
        
        return {
          description: `Quest briefing for ${questId}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Provide a detailed briefing for quest "${questId}" suitable for a ${playerLevel} level player. Include the objectives, context, expected challenges, and rewards. Make it engaging and immersive, as if spoken by a quest giver in the game world. Current player state: ${JSON.stringify(player, null, 2)}`,
              },
            },
          ],
        };
      }
      
      case 'game/help-context': {
        const currentLocation = args?.currentLocation || player.location || 'unknown';
        const currentQuest = args?.currentQuest || player.currentQuest || 'none';
        
        return {
          description: `Context-aware help for ${currentLocation}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Provide helpful guidance for a player currently at "${currentLocation}" working on quest "${currentQuest}". Include available actions, tips for success, and relevant game mechanics. Tailor the advice to their current situation and progress. Player state: ${JSON.stringify(player, null, 2)}`,
              },
            },
          ],
        };
      }
      
      case 'game/progress-summary': {
        return {
          description: `Progress summary for ${player.name || 'player'}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Create an engaging progress summary for this player's journey so far. Highlight achievements, current status, and notable milestones. Make it feel like a chronicle of their adventure. Player data: ${JSON.stringify(gameState.data, null, 2)}`,
              },
            },
          ],
        };
      }
      
      case 'game/next-actions': {
        return {
          description: `Next action suggestions for ${player.name || 'player'}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Based on this player's current state and progress, suggest 3-5 specific next actions they could take to advance their adventure. Consider their level, location, active quests, and available resources. Make suggestions engaging and varied. Current game state: ${JSON.stringify(gameState.data, null, 2)}`,
              },
            },
          ],
        };
      }
      
      default:
        throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${name}`);
    }
  } catch (error: any) {
    console.error('Prompt execution error:', error);
    if (error instanceof McpError) {
      throw error;
    }
    throw new McpError(ErrorCode.InternalError, `Prompt execution failed: ${error.message}`);
  }
});

// Test engine connection on startup
async function testEngineConnection(): Promise<boolean> {
  try {
    console.error('🔍 Testing engine connection...');
    const response = await axios.get(`${ENGINE_BASE_URL}/health`, {
      timeout: 5000
    });
    console.error('✅ Engine health check passed:', response.data);
    return true;
  } catch (error: any) {
    console.error('❌ Engine connection failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 The engine is not running. Start it with: node start-engine.js');
    }
    return false;
  }
}

// Start the enhanced server
async function main() {
  try {
    console.error('🚀 Starting Enhanced myMCP MCP Server...');
    
    // Test engine connection first
    const engineAvailable = await testEngineConnection();
    if (!engineAvailable) {
      console.error('⚠️  Warning: Engine is not available. Some features may not work.');
      console.error('   Start the engine with: node start-engine.js');
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('✅ Enhanced myMCP MCP Server started successfully!');
    console.error(`📡 Connected to engine at: ${ENGINE_BASE_URL}`);
    console.error(`👤 Default player ID: ${DEFAULT_PLAYER_ID}`);
    console.error('🔧 Available tools: Quest management, Player management, Chat, Inventory');
    console.error('🔍 Available resources: Player, Quests, State, Inventory, Chat history, World, System');
    console.error('💬 Available prompts: Character creation, Quest briefing, Help, Progress, Next actions');
    
    // Keep the process alive
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ Failed to start enhanced server:', error);
    process.exit(1);
  }
}

// Simple way to detect if this is the main module in ES modules
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  console.error('🎯 Running enhanced server as main module...');
  main().catch((error) => {
    console.error('💥 Unhandled error in enhanced server:', error);
    process.exit(1);
  });
}

export { server };
