#!/usr/bin/env node

/**
 * myMCP Enhanced MCP Server - Comprehensive Engine Integration
 * Full-featured JSON-RPC server mapping all myMCP Engine capabilities
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
const DEFAULT_PLAYER_ID = process.env.DEFAULT_PLAYER_ID || 'claude-player';

// Create MCP server instance with enhanced capabilities
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

// 🔍 RESOURCES - Comprehensive resource mapping
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      // Game-specific resources
      {
        uri: `mcp://game/player/${DEFAULT_PLAYER_ID}`,
        mimeType: 'application/json',
        name: 'Player Profile',
        description: 'Current player state including name, level, score, and achievements',
      },
      {
        uri: `mcp://game/quests/${DEFAULT_PLAYER_ID}`,
        mimeType: 'application/json',
        name: 'Quest Status',
        description: 'Available, active, and completed quests for the player',
      },
      {
        uri: `mcp://game/state/${DEFAULT_PLAYER_ID}`,
        mimeType: 'application/json',
        name: 'Complete Game State',
        description: 'Full game state including player, quests, inventory, and world data',
      },
      {
        uri: `mcp://game/inventory/${DEFAULT_PLAYER_ID}`,
        mimeType: 'application/json',
        name: 'Player Inventory',
        description: 'Items and resources owned by the player',
      },
      {
        uri: `mcp://game/chat-history/${DEFAULT_PLAYER_ID}`,
        mimeType: 'application/json',
        name: 'Chat History',
        description: 'Recent conversation history and interactions',
      },
      {
        uri: `mcp://game/world/${DEFAULT_PLAYER_ID}`,
        mimeType: 'application/json',
        name: 'Game World',
        description: 'Current location, available locations, NPCs, and world state',
      },
      // System resources
      {
        uri: 'mcp://system/health',
        mimeType: 'application/json',
        name: 'System Health',
        description: 'Engine health status and availability',
      },
      {
        uri: 'mcp://system/llm-status',
        mimeType: 'application/json',
        name: 'LLM Provider Status',
        description: 'AI provider configuration and status',
      },
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  const url = new URL(uri);
  
  try {
    switch (url.pathname) {
      case `/game/player/${DEFAULT_PLAYER_ID}`: {
        const response = await callEngineAPI('GET', `/api/state/${DEFAULT_PLAYER_ID}`);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(response.data?.player || {}, null, 2),
            },
          ],
        };
      }
      
      case `/game/quests/${DEFAULT_PLAYER_ID}`: {
        const response = await callEngineAPI('GET', `/api/quests/${DEFAULT_PLAYER_ID}`);
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
      
      case `/game/state/${DEFAULT_PLAYER_ID}`: {
        const response = await callEngineAPI('GET', `/api/state/${DEFAULT_PLAYER_ID}`);
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
      
      case `/game/inventory/${DEFAULT_PLAYER_ID}`: {
        const response = await callEngineAPI('GET', `/api/state/${DEFAULT_PLAYER_ID}`);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(response.data?.inventory || {}, null, 2),
            },
          ],
        };
      }
      
      case `/game/chat-history/${DEFAULT_PLAYER_ID}`: {
        const response = await callEngineAPI('GET', `/api/state/${DEFAULT_PLAYER_ID}`);
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(response.data?.conversation || [], null, 2),
            },
          ],
        };
      }
      
      case `/game/world/${DEFAULT_PLAYER_ID}`: {
        const response = await callEngineAPI('GET', `/api/state/${DEFAULT_PLAYER_ID}`);
        const worldData = {
          currentLocation: response.data?.player?.currentLocation || 'unknown',
          availableLocations: response.data?.world?.locations || [],
          npcs: response.data?.world?.npcs || [],
          worldState: response.data?.world || {}
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

// 🔧 TOOLS - Comprehensive tool mapping
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Quest Management
      {
        name: 'start_quest',
        description: 'Start a new quest for the player',
        inputSchema: {
          type: 'object',
          properties: {
            questId: { type: 'string', description: 'ID of the quest to start' },
            playerId: { type: 'string', description: 'Player ID (optional, uses default if not provided)' },
          },
          required: ['questId'],
        },
      },
      {
        name: 'complete_quest_step',
        description: 'Complete a specific step in an active quest',
        inputSchema: {
          type: 'object',
          properties: {
            stepId: { type: 'string', description: 'ID of the quest step to complete' },
            playerId: { type: 'string', description: 'Player ID (optional)' },
          },
          required: ['stepId'],
        },
      },
      {
        name: 'complete_quest',
        description: 'Mark an entire quest as completed',
        inputSchema: {
          type: 'object',
          properties: {
            questId: { type: 'string', description: 'ID of the quest to complete' },
            playerId: { type: 'string', description: 'Player ID (optional)' },
          },
          required: ['questId'],
        },
      },
      
      // Player Management
      {
        name: 'update_player',
        description: 'Update player profile information',
        inputSchema: {
          type: 'object',
          properties: {
            updates: { 
              type: 'object', 
              description: 'Player data to update (name, level, etc.)',
              properties: {
                name: { type: 'string' },
                level: { type: 'string' },
                currentLocation: { type: 'string' },
              }
            },
            playerId: { type: 'string', description: 'Player ID (optional)' },
          },
          required: ['updates'],
        },
      },
      {
        name: 'set_player_score',
        description: 'Set the player\'s score to a specific value',
        inputSchema: {
          type: 'object',
          properties: {
            score: { type: 'number', description: 'New score value' },
            playerId: { type: 'string', description: 'Player ID (optional)' },
          },
          required: ['score'],
        },
      },
      {
        name: 'change_location',
        description: 'Move player to a different location in the game world',
        inputSchema: {
          type: 'object',
          properties: {
            location: { type: 'string', description: 'Target location name' },
            playerId: { type: 'string', description: 'Player ID (optional)' },
          },
          required: ['location'],
        },
      },
      
      // Chat & Interaction
      {
        name: 'send_chat_message',
        description: 'Send a chat message to the game and get AI response',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Chat message to send' },
            playerId: { type: 'string', description: 'Player ID (optional)' },
          },
          required: ['message'],
        },
      },
      {
        name: 'get_completions',
        description: 'Get context-aware completions for player input',
        inputSchema: {
          type: 'object',
          properties: {
            prefix: { type: 'string', description: 'Text prefix to complete' },
            playerId: { type: 'string', description: 'Player ID (optional)' },
          },
          required: ['prefix'],
        },
      },
      
      // Inventory
      {
        name: 'use_item',
        description: 'Use an item from the player\'s inventory',
        inputSchema: {
          type: 'object',
          properties: {
            itemId: { type: 'string', description: 'ID of the item to use' },
            playerId: { type: 'string', description: 'Player ID (optional)' },
          },
          required: ['itemId'],
        },
      },
      
      // Utility
      {
        name: 'get_game_state',
        description: 'Get the complete current game state',
        inputSchema: {
          type: 'object',
          properties: {
            playerId: { type: 'string', description: 'Player ID (optional)' },
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
              text: `Quest "${args.questId}" started successfully!\n${JSON.stringify(response.data || {}, null, 2)}`,
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
              text: `Quest step "${args.stepId}" completed!\n${JSON.stringify(response.data || {}, null, 2)}`,
            },
          ],
        };
      }
      
      case 'complete_quest': {
        if (!args?.questId) {
          throw new McpError(ErrorCode.InvalidRequest, 'questId is required');
        }
        const response = await callEngineAPI('POST', `/api/actions/${playerId}`, {
          type: 'COMPLETE_QUEST',
          payload: { questId: args.questId },
          playerId,
        });
        return {
          content: [
            {
              type: 'text',
              text: `Quest "${args.questId}" completed!\n${JSON.stringify(response.data || {}, null, 2)}`,
            },
          ],
        };
      }
      
      case 'update_player': {
        if (!args?.updates) {
          throw new McpError(ErrorCode.InvalidRequest, 'updates object is required');
        }
        const response = await callEngineAPI('PUT', `/api/state/${playerId}/player`, args.updates);
        return {
          content: [
            {
              type: 'text',
              text: `Player updated successfully!\n${JSON.stringify(response.data || {}, null, 2)}`,
            },
          ],
        };
      }
      
      case 'set_player_score': {
        if (args?.score === undefined || args?.score === null) {
          throw new McpError(ErrorCode.InvalidRequest, 'score is required');
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
              text: `Player score set to ${args.score}!\n${JSON.stringify(response.data || {}, null, 2)}`,
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
              text: `Player moved to "${args.location}"!\n${JSON.stringify(response.data || {}, null, 2)}`,
            },
          ],
        };
      }
      
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
        if (!args?.prefix || typeof args.prefix !== 'string') {
          throw new McpError(ErrorCode.InvalidRequest, 'prefix (string) is required');
        }
        const response = await callEngineAPI('GET', `/api/context/completions?prefix=${encodeURIComponent(args.prefix)}&playerId=${playerId}`);
        return {
          content: [
            {
              type: 'text',
              text: `Completions for "${args.prefix}":\n${JSON.stringify(response.data || [], null, 2)}`,
            },
          ],
        };
      }
      
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
              text: `Item "${args.itemId}" used!\n${JSON.stringify(response.data || {}, null, 2)}`,
            },
          ],
        };
      }
      
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

// 💬 PROMPTS - Game guidance and context-aware prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'game/character-creation',
        description: 'Generate character backstory and setup',
        arguments: [
          {
            name: 'playerName',
            description: 'Name of the player character',
            required: false,
          },
          {
            name: 'characterClass',
            description: 'Character class or type',
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
            description: 'ID of the quest to explain',
            required: true,
          },
        ],
      },
      {
        name: 'game/help-context',
        description: 'Context-aware help text based on current game state',
        arguments: [
          {
            name: 'topic',
            description: 'Specific help topic',
            required: false,
          },
        ],
      },
      {
        name: 'game/progress-summary',
        description: 'Player progress overview and achievements',
        arguments: [],
      },
      {
        name: 'game/next-actions',
        description: 'Suggest next steps based on current game state',
        arguments: [],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const playerId = DEFAULT_PLAYER_ID;

  try {
    // Get current game state for context
    const gameState = await callEngineAPI('GET', `/api/state/${playerId}`);
    
    switch (name) {
      case 'game/character-creation': {
        const playerName = args?.playerName || 'Hero';
        const characterClass = args?.characterClass || 'Adventurer';
        
        return {
          description: `Character creation prompt for ${playerName}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Create a compelling backstory for a character named "${playerName}" who is a ${characterClass}. Consider their motivations, background, and how they ended up in this adventure. Make it engaging and personal.`,
              },
            },
          ],
        };
      }
      
      case 'game/quest-briefing': {
        const questId = args?.questId;
        // You could fetch quest details from the API here
        
        return {
          description: `Quest briefing for ${questId}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Provide a detailed briefing for quest "${questId}". Explain the objectives, background story, key challenges, and expected rewards. Make it immersive and engaging.`,
              },
            },
          ],
        };
      }
      
      case 'game/help-context': {
        const topic = args?.topic || 'general';
        const currentState = JSON.stringify(gameState.data || {}, null, 2);
        
        return {
          description: `Context-aware help for ${topic}`,
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Based on this current game state:\n${currentState}\n\nProvide helpful guidance about "${topic}". Focus on what the player can do next and any relevant mechanics or strategies.`,
              },
            },
          ],
        };
      }
      
      case 'game/progress-summary': {
        const currentState = JSON.stringify(gameState.data || {}, null, 2);
        
        return {
          description: 'Player progress summary',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Based on this game state:\n${currentState}\n\nCreate a comprehensive progress summary including achievements, current objectives, completed quests, and overall progress. Make it encouraging and highlight key accomplishments.`,
              },
            },
          ],
        };
      }
      
      case 'game/next-actions': {
        const currentState = JSON.stringify(gameState.data || {}, null, 2);
        
        return {
          description: 'Suggested next actions',
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Based on this current game state:\n${currentState}\n\nSuggest 3-5 specific next actions the player could take. Consider their current quests, location, inventory, and progress. Prioritize the most important or rewarding actions.`,
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

// Start the server
async function main() {
  try {
    console.error('🚀 Starting myMCP Enhanced MCP Server...');
    
    // Test engine connection first
    const engineAvailable = await testEngineConnection();
    if (!engineAvailable) {
      console.error('⚠️  Warning: Engine is not available. Some features may not work.');
      console.error('   Start the engine with: node start-engine.js');
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('✅ myMCP Enhanced MCP Server started successfully!');
    console.error(`📡 Connected to engine at: ${ENGINE_BASE_URL}`);
    console.error(`👤 Default player ID: ${DEFAULT_PLAYER_ID}`);
    console.error('🔧 Available Tools: 11 (Quest, Player, Chat, Inventory management)');
    console.error('🔍 Available Resources: 8 (Game state, System status)');
    console.error('💬 Available Prompts: 5 (Game guidance and context)');
    
    // Keep the process alive
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Module detection for ES modules
const isMainModule = process.argv[1] === __filename;

if (isMainModule) {
  console.error('🎯 Running as main module, starting enhanced server...');
  main().catch((error) => {
    console.error('💥 Unhandled error in main:', error);
    process.exit(1);
  });
} else {
  console.error('📦 Loaded as module, not starting server automatically');
}

export { server };
