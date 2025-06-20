#!/usr/bin/env node
/**
 * Test the fixed main module detection
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
        console.log(`✅ ${description} completed`);
        resolve();
      } else {
        console.error(`❌ ${description} failed with code ${code}`);
        reject(new Error(`${description} failed`));
      }
    });
  });
}

async function testFinalFix() {
  console.log('🔧 Testing final MCP server fix...\n');
  
  try {
    // Rebuild with the fix
    await runCommand('npm', ['run', 'build'], 
      path.join(__dirname, 'packages', 'mcpserver'), 
      'Rebuilding with main module detection fix');

    console.log('\n🧪 Testing final MCP server...');
    
    const mcpProcess = spawn('node', ['dist/index.js'], {
      cwd: path.join(__dirname, 'packages', 'mcpserver'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let mcpErrors = '';
    
    mcpProcess.stderr.on('data', (data) => {
      const text = data.toString();
      mcpErrors += text;
      console.log('📤 MCP Server:', text.trim());
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    if (mcpProcess.exitCode === null) {
      console.log('\n🎉 SUCCESS! MCP server is running and staying alive!');
      console.log('✅ The server should now work with Claude MCP configuration');
      mcpProcess.kill();
    } else {
      console.log(`\n❌ Server still exiting with code: ${mcpProcess.exitCode}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFinalFix();
