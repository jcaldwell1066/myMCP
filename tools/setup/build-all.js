#!/usr/bin/env node
/**
 * Build all myMCP components
 */

const { spawn } = require('child_process');
const path = require('path');

async function runCommand(command, args, cwd, description) {
  return new Promise((resolve, reject) => {
    console.log(`🔨 ${description}...`);
    
    const process = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} completed successfully`);
        resolve();
      } else {
        console.error(`❌ ${description} failed with code ${code}`);
        reject(new Error(`${description} failed`));
      }
    });

    process.on('error', (error) => {
      console.error(`❌ ${description} error:`, error);
      reject(error);
    });
  });
}

async function main() {
  try {
    console.log('🚀 Building myMCP system...\n');

    // Build shared types first
    await runCommand('npm', ['run', 'build'], 
      path.join(__dirname, 'shared', 'types'), 
      'Building shared types');

    // Build engine
    await runCommand('npm', ['run', 'build'], 
      path.join(__dirname, 'packages', 'engine'), 
      'Building engine');

    // Build MCP server
    await runCommand('npm', ['run', 'build'], 
      path.join(__dirname, 'packages', 'mcpserver'), 
      'Building MCP server');

    console.log('\n🎉 All components built successfully!');
    console.log('\nNext steps:');
    console.log('1. Start the engine: node start-engine.js');
    console.log('2. In another terminal, test MCP server manually');
    console.log('3. Or run: node start-complete-system.js (if you want both together)');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

main();
