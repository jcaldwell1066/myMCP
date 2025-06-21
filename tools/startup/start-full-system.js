#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');
require('dotenv').config();

// Show help if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(chalk.cyan('myMCP System Startup Script\n'));
  console.log('Usage: node start-full-system.js [options]\n');
  console.log('Options:');
  console.log('  --help, -h           Show this help message\n');
  console.log('Environment Variables:');
  console.log('  PRESET               Use a preset configuration:');
  console.log('                       - default: Leader + 2 workers + admin (no MCP)');
  console.log('                       - full: All services including MCP');
  console.log('                       - minimal: Just engine leader');
  console.log('                       - dev: Leader + 1 worker + admin\n');
  console.log('  ENGINE_WORKERS       Number of worker engines (default: 2)');
  console.log('  ENGINE_START_PORT    Starting port for engines (default: 3001)');
  console.log('  ENABLE_MCP           Enable MCP server (default: false)');
  console.log('  ENABLE_ADMIN         Enable admin dashboard (default: true)');
  console.log('  ADMIN_PORT           Admin dashboard port (default: 3500)\n');
  console.log('Examples:');
  console.log('  node start-full-system.js                    # Default setup');
  console.log('  PRESET=full node start-full-system.js        # All services');
  console.log('  ENGINE_WORKERS=0 node start-full-system.js   # Just leader + admin');
  console.log('  ENABLE_MCP=true node start-full-system.js    # Default + MCP\n');
  process.exit(0);
}

// Configuration options with defaults
const CONFIG = {
  // Number of engine workers (not including the leader)
  ENGINE_WORKERS: parseInt(process.env.ENGINE_WORKERS || '2'),
  
  // Starting port for engines (leader will be on this port)
  ENGINE_START_PORT: parseInt(process.env.ENGINE_START_PORT || '3001'),
  
  // Enable/disable services
  ENABLE_MCP: process.env.ENABLE_MCP === 'true' || false,
  ENABLE_ADMIN: process.env.ENABLE_ADMIN !== 'false', // Default true
  
  // Admin dashboard port
  ADMIN_PORT: parseInt(process.env.ADMIN_PORT || '3500'),
  
  // Quick presets
  PRESET: process.env.PRESET || 'default'
};

// Apply presets
if (CONFIG.PRESET === 'full') {
  CONFIG.ENABLE_MCP = true;
  CONFIG.ENGINE_WORKERS = 2;
} else if (CONFIG.PRESET === 'minimal') {
  CONFIG.ENGINE_WORKERS = 0;
  CONFIG.ENABLE_MCP = false;
  CONFIG.ENABLE_ADMIN = false;
} else if (CONFIG.PRESET === 'dev') {
  CONFIG.ENGINE_WORKERS = 1;
  CONFIG.ENABLE_MCP = false;
  CONFIG.ENABLE_ADMIN = true;
}

console.log(chalk.cyan('🚀 Starting myMCP System...\n'));
console.log(chalk.gray('Configuration:'));
console.log(chalk.gray(`  • Preset: ${CONFIG.PRESET}`));
console.log(chalk.gray(`  • Engine Workers: ${CONFIG.ENGINE_WORKERS}`));
console.log(chalk.gray(`  • Leader Port: ${CONFIG.ENGINE_START_PORT}`));
console.log(chalk.gray(`  • MCP Server: ${CONFIG.ENABLE_MCP ? 'Enabled' : 'Disabled'}`));
console.log(chalk.gray(`  • Admin Dashboard: ${CONFIG.ENABLE_ADMIN ? 'Enabled' : 'Disabled'}\n`));

// Track all processes
const processes = [];

// Build service configurations dynamically
const services = [];

// Always add Redis first (if not using cloud)
services.push({
  name: 'Redis',
  command: 'redis-server',
  args: [],
  color: chalk.red,
  checkCommand: 'redis-cli',
  checkArgs: ['ping'],
  critical: true
});

// Add Engine Leader
services.push({
  name: 'Engine Leader',
  command: 'node',
  args: ['start-engine.js', CONFIG.ENGINE_START_PORT.toString(), 'true'],
  cwd: __dirname,
  color: chalk.green,
  delay: 2000,
  critical: true
});

