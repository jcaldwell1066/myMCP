#!/usr/bin/env node
/**
 * Test minimal MCP server
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

async function testMinimal() {
  console.log('🧪 Testing minimal MCP server...\n');
  
  try {
    // Compile minimal test
    await runCommand('npx', ['tsc', 'src/minimal-test.ts', '--outDir', 'dist', '--module', 'ES2022', '--target', 'ES2022', '--moduleResolution', 'Node'], 
      path.join(__dirname, 'packages', 'mcpserver'), 
      'Compiling minimal test');

    console.log('\n🚀 Running minimal test...');
    
    // Run the minimal test
    const testProcess = spawn('node', ['dist/minimal-test.js'], {
      cwd: path.join(__dirname, 'packages', 'mcpserver'),
      stdio: 'inherit'
    });

    await new Promise((resolve) => {
      testProcess.on('close', (code) => {
        console.log(`\nMinimal test exited with code: ${code}`);
        resolve();
      });
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMinimal();
