#!/usr/bin/env node
/**
 * Start myMCP Engine
 */

const { spawn } = require('child_process');
const path = require('path');

// Get port and isPrimary from command line args
const port = process.argv[2] || '3000';
const isPrimary = process.argv[3] === 'true';

console.log(`🚀 Starting myMCP Engine on port ${port}${isPrimary ? ' (PRIMARY)' : ''}...`);

const engineProcess = spawn('node', ['dist/index.js'], {
  cwd: path.join(__dirname, '..', '..', 'packages', 'engine'),
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: port,
    IS_PRIMARY: isPrimary ? 'true' : 'false',
    ENGINE_ID: `engine-${port}`,
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
  }
});

engineProcess.on('close', (code) => {
  console.log(`Engine exited with code ${code}`);
});

engineProcess.on('error', (error) => {
  console.error('Failed to start engine:', error);
});
