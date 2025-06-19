#!/usr/bin/env node

/**
 * Build script for Phase 1 MCP integration
 */

const { spawn } = require('child_process');
const path = require('path');

function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Running: ${command} ${args.join(' ')} in ${cwd}`);
    
    const process = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

async function buildAll() {
  try {
    // Build engine
    console.log('📦 Building myMCP Engine...');
    await runCommand('npm', ['run', 'build'], 'C:\\Users\\JefferyCaldwell\\myMCP\\packages\\engine');
    console.log('✅ Engine built successfully!');
    
    // Build MCP server
    console.log('📦 Building MCP Server...');
    await runCommand('npm', ['run', 'build'], 'C:\\Users\\JefferyCaldwell\\myMCP\\packages\\mcpserver');
    console.log('✅ MCP Server built successfully!');
    
    console.log('\n🎉 Phase 1 MCP Integration Build Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start the engine: cd packages/engine && npm start');
    console.log('2. Test MCP server: cd packages/mcpserver && npm start');
    console.log('3. Add MCP server to Claude Desktop configuration');
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildAll();
