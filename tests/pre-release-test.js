#!/usr/bin/env node

/**
 * Comprehensive myMCP Pre-Release Test Suite
 * Tests all functionality before packaging
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🧪 myMCP Pre-Release Automated Test Suite');
console.log('==========================================');
console.log('Testing all components before packaging...\n');

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}`);
  if (details) console.log(`    ${details}`);
  
  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

function logSection(title) {
  console.log(`\n📋 ${title}`);
  console.log('─'.repeat(50));
}

// Utility functions
function execCommand(command, cwd = process.cwd()) {
  try {
    const result = execSync(command, { cwd, encoding: 'utf8', timeout: 30000 });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || '' };
  }
}

function makeHttpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: jsonResponse, raw: body });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: null, raw: body });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function waitForService(url, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await makeHttpRequest({ hostname: 'localhost', port: 3000, path: '/health' });
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

// Test Suite Functions
async function testBuildSystem() {
  logSection('Build System Testing');
  
  // Test TypeScript compilation
  const buildResult = execCommand('npm run build');
  logTest('TypeScript Build', buildResult.success, 
    buildResult.success ? 'All packages compiled successfully' : buildResult.error);
  
  // Test workspace structure
  const workspaceTest = execCommand('npm ls --workspaces --depth=0');
  logTest('Workspace Structure', workspaceTest.success,
    workspaceTest.success ? 'All workspaces properly configured' : workspaceTest.error);
}

async function testEngineAPI() {
  logSection('Engine API Testing');
  
  // Check if engine is running
  try {
    const healthResponse = await makeHttpRequest({
      hostname: 'localhost', port: 3000, path: '/health'
    });
    
    logTest('Engine Health Check', healthResponse.statusCode === 200,
      healthResponse.statusCode === 200 ? healthResponse.data.message : 'Engine not responding');
    
    if (healthResponse.statusCode !== 200) {
      logTest('API Tests', false, 'Engine not running - skipping API tests');
      return;
    }
    
    // Test player state endpoint
    const stateResponse = await makeHttpRequest({
      hostname: 'localhost', port: 3000, path: '/api/state/test-player'
    });
    logTest('Player State API', stateResponse.statusCode === 200,
      stateResponse.statusCode === 200 ? 'Player state retrieved successfully' : 'Failed to get player state');
    
    // Test quest endpoint
    const questResponse = await makeHttpRequest({
      hostname: 'localhost', port: 3000, path: '/api/quests/test-player'
    });
    logTest('Quest API', questResponse.statusCode === 200,
      questResponse.statusCode === 200 ? 'Quest data retrieved successfully' : 'Failed to get quest data');
    
    // Test game action
    const actionResponse = await makeHttpRequest({
      hostname: 'localhost', port: 3000, path: '/api/actions/test-player', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      type: 'SET_SCORE',
      payload: { score: 100 },
      playerId: 'test-player'
    });
    logTest('Game Actions API', actionResponse.statusCode === 200,
      actionResponse.statusCode === 200 ? 'SET_SCORE action executed successfully' : 'Failed to execute game action');
    
    // Test chat functionality
    const chatResponse = await makeHttpRequest({
      hostname: 'localhost', port: 3000, path: '/api/actions/test-player', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      type: 'CHAT',
      payload: { message: 'Test message' },
      playerId: 'test-player'
    });
    logTest('Chat Functionality', chatResponse.statusCode === 200,
      chatResponse.statusCode === 200 ? 'Chat response generated successfully' : 'Failed to generate chat response');
    
  } catch (error) {
    logTest('Engine Connection', false, `Cannot connect to engine: ${error.message}`);
  }
}

async function testCLICommands() {
  logSection('CLI Command Testing');
  
  const projectRoot = process.cwd();
  
  // Test CLI help
  const helpResult = execCommand('node packages/cli/dist/index.js --help', projectRoot);
  logTest('CLI Help Command', helpResult.success,
    helpResult.success ? 'Help displayed successfully' : helpResult.error);
  
  // Test CLI config
  const configResult = execCommand('node packages/cli/dist/index.js config show', projectRoot);
  logTest('CLI Configuration', configResult.success,
    configResult.success ? 'Configuration displayed successfully' : 'Config command failed');
}

async function testIntegration() {
  logSection('Integration Testing');
  
  // Test CLI-Engine integration
  try {
    const engineRunning = await waitForService('http://localhost:3000/health', 3);
    if (engineRunning) {
      const cliStatusResult = execCommand('node packages/cli/dist/index.js status', process.cwd());
      logTest('CLI-Engine Integration', cliStatusResult.success && !cliStatusResult.output.includes('Cannot connect'),
        cliStatusResult.success ? 'CLI successfully connected to engine' : 'CLI failed to connect to engine');
    } else {
      logTest('CLI-Engine Integration', false, 'Engine not running for integration test');
    }
  } catch (error) {
    logTest('CLI-Engine Integration', false, `Integration test failed: ${error.message}`);
  }
}

async function testFileStructure() {
  logSection('Project Structure Testing');
  
  // Test essential files exist
  const essentialFiles = [
    'package.json',
    'README.md',
    'docs/README.md',
    'docs/GETTING_STARTED.md',
    'packages/cli/package.json',
    'packages/engine/package.json',
    'shared/types/package.json'
  ];
  
  let structureValid = true;
  const missingFiles = [];
  
  for (const file of essentialFiles) {
    if (!fs.existsSync(path.join(process.cwd(), file))) {
      structureValid = false;
      missingFiles.push(file);
    }
  }
  
  logTest('Essential Files', structureValid,
    structureValid ? 'All essential files present' : `Missing files: ${missingFiles.join(', ')}`);
  
  // Test documentation structure
  const docsExist = fs.existsSync(path.join(process.cwd(), 'docs')) &&
                   fs.existsSync(path.join(process.cwd(), 'docs/README.md'));
  logTest('Documentation Structure', docsExist,
    docsExist ? 'Documentation properly organized' : 'Documentation structure incomplete');
}

async function testConfiguration() {
  logSection('Configuration Testing');
  
  // Test package.json workspace configuration
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasWorkspaces = packageJson.workspaces && packageJson.workspaces.length > 0;
  logTest('Workspace Configuration', hasWorkspaces,
    hasWorkspaces ? 'Workspaces properly configured' : 'Workspace configuration missing');
  
  // Test TypeScript configuration
  const tsconfigExists = fs.existsSync('tsconfig.json');
  logTest('TypeScript Configuration', tsconfigExists,
    tsconfigExists ? 'TypeScript config present' : 'TypeScript config missing');
}

// Main test runner
async function runAllTests() {
  const startTime = Date.now();
  
  try {
    await testBuildSystem();
    await testFileStructure();
    await testConfiguration();
    await testEngineAPI();
    await testCLICommands();
    await testIntegration();
    
  } catch (error) {
    console.error('❌ Test suite failed with error:', error.message);
    results.failed++;
  }
  
  // Summary
  const duration = Math.round((Date.now() - startTime) / 1000);
  const total = results.passed + results.failed;
  const passRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
  
  console.log('\n🎯 Test Summary');
  console.log('================');
  console.log(`📊 Tests Run: ${total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Pass Rate: ${passRate}%`);
  console.log(`⏱️  Duration: ${duration}s`);
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(t => !t.passed).forEach(test => {
      console.log(`  • ${test.name}: ${test.details}`);
    });
  }
  
  const readyForRelease = results.failed === 0 && passRate >= 90;
  
  if (readyForRelease) {
    console.log('\n🚀 PRE-RELEASE READY!');
    console.log('All tests passed - ready for packaging!');
  } else {
    console.log('\n⚠️  PRE-RELEASE NOT READY');
    console.log('Please fix failing tests before packaging.');
  }
  
  return readyForRelease;
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().then(ready => {
    process.exit(ready ? 0 : 1);
  }).catch(error => {
    console.error('Fatal test error:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };