#!/usr/bin/env node
/**
 * Start myMCP MCP Server
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('📡 Starting myMCP MCP Server...');

const mcpProcess = spawn('node', ['dist/index.js'], {
  cwd: 'C:\Users\JefferyCaldwell\myMCP\packages\mcpserver',
  stdio: 'inherit',
  env: {
    ...process.env,
    ENGINE_BASE_URL: 'http://localhost:3000',
    DEFAULT_PLAYER_ID: 'claude-player'
  }
});

mcpProcess.on('close', (code) => {
  console.log(`MCP Server exited with code ${code}`);
});

mcpProcess.on('error', (error) => {
  console.error('Failed to start MCP server:', error);
});
