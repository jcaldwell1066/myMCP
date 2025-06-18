#!/usr/bin/env node
/**
 * Test myMCP Engine Connection
 */

const axios = require('axios');

const ENGINE_BASE_URL = 'http://localhost:3000';

async function testEngineConnection() {
  try {
    console.log('🔍 Testing engine connection...');
    
    // Test health endpoint
    const healthResponse = await axios.get(`${ENGINE_BASE_URL}/health`, {
      timeout: 5000
    });
    
    console.log('✅ Engine health check passed:', healthResponse.data);
    
    // Test player state endpoint
    try {
      const stateResponse = await axios.get(`${ENGINE_BASE_URL}/api/state/claude-player`, {
        timeout: 5000
      });
      console.log('✅ Player state endpoint working');
    } catch (stateError) {
      console.log('ℹ️  Player state endpoint returned:', stateError.response?.status, stateError.response?.statusText);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Engine connection failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 The engine is not running. Start it with:');
      console.log('   node start-engine.js');
    }
    return false;
  }
}

async function main() {
  const isEngineRunning = await testEngineConnection();
  
  if (isEngineRunning) {
    console.log('\n🎉 Engine is running and accessible!');
    console.log('The MCP server should now be able to connect.');
  } else {
    console.log('\n🚨 Engine is not accessible.');
    console.log('This is why your MCP server is disconnecting immediately.');
  }
}

main();
