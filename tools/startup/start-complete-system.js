#!/usr/bin/env node
/**
 * Start Complete myMCP System - Engine and MCP Server
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting complete myMCP system...');

// Check if engine dist exists
const engineDistPath = path.join(__dirname, 'packages', 'engine', 'dist', 'index.js');
const mcpDistPath = path.join(__dirname, 'packages', 'mcpserver', 'dist', 'index.js');

if (!fs.existsSync(engineDistPath)) {
  console.error('❌ Engine not built. Building engine first...');
  process.exit(1);
}

if (!fs.existsSync(mcpDistPath)) {
  console.error('❌ MCP Server not built. Building MCP server first...');
  process.exit(1);
}

console.log('✅ Starting Engine at http://localhost:3000...');

// Start the engine
const engineProcess = spawn('node', ['dist/index.js'], {
  cwd: path.join(__dirname, 'packages', 'engine'),
  stdio: ['inherit', 'inherit', 'inherit'],
  env: { ...process.env }
});

// Wait a bit for engine to start, then start MCP server
setTimeout(() => {
  console.log('✅ Starting MCP Server...');
  
  const mcpProcess = spawn('node', ['dist/index.js'], {
    cwd: path.join(__dirname, 'packages', 'mcpserver'),
    stdio: ['inherit', 'inherit', 'inherit'],
    env: { 
      ...process.env,
      ENGINE_BASE_URL: 'http://localhost:3000',
      DEFAULT_PLAYER_ID: 'claude-player'
    }
  });

  mcpProcess.on('close', (code) => {
    console.log(`MCP Server exited with code ${code}`);
    engineProcess.kill();
  });

  mcpProcess.on('error', (error) => {
    console.error('Failed to start MCP server:', error);
    engineProcess.kill();
  });

}, 3000);

engineProcess.on('close', (code) => {
  console.log(`Engine exited with code ${code}`);
});

engineProcess.on('error', (error) => {
  console.error('Failed to start engine:', error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  engineProcess.kill();
  process.exit(0);
});
