#!/usr/bin/env node
/**
 * Detailed MCP Server Diagnostic
 */

const { spawn } = require('child_process');
const path = require('path');

async function detailedMCPTest() {
  console.log('🔍 Running detailed MCP server diagnostic...\n');
  
  // First, let's check what the compiled output looks like
  const fs = require('fs');
  const compiledPath = path.join(__dirname, 'packages', 'mcpserver', 'dist', 'index.js');
  
  if (fs.existsSync(compiledPath)) {
    console.log('✅ Compiled file exists');
    const fileSize = fs.statSync(compiledPath).size;
    console.log(`📏 File size: ${fileSize} bytes`);
    
    // Read first few lines to check compilation
    const content = fs.readFileSync(compiledPath, 'utf8');
    console.log('📄 First 10 lines of compiled file:');
    console.log(content.split('\n').slice(0, 10).join('\n'));
    console.log('...\n');
  } else {
    console.log('❌ Compiled file does not exist');
    return;
  }

  // Test with more verbose logging
  console.log('🧪 Starting MCP server with detailed logging...');
  
  const mcpProcess = spawn('node', ['--trace-warnings', '--inspect=0', 'dist/index.js'], {
    cwd: path.join(__dirname, 'packages', 'mcpserver'),
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      NODE_ENV: 'development',
      DEBUG: '*'
    }
  });

  let hasOutput = false;
  let outputBuffer = '';
  let errorBuffer = '';
  
  mcpProcess.stdout.on('data', (data) => {
    hasOutput = true;
    const text = data.toString();
    outputBuffer += text;
    console.log('📤 STDOUT:', text);
  });
  
  mcpProcess.stderr.on('data', (data) => {
    hasOutput = true;
    const text = data.toString();
    errorBuffer += text;
    console.log('📤 STDERR:', text);
  });

  mcpProcess.on('close', (code, signal) => {
    console.log(`\n🔚 MCP server exited with code: ${code}, signal: ${signal}`);
    if (!hasOutput) {
      console.log('⚠️  No output captured - process exited immediately');
    }
  });

  mcpProcess.on('error', (error) => {
    console.log('💥 Process error:', error);
  });

  // Wait longer and check status
  for (let i = 0; i < 10; i++) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (mcpProcess.exitCode !== null) {
      console.log(`💀 Process exited after ${(i + 1) * 500}ms`);
      break;
    }
    
    if (i === 4) {
      console.log('⏱️  Process still running after 2.5 seconds...');
    }
  }
  
  if (mcpProcess.exitCode === null) {
    console.log('🎉 SUCCESS! Process is still running after 5 seconds!');
    mcpProcess.kill();
  }

  // Test just running node on the file directly
  console.log('\n🔬 Testing direct node execution...');
  
  const directProcess = spawn('node', ['-e', 'console.log("Node.js is working"); process.exit(0);'], {
    stdio: 'inherit'
  });
  
  await new Promise(resolve => {
    directProcess.on('close', (code) => {
      console.log(`Direct node test exit code: ${code}`);
      resolve();
    });
  });
}

detailedMCPTest().catch(console.error);
