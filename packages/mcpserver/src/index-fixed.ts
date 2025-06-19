#!/usr/bin/env node

/**
 * myMCP MCP Server - Fixed Version with Better Error Handling
 * JSON-RPC server that wraps the myMCP Engine REST API
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';

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

// Create MCP server instance
const server = new Server(
  {
    name: 'myMCP-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

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

// Resource handlers
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: `mcp://game/player/${DEFAULT_PLAYER_ID}`,
        mimeType: 'application/json',
        name: 'Player Profile',
        description: 'Current player state including score, level, and status',
      },
      {
        uri: `mcp://game/state/${DEFAULT_PLAYER_ID}`,
        mimeType: 'application/json',
        name: 'Game State',
        description: 'Complete game state including player, quests, and inventory',
      },
      {
        uri: 'mcp://system/health',
        mimeType: 'application/json',
        name: 'System Health',
        description: 'Engine health status and LLM provider information',
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

// Tool handlers (simplified for testing)
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'send_chat_message',
        description: 'Send a chat message to the game and get AI response',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Chat message to send',
            },
          },
          required: ['message'],
        },
      },
      {
        name: 'get_game_state',
        description: 'Get the current game state',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'send_chat_message': {
        if (!args?.message) {
          throw new McpError(ErrorCode.InvalidRequest, 'message is required');
        }
        const response = await callEngineAPI('POST', `/api/actions/${DEFAULT_PLAYER_ID}`, {
          type: 'CHAT',
          payload: { message: args.message },
          playerId: DEFAULT_PLAYER_ID,
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
      
      case 'get_game_state': {
        const response = await callEngineAPI('GET', `/api/state/${DEFAULT_PLAYER_ID}`);
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

// Start the server
async function main() {
  try {
    console.error('🚀 Starting myMCP MCP Server...');
    
    // Test engine connection first
    const engineAvailable = await testEngineConnection();
    if (!engineAvailable) {
      console.error('⚠️  Warning: Engine is not available. Some features may not work.');
      console.error('   Start the engine with: node start-engine.js');
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('✅ myMCP MCP Server started successfully!');
    console.error(`📡 Connected to engine at: ${ENGINE_BASE_URL}`);
    console.error(`👤 Default player ID: ${DEFAULT_PLAYER_ID}`);
    
    // Keep the process alive
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Only start if this is the main module
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unhandled error in main:', error);
    process.exit(1);
  });
}

export { server };
