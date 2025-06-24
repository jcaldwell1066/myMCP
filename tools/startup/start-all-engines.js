#!/usr/bin/env node

const { spawn } = require('child_process');
const chalk = require('chalk');
const path = require('path');

console.log(chalk.blue.bold('🚀 Starting All myMCP Engines...'));
console.log(chalk.gray('─'.repeat(60)));

// Engine configurations
const engines = [
  { port: 3000, name: 'Engine 0 (Claude Desktop)', color: chalk.cyan },
  { port: 3001, name: 'Engine 1 (Leader)', color: chalk.green },
  { port: 3002, name: 'Engine 2', color: chalk.yellow },
  { port: 3003, name: 'Engine 3', color: chalk.magenta }
];

// Function to kill existing processes on ports
async function killExistingProcesses() {
  console.log(chalk.gray('Checking for existing engine processes...'));
  
  for (const engine of engines) {
    try {
      const { execSync } = require('child_process');
      // Try to find process on port
      const pid = execSync(`lsof -ti :${engine.port} 2>/dev/null || true`, { encoding: 'utf8' }).trim();
      if (pid) {
        console.log(chalk.red(`  ✖ Killing existing process on port ${engine.port} (PID: ${pid})`));
        try {
          execSync(`kill -9 ${pid}`);
        } catch (e) {
          // Process might have already died
        }
      }
    } catch (e) {
      // No process found, which is fine
    }
  }
  
  // Wait a moment for ports to be released
  await new Promise(resolve => setTimeout(resolve, 1000));
}

// Function to start an engine
function startEngine(port, name, color) {
  const enginePath = path.join(__dirname, '..', '..', 'packages', 'engine');
  
  console.log(color(`Starting ${name} on port ${port}...`));
  
  const env = {
    ...process.env,
    PORT: port,
    ENGINE_ID: `engine-${port}`,
    IS_PRIMARY: port === 3001 ? 'true' : 'false',
    NODE_ENV: 'development'
  };
  
  const engine = spawn('npm', ['start'], {
    cwd: enginePath,
    env,
    shell: true
  });
  
  // Prefix output with engine identifier
  engine.stdout.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.log(color(`[${port}] `) + line);
    });
  });
  
  engine.stderr.on('data', (data) => {
    const lines = data.toString().split('\n').filter(line => line.trim());
    lines.forEach(line => {
      console.error(color(`[${port}] `) + chalk.red(line));
    });
  });
  
  engine.on('error', (error) => {
    console.error(color(`[${port}] `) + chalk.red(`Failed to start: ${error.message}`));
  });
  
  engine.on('exit', (code, signal) => {
    if (code !== null) {
      console.log(color(`[${port}] `) + chalk.red(`Exited with code ${code}`));
    } else if (signal !== null) {
      console.log(color(`[${port}] `) + chalk.red(`Killed with signal ${signal}`));
    }
  });
  
  return engine;
}

// Main function
async function main() {
  // Kill existing processes
  await killExistingProcesses();
  
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.blue.bold('Starting engines...'));
  console.log(chalk.gray('─'.repeat(60)));
  
  // Start all engines
  const processes = engines.map(({ port, name, color }) => 
    startEngine(port, name, color)
  );
  
  // Handle shutdown
  process.on('SIGINT', () => {
    console.log(chalk.red.bold('\n\n🛑 Shutting down all engines...'));
    processes.forEach(proc => proc.kill());
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    processes.forEach(proc => proc.kill());
    process.exit(0);
  });
  
  console.log(chalk.gray('─'.repeat(60)));
  console.log(chalk.green('✅ All engines starting...'));
  console.log(chalk.gray('Press Ctrl+C to stop all engines'));
  console.log(chalk.gray('─'.repeat(60)));
}

// Run the main function
main().catch(console.error); 