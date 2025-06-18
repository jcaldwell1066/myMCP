#!/usr/bin/env node
/**
 * Manual test for myMCP server
 */

const { spawn } = require('child_process');
const path = require('path');

async function testMCPServer() {
  console.log('🧪 Testing myMCP server manually...\n');
  
  // Build the fixed version first
  console.log('📦 Building fixed MCP server...');
  const buildProcess = spawn('npm', ['run', 'build'], {
    cwd: path.join(__dirname, 'packages', 'mcpserver'),
    stdio: 'inherit'
  });
  
  await new Promise((resolve, reject) => {
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Build completed');
        resolve();
      } else {
        console.error('❌ Build failed');
        reject(new Error('Build failed'));
      }
    });
  });
  
  // Copy the fixed file over the original
  const fs = require('fs');
  const fixedPath = path.join(__dirname, 'packages', 'mcpserver', 'src', 'index-fixed.ts');
  const originalPath = path.join(__dirname, 'packages', 'mcpserver', 'src', 'index.ts');
  
  console.log('🔄 Backing up original and using fixed version...');
  fs.copyFileSync(originalPath, originalPath + '.backup');
  fs.copyFileSync(fixedPath, originalPath);
  
  // Rebuild with the fixed version
  console.log('🔨 Rebuilding with fixed version...');
  const rebuildProcess = spawn('npm', ['run', 'build'], {
    cwd: path.join(__dirname, 'packages', 'mcpserver'),
    stdio: 'inherit'
  });
  
  await new Promise((resolve, reject) => {
    rebuildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Rebuild completed');
        resolve();
      } else {
        console.error('❌ Rebuild failed');
        reject(new Error('Rebuild failed'));
      }
    });
  });
  
  console.log('\\n🚀 Starting MCP server directly...');
  console.log('You should see startup messages and the server should stay running.');
  console.log('Press Ctrl+C to stop the test.\\n');
  
  // Start the MCP server directly
  const mcpProcess = spawn('node', ['dist/index.js'], {
    cwd: path.join(__dirname, 'packages', 'mcpserver'),
    stdio: 'inherit'
  });
  
  mcpProcess.on('close', (code) => {
    console.log(`\\nMCP server exited with code: ${code}`);
  });
  
  mcpProcess.on('error', (error) => {
    console.error('MCP server error:', error);
  });
}

testMCPServer().catch(console.error);
