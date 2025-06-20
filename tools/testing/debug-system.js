#!/usr/bin/env node
/**
 * Debug myMCP System - Complete Diagnostic Tool
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios').default;

const ENGINE_BASE_URL = 'http://localhost:3000';

// Helper to run commands
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

// Test engine connection
async function testEngineConnection() {
  try {
    console.log('🔍 Testing engine connection...');
    const response = await axios.get(`${ENGINE_BASE_URL}/health`, {
      timeout: 5000
    });
    console.log('✅ Engine health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Engine connection failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 The engine is not running. Start it with: node start-engine.js');
    }
    return false;
  }
}

async function main() {
  console.log('🕵️  Starting comprehensive myMCP system diagnosis...\\n');

  // 1. Check if required files exist
  console.log('📂 Checking file structure...');
  const requiredFiles = [
    'packages/engine/dist/app.js',
    'packages/mcpserver/dist/index.js',
    'shared/types/dist/index.js'
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.log(`❌ ${file} missing`);
    }
  }

  console.log('\\n2. 🏗️  Building all components...');
  try {
    // Build shared types
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

  } catch (error) {
    console.error('\\n❌ Build process failed:', error.message);
    return;
  }

  console.log('\\n3. 🌐 Testing engine connectivity...');
  const isEngineRunning = await testEngineConnection();

  if (!isEngineRunning) {
    console.log('\\n🚀 Starting engine...');
    const engineProcess = spawn('node', ['dist/app.js'], {
      cwd: path.join(__dirname, 'packages', 'engine'),
      stdio: 'inherit',
      detached: true
    });

    console.log('⏳ Waiting for engine to start...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const engineNowRunning = await testEngineConnection();
    if (!engineNowRunning) {
      console.error('❌ Failed to start engine');
      return;
    }
  }

  console.log('\\n4. 🧪 Testing MCP server startup...');
  console.log('Starting MCP server in test mode...');
  
  const mcpProcess = spawn('node', ['dist/index.js'], {
    cwd: path.join(__dirname, 'packages', 'mcpserver'),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let mcpOutput = '';
  let mcpErrors = '';
  
  mcpProcess.stdout.on('data', (data) => {
    mcpOutput += data.toString();
  });
  
  mcpProcess.stderr.on('data', (data) => {
    mcpErrors += data.toString();
  });

  // Give MCP server time to start
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (mcpProcess.exitCode === null) {
    console.log('✅ MCP server is running');
    console.log('📝 MCP server stderr output:');
    console.log(mcpErrors);
    mcpProcess.kill();
  } else {
    console.log('❌ MCP server exited immediately');
    console.log('📝 MCP server output:', mcpOutput);
    console.log('📝 MCP server errors:', mcpErrors);
  }

  console.log('\\n🎯 Diagnosis complete!');
  console.log('\\nNext steps:');
  console.log('1. If engine is not running: node start-engine.js');
  console.log('2. If MCP server crashes: check the error logs above');
  console.log('3. Test with Claude: Add MCP server to your config');
}

main().catch(console.error);
