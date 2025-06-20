#!/usr/bin/env node

/**
 * Debug script for Redis State Manager development
 * Run with: node debug-redis-manager.js
 * Then attach debugger to port 9229
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🐛 Starting Engine in Debug Mode...\n');
console.log('📍 Debug Port: 9229');
console.log('🔗 Chrome DevTools: chrome://inspect');
console.log('🆚 VS Code: Use "Attach to Running Engine" configuration\n');

// Environment variables for debugging
const env = {
  ...process.env,
  NODE_ENV: 'development',
  PORT: '3000',
  ENGINE_ID: 'debug-engine',
  IS_PRIMARY: 'true',
  REDIS_URL: 'redis://localhost:6379',
  DEBUG: '*',
  NODE_OPTIONS: '--inspect=0.0.0.0:9229'
};

// Start the engine with debugging enabled
const engineProcess = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  env,
  stdio: 'inherit'
});

engineProcess.on('error', (error) => {
  console.error('❌ Failed to start engine:', error);
});

engineProcess.on('close', (code) => {
  console.log(`\n🛑 Engine exited with code ${code}`);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping debug session...');
  engineProcess.kill('SIGTERM');
  process.exit(0);
}); 