// Add Engine Workers
const workerColors = [chalk.blue, chalk.magenta, chalk.yellow, chalk.cyan];
for (let i = 0; i < CONFIG.ENGINE_WORKERS; i++) {
  const port = CONFIG.ENGINE_START_PORT + i + 1;
  services.push({
    name: `Engine Worker ${i + 1}`,
    command: 'node',
    args: ['start-engine.js', port.toString()],
    cwd: __dirname,
    color: workerColors[i % workerColors.length],
    delay: 1000
  });
}

// Add MCP Server if enabled
if (CONFIG.ENABLE_MCP) {
  services.push({
    name: 'MCP Server',
    command: 'node',
    args: ['start-mcp.js'],
    cwd: __dirname,
    color: chalk.yellow,
    delay: 2000
  });
}

// Add Admin Dashboard if enabled
if (CONFIG.ENABLE_ADMIN) {
  services.push({
    name: 'Admin Dashboard',
    command: 'node',
    args: ['start-admin.js'],
    cwd: __dirname,
    color: chalk.cyan,
    delay: 3000,
    env: { ADMIN_PORT: CONFIG.ADMIN_PORT }
  });
}

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
      ...service.env,
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
    if (service.critical && code !== 0) {
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
  let serviceList = [...services];
  
  // Check if we have a Redis URL in environment
  if (process.env.REDIS_URL) {
    console.log(chalk.green('✅ Using Redis Cloud instance\n'));
    console.log(chalk.gray(`   ${process.env.REDIS_URL.replace(/:[^:@]+@/, ':****@')}\n`));
    // Remove local Redis from services since we're using cloud
    serviceList = serviceList.filter(s => s.name !== 'Redis');
  } else {
    // Check if local Redis is running
    const redisRunning = await checkRedis();
    
    if (!redisRunning) {
      console.log(chalk.yellow('Redis is not running. Starting Redis first...\n'));
    } else {
      console.log(chalk.green('✅ Redis is already running\n'));
      // Remove Redis from services if already running
      serviceList = serviceList.filter(s => s.name !== 'Redis');
    }
  }

  // Start all services
  for (let i = 0; i < serviceList.length; i++) {
    await startService(serviceList[i], i);
  }

  console.log(chalk.green('\n✅ All services started!\n'));
  
  // Build status display
  const redisDisplay = process.env.REDIS_URL 
    ? process.env.REDIS_URL.replace(/:[^:@]+@/, ':****@').substring(0, 50) + '...'
    : 'redis://localhost:6379';
    
  console.log(chalk.cyan('╔═══════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║              myMCP System Running                         ║'));
  console.log(chalk.cyan('╠═══════════════════════════════════════════════════════════╣'));
  console.log(chalk.cyan('║  Redis:          ' + redisDisplay.padEnd(41) + '║'));
  console.log(chalk.cyan('║  Engine Leader:  http://localhost:' + CONFIG.ENGINE_START_PORT + ' (PRIMARY)        ║'));
  
  // Display workers
  for (let i = 0; i < CONFIG.ENGINE_WORKERS; i++) {
    const port = CONFIG.ENGINE_START_PORT + i + 1;
    console.log(chalk.cyan('║  Engine Worker ' + (i + 1) + ': http://localhost:' + port + '                    ║'));
  }
  
  if (CONFIG.ENABLE_MCP) {
    console.log(chalk.cyan('║  MCP Server:     stdio communication                      ║'));
  }
  
  if (CONFIG.ENABLE_ADMIN) {
    console.log(chalk.cyan('║  Admin Dashboard: http://localhost:' + CONFIG.ADMIN_PORT + '                   ║'));
  }
  
  console.log(chalk.cyan('╚═══════════════════════════════════════════════════════════╝'));
  
  // Show help
  console.log(chalk.yellow('\nPress Ctrl+C to stop all services'));
  console.log(chalk.gray('\nQuick tips:'));
  console.log(chalk.gray('  • Use PRESET=full for all services including MCP'));
  console.log(chalk.gray('  • Use PRESET=minimal for just the engine leader'));
  console.log(chalk.gray('  • Use PRESET=dev for development (1 worker, admin, no MCP)'));
  console.log(chalk.gray('  • Or customize with ENGINE_WORKERS, ENABLE_MCP, etc.\n'));
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