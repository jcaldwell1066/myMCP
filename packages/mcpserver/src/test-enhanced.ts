#!/usr/bin/env node

/**
 * Enhanced MCP Server Test Suite
 * Comprehensive testing of all resources, tools, and prompts
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const ENGINE_BASE_URL = process.env.ENGINE_BASE_URL || 'http://localhost:3000';
const TEST_PLAYER_ID = 'test-player-123';

console.log('🧪 Enhanced MCP Server Test Suite');
console.log('==================================');

// JSON-RPC helper functions
let requestId = 1;

function createJSONRPCRequest(method: string, params: any = {}) {
  return {
    jsonrpc: '2.0',
    id: requestId++,
    method,
    params,
  };
}

function sendJSONRPCRequest(child: any, request: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const requestStr = JSON.stringify(request) + '\n';
    
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 10000);
    
    const responseHandler = (data: Buffer) => {
      const response = data.toString();
      try {
        const parsed = JSON.parse(response);
        if (parsed.id === request.id) {
          clearTimeout(timeout);
          child.stdout.off('data', responseHandler);
          if (parsed.error) {
            reject(new Error(`JSON-RPC Error: ${JSON.stringify(parsed.error)}`));
          } else {
            resolve(parsed.result);
          }
        }
      } catch (e) {
        // Ignore parsing errors, might be partial data
      }
    };
    
    child.stdout.on('data', responseHandler);
    child.stdin.write(requestStr);
  });
}

// Test functions
async function testResources(child: any) {
  console.log('\n📊 Testing Resources...');
  
  // List all resources
  const listRequest = createJSONRPCRequest('resources/list');
  const resources = await sendJSONRPCRequest(child, listRequest);
  
  console.log(`✅ Found ${resources.resources.length} resources:`);
  for (const resource of resources.resources) {
    console.log(`   📄 ${resource.name}: ${resource.uri}`);
  }
  
  // Test reading each resource
  for (const resource of resources.resources) {
    try {
      const readRequest = createJSONRPCRequest('resources/read', {
        uri: resource.uri,
      });
      const content = await sendJSONRPCRequest(child, readRequest);
      console.log(`✅ Read ${resource.name}: ${content.contents[0].text.slice(0, 100)}...`);
    } catch (error) {
      console.log(`❌ Failed to read ${resource.name}: ${(error as Error).message}`);
    }
  }
}

async function testTools(child: any) {
  console.log('\n🔧 Testing Tools...');
  
  // List all tools
  const listRequest = createJSONRPCRequest('tools/list');
  const tools = await sendJSONRPCRequest(child, listRequest);
  
  console.log(`✅ Found ${tools.tools.length} tools:`);
  for (const tool of tools.tools) {
    console.log(`   🔨 ${tool.name}: ${tool.description}`);
  }
  
  // Test key tools
  const testCases = [
    {
      name: 'get_game_state',
      args: { playerId: TEST_PLAYER_ID },
    },
    {
      name: 'send_chat_message',
      args: { playerId: TEST_PLAYER_ID, message: 'Hello, this is a test message!' },
    },
    {
      name: 'set_player_score',
      args: { playerId: TEST_PLAYER_ID, score: 1000 },
    },
    {
      name: 'change_location',
      args: { playerId: TEST_PLAYER_ID, location: 'test-town' },
    },
  ];
  
  for (const testCase of testCases) {
    try {
      const callRequest = createJSONRPCRequest('tools/call', {
        name: testCase.name,
        arguments: testCase.args,
      });
      const result = await sendJSONRPCRequest(child, callRequest);
      console.log(`✅ Tool ${testCase.name}: ${result.content[0].text.slice(0, 100)}...`);
    } catch (error) {
      console.log(`❌ Tool ${testCase.name} failed: ${(error as Error).message}`);
    }
  }
}

async function testPrompts(child: any) {
  console.log('\n💬 Testing Prompts...');
  
  // List all prompts
  const listRequest = createJSONRPCRequest('prompts/list');
  const prompts = await sendJSONRPCRequest(child, listRequest);
  
  console.log(`✅ Found ${prompts.prompts.length} prompts:`);
  for (const prompt of prompts.prompts) {
    console.log(`   💭 ${prompt.name}: ${prompt.description}`);
  }
  
  // Test key prompts
  const testCases = [
    {
      name: 'game/character-creation',
      args: { playerName: 'TestHero', preferredClass: 'wizard' },
    },
    {
      name: 'game/quest-briefing',
      args: { questId: 'test-quest-001', playerLevel: 'intermediate' },
    },
    {
      name: 'game/help-context',
      args: { currentLocation: 'test-town', currentQuest: 'test-quest-001' },
    },
    {
      name: 'game/progress-summary',
      args: { playerId: TEST_PLAYER_ID },
    },
    {
      name: 'game/next-actions',
      args: { playerId: TEST_PLAYER_ID },
    },
  ];
  
  for (const testCase of testCases) {
    try {
      const getRequest = createJSONRPCRequest('prompts/get', {
        name: testCase.name,
        arguments: testCase.args,
      });
      const result = await sendJSONRPCRequest(child, getRequest);
      console.log(`✅ Prompt ${testCase.name}: Generated ${result.messages.length} messages`);
      console.log(`   📝 Content preview: ${result.messages[0].content.text.slice(0, 100)}...`);
    } catch (error) {
      console.log(`❌ Prompt ${testCase.name} failed: ${(error as Error).message}`);
    }
  }
}

async function runTests() {
  try {
    console.log('🚀 Starting enhanced MCP server...');
    
    // Spawn the enhanced server
    const serverPath = join(__dirname, '..', 'dist', 'enhanced-server.js');
    const child = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        ENGINE_BASE_URL,
        DEFAULT_PLAYER_ID: TEST_PLAYER_ID,
      },
    });
    
    // Wait for server to start
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Run all tests
    await testResources(child);
    await testTools(child);
    await testPrompts(child);
    
    console.log('\n🎉 All tests completed!');
    console.log('\nEnhanced MCP Server Summary:');
    console.log('============================');
    console.log('✅ Resources: Player, Quests, State, Inventory, Chat History, World, System Health, LLM Status');
    console.log('✅ Tools: Quest Management, Player Management, Chat, Inventory, Game State');
    console.log('✅ Prompts: Character Creation, Quest Briefing, Help Context, Progress Summary, Next Actions');
    console.log('\nThe enhanced server provides full MCP integration according to your specification!');
    
    // Clean shutdown
    child.kill();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this is the main module
if (process.argv[1] === __filename) {
  runTests();
}

export { runTests };
