#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting myMCP Admin Dashboard...\n');

const adminPath = path.join(__dirname, '../../packages/admin');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Environment variables
const env = {
  ...process.env,
  NODE_ENV: process.env.NODE_ENV || 'development',
  ADMIN_PORT: process.env.ADMIN_PORT || '3500',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  ENGINE_ENDPOINTS: process.env.ENGINE_ENDPOINTS || 'http://localhost:3001,http://localhost:3002,http://localhost:3003'
};

// Build the admin module first
console.log('📦 Building admin module...');
const buildProcess = spawn('npm', ['run', 'build'], {
  cwd: adminPath,
  stdio: 'inherit',
  shell: true
});

buildProcess.on('close', (code) => {
  if (code !== 0) {
    console.error('❌ Build failed');
    process.exit(1);
  }

  console.log('✅ Build complete\n');
  console.log('🌐 Starting admin server...');

  // Start the admin server
  const adminProcess = spawn('npm', ['start'], {
    cwd: adminPath,
    stdio: 'inherit',
    shell: true,
    env
  });

  adminProcess.on('error', (err) => {
    console.error('❌ Failed to start admin server:', err);
    process.exit(1);
  });

  adminProcess.on('close', (code) => {
    console.log(`Admin server exited with code ${code}`);
    process.exit(code);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n⏹️  Shutting down admin server...');
    adminProcess.kill('SIGTERM');
  });

  process.on('SIGTERM', () => {
    adminProcess.kill('SIGTERM');
  });

  console.log(`
╔═══════════════════════════════════════════════╗
║         myMCP Admin Dashboard Ready           ║
╠═══════════════════════════════════════════════╣
║  Dashboard: http://localhost:${env.ADMIN_PORT}         ║
║  API:       http://localhost:${env.ADMIN_PORT}/api     ║
║  WebSocket: ws://localhost:${env.ADMIN_PORT}           ║
╚═══════════════════════════════════════════════╝

Press Ctrl+C to stop the server
`);
}); 