#!/usr/bin/env node
/**
 * Start both Engine and MCP Server
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🎮 Starting myMCP Complete System...');

// Start Engine
console.log('🚀 Starting Engine...');
const engineProcess = spawn('node', ['dist/index.js'], {
  cwd: path.join(__dirname, 'packages', 'engine'),
  stdio: ['inherit', 'inherit', 'inherit']
});

// Wait a bit for engine to start, then start MCP server
setTimeout(() => {
  console.log('📡 Starting MCP Server...');
  const mcpProcess = spawn('node', ['dist/index.js'], {
    cwd: path.join(__dirname, 'packages', 'mcpserver'),
    stdio: ['inherit', 'inherit', 'inherit'],
    env: {
      ...process.env,
      ENGINE_BASE_URL: 'http://localhost:3000',
      DEFAULT_PLAYER_ID: 'claude-player'
    }
  });
  
  mcpProcess.on('error', (error) => {
    console.error('❌ MCP Server failed:', error);
  });
}, 3000);

engineProcess.on('error', (error) => {
  console.error('❌ Engine failed:', error);
});

console.log('✅ Both services starting...');
console.log('📋 Services:');
console.log('   🚀 Engine: http://localhost:3000');
console.log('   📡 MCP Server: stdio communication');
console.log('');
console.log('🔧 To stop: Ctrl+C');
