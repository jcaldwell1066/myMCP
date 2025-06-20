#!/usr/bin/env node
/**
 * Quick fix and test for MCP server ES module issue
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
  });
}

async function testMCPServer() {
  console.log('🔧 Fixing ES module issue and testing MCP server...\n');
  
  try {
    // Rebuild MCP server with ES module support
    await runCommand('npm', ['run', 'build'], 
      path.join(__dirname, 'packages', 'mcpserver'), 
      'Rebuilding MCP server with ES module support');

    console.log('\n🧪 Testing MCP server startup...');
    
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
      console.log('MCP Server Output:', data.toString());
    });

    // Give MCP server time to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (mcpProcess.exitCode === null) {
      console.log('🎉 SUCCESS! MCP server is running without crashes!');
      console.log('📝 Server output:');
      console.log(mcpErrors);
      mcpProcess.kill();
    } else {
      console.log('❌ MCP server still exiting immediately');
      console.log('📝 Output:', mcpOutput);
      console.log('📝 Errors:', mcpErrors);
    }

  } catch (error) {
    console.error('❌ Process failed:', error);
  }
}

testMCPServer();
