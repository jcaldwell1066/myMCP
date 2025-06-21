#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');
require('dotenv').config();

console.log(chalk.cyan('🚀 Starting myMCP Full System with Admin Dashboard...\n'));

// Track all processes
const processes = [];

// Service configurations
const services = [
  {
    name: 'Redis',
    command: 'redis-server',
    args: [],
    color: chalk.red,
    checkCommand: 'redis-cli',
    checkArgs: ['ping']
  },
  {
    name: 'Engine 1 (Leader)',
    command: 'node',
    args: ['start-engine.js', '3001', 'true'],
    cwd: __dirname,
    color: chalk.green,
    delay: 2000
  },
  {
    name: 'Engine 2',
    command: 'node',
    args: ['start-engine.js', '3002'],
    cwd: __dirname,
    color: chalk.blue,
    delay: 1000
  },
  {
    name: 'Engine 3',
    command: 'node',
    args: ['start-engine.js', '3003'],
    cwd: __dirname,
    color: chalk.magenta,
    delay: 1000
  },
  {
    name: 'MCP Server',
    command: 'node',
    args: ['start-mcp.js'],
    cwd: __dirname,
    color: chalk.yellow,
    delay: 2000
  },
  {
    name: 'Admin Dashboard',
    command: 'node',
    args: ['start-admin.js'],
    cwd: __dirname,
    color: chalk.cyan,
    delay: 3000
  }
];

// Check if Redis is running
async function checkRedis() {
  return new Promise((resolve) => {
    const check = spawn('redis-cli', ['ping']);
    check.on('close', (code) => {
      resolve(code === 0);
    });
    check.on('error', () => {
      resolve(false);
    });
  });
}

// Start a service
async function startService(service, index) {
  const prefix = service.color(`[${service.name}]`);
  
  // Add delay if specified
  if (service.delay) {
    await new Promise(resolve => setTimeout(resolve, service.delay));
  }

  console.log(`${prefix} Starting...`);

  const proc = spawn(service.command, service.args, {
    cwd: service.cwd || process.cwd(),
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: {
      ...process.env,
      REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379'
    }
  });

  // Handle stdout
  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(`${prefix} ${line}`);
    });
  });

  // Handle stderr
  proc.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.error(`${prefix} ${chalk.red(line)}`);
    });
  });

  proc.on('error', (err) => {
    console.error(`${prefix} ${chalk.red('Failed to start:')} ${err.message}`);
  });

  proc.on('close', (code) => {
    console.log(`${prefix} ${chalk.gray(`Exited with code ${code}`)}`);
    
    // If a critical service fails, stop all
    if (index < 2 && code !== 0) {
      console.log(chalk.red('\n❌ Critical service failed. Stopping all services...'));
      stopAll();
    }
  });

  processes.push({ name: service.name, proc });
  return proc;
}

// Stop all services
function stopAll() {
  console.log(chalk.yellow('\n⏹️  Stopping all services...'));
  
  // Stop in reverse order
  processes.reverse().forEach(({ name, proc }) => {
    console.log(chalk.gray(`Stopping ${name}...`));
    proc.kill('SIGTERM');
  });

  setTimeout(() => {
    process.exit(0);
  }, 2000);
}

// Main startup sequence
async function start() {
  // Check if we have a Redis URL in environment
  if (process.env.REDIS_URL) {
    console.log(chalk.green('✅ Using Redis Cloud instance\n'));
    console.log(chalk.gray(`   ${process.env.REDIS_URL.replace(/:[^:@]+@/, ':****@')}\n`));
    // Remove local Redis from services since we're using cloud
    services.shift();
  } else {
    // Check if local Redis is running
    const redisRunning = await checkRedis();
    
    if (!redisRunning) {
      console.log(chalk.yellow('Redis is not running. Starting Redis first...\n'));
    } else {
      console.log(chalk.green('✅ Redis is already running\n'));
      // Remove Redis from services if already running
      services.shift();
    }
  }

  // Start all services
  for (let i = 0; i < services.length; i++) {
    await startService(services[i], i);
  }

  console.log(chalk.green('\n✅ All services started!\n'));
  
  const redisDisplay = process.env.REDIS_URL 
    ? process.env.REDIS_URL.replace(/:[^:@]+@/, ':****@').substring(0, 50) + '...'
    : 'redis://localhost:6379';
    
  console.log(chalk.cyan('╔═══════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║              myMCP Full System Running                    ║'));
  console.log(chalk.cyan('╠═══════════════════════════════════════════════════════════╣'));
  console.log(chalk.cyan('║  Redis:          ' + redisDisplay.padEnd(41) + '║'));
  console.log(chalk.cyan('║  Engine 1:       http://localhost:3001 (Leader)           ║'));
  console.log(chalk.cyan('║  Engine 2:       http://localhost:3002                    ║'));
  console.log(chalk.cyan('║  Engine 3:       http://localhost:3003                    ║'));
  console.log(chalk.cyan('║  MCP Server:     stdio communication                      ║'));
  console.log(chalk.cyan('║  Admin Dashboard: http://localhost:3500                   ║'));
  console.log(chalk.cyan('╚═══════════════════════════════════════════════════════════╝'));
  console.log(chalk.yellow('\nPress Ctrl+C to stop all services\n'));
}

// Handle graceful shutdown
process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);

// Handle uncaught errors
process.on('uncaughtException', (err) => {
  console.error(chalk.red('\n❌ Uncaught exception:'), err);
  stopAll();
});

// Start the system
start().catch((err) => {
  console.error(chalk.red('❌ Failed to start system:'), err);
  process.exit(1);
}); 