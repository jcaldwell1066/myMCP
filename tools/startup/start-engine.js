#!/usr/bin/env node
/**
 * Start myMCP Engine
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting myMCP Engine...');

const engineProcess = spawn('node', ['dist/index.js'], {
  cwd: path.join(__dirname, '..', '..', 'packages', 'engine'),
  stdio: 'inherit'
});

engineProcess.on('close', (code) => {
  console.log(`Engine exited with code ${code}`);
});

engineProcess.on('error', (error) => {
  console.error('Failed to start engine:', error);
});
