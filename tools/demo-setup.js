#!/usr/bin/env node

/**
 * Demo Setup Script - One-command setup for team participants
 * Usage: node tools/demo-setup.js [level] [name]
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SHARED_REDIS_URL = "redis://default:K2fw74hvSoiwLtyP5xeAzevBFXpXHvhU@redis-12991.c281.us-east-1-2.ec2.redns.redis-cloud.com:12991";

function showHelp() {
  console.log('🏰 myMCP Demo Setup Helper\n');
  console.log('Usage: node tools/demo-setup.js [level] [your-name]');
  console.log('\nLevels:');
  console.log('  2 - Engine Operator (run your own engine)');
  console.log('  3 - AI-Powered Player (requires API key)');
  console.log('\nExamples:');
  console.log('  node tools/demo-setup.js 2 alice          # Set up Alice as engine operator');
  console.log('  node tools/demo-setup.js 3 bob            # Set up Bob with AI capabilities');
  console.log('\nNote: Level 1 (Slack only) requires no setup!');
}

function setupEnvironment(level, playerName) {
  console.log(`🎯 Setting up Level ${level} demo participation for ${playerName}...`);
  
  // Create .env file
  const envContent = [
    `# Demo participant configuration for ${playerName}`,
    `REDIS_URL=${SHARED_REDIS_URL}`,
    `PLAYER_NAME=${playerName}`,
    `ENGINE_ID=${playerName}-engine`,
    `NODE_ENV=development`,
    ''
  ];

  if (level === '3') {
    envContent.push('# Add your API key:');
    envContent.push('# ANTHROPIC_API_KEY=your-key-here');
    envContent.push('# OR');
    envContent.push('# OPENAI_API_KEY=your-key-here');
    envContent.push('');
  }

  fs.writeFileSync('.env', envContent.join('\n'));
  console.log('✅ Created .env configuration');
}

function installAndBuild() {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  console.log('🔨 Building packages...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Build complete');
}

function testConnection() {
  console.log('🔍 Testing Redis connection...');
  
  try {
    // Start engine briefly to test connection
    const child = execSync('timeout 10s npm run start:engine || true', { 
      stdio: 'pipe',
      encoding: 'utf8'
    });
    
    if (child.includes('Ready for multiplayer action')) {
      console.log('✅ Redis connection successful');
      return true;
    } else {
      console.log('⚠️  Redis connection test inconclusive');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Could not test Redis connection automatically');
    return false;
  }
}

function showNextSteps(level, playerName) {
  console.log('\n🎉 Setup complete! Next steps:\n');
  
  if (level === '3') {
    console.log('🔑 Add your API key to .env:');
    console.log('   echo "ANTHROPIC_API_KEY=your-key" >> .env');
    console.log('   # OR');
    console.log('   echo "OPENAI_API_KEY=your-key" >> .env\n');
  }
  
  console.log('🚀 Start your engine:');
  console.log('   npm run start:engine\n');
  
  console.log('✅ Verify it\'s working:');
  console.log('   curl http://localhost:3000/health\n');
  
  console.log('💬 Join the Slack channel:');
  console.log('   #mymcp-demo\n');
  
  console.log('📋 Demo day checklist:');
  console.log('   1. Start engine 30 minutes before demo');
  console.log('   2. Join #mymcp-demo Slack channel');
  console.log('   3. Follow along with the quest!');
  
  console.log(`\n🏰 You're ready to represent the ${playerName} realm in the Council of Three Realms!`);
}

function main() {
  const level = process.argv[2];
  const playerName = process.argv[3];
  
  if (!level || !playerName || !['2', '3'].includes(level)) {
    showHelp();
    process.exit(1);
  }
  
  console.log('🏰 Welcome to myMCP Demo Setup!\n');
  
  try {
    setupEnvironment(level, playerName);
    installAndBuild();
    testConnection();
    showNextSteps(level, playerName);
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n🆘 Need help? Ask in #mymcp-demo Slack channel!');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { setupEnvironment, installAndBuild, testConnection }; 