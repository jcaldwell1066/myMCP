#!/usr/bin/env node

const axios = require('axios');

// Configuration
const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3456';
const PLAYER_ID = 'jcadwell-mcp';

// Define the new release milestone quest
const releaseQuest = {
  id: 'release-milestone-v2',
  title: 'Path to Release: Version 2.0',
  description: 'Guide the project to its next major release milestone by completing critical development tasks.',
  realWorldSkill: 'Software release management and project coordination',
  fantasyTheme: 'Forging the legendary artifact of deployment',
  status: 'available',
  steps: [
    {
      id: 'complete-testing',
      description: 'Ensure all test suites pass and achieve 80% code coverage',
      completed: false,
    },
    {
      id: 'update-documentation',
      description: 'Update all documentation including API docs and user guides',
      completed: false,
    },
    {
      id: 'deploy-staging',
      description: 'Successfully deploy to staging environment and verify functionality',
      completed: false,
    },
  ],
  reward: {
    score: 200,
    items: ['Release Artifact', 'Deployment Scroll', 'Version Badge'],
  },
};

async function addReleaseQuest() {
  try {
    console.log('🚀 Adding Release Milestone Quest...\n');
    
    // First, get the current game state
    console.log(`📊 Fetching current game state for ${PLAYER_ID}...`);
    const stateResponse = await axios.get(`${ENGINE_URL}/api/state/${PLAYER_ID}`);
    const gameState = stateResponse.data.data;
    
    console.log(`✅ Current state retrieved`);
    console.log(`   Player: ${gameState.player.name} (${gameState.player.id})`);
    console.log(`   Score: ${gameState.player.score}`);
    console.log(`   Available quests: ${gameState.quests.available.length}`);
    
    // Add the new quest to available quests
    gameState.quests.available.push(releaseQuest);
    
    // Since there's no direct API to add quests, we'll need to work with what we have
    // The best approach is to start the quest immediately
    console.log('\n🎯 Starting the Release Milestone Quest...');
    
    const startQuestResponse = await axios.post(`${ENGINE_URL}/api/actions/${PLAYER_ID}`, {
      type: 'START_QUEST',
      payload: {
        questId: releaseQuest.id
      },
      playerId: PLAYER_ID
    });
    
    if (startQuestResponse.data.success) {
      console.log('✅ Quest started successfully!');
      console.log(`   Quest: ${releaseQuest.title}`);
      console.log(`   Status: Active`);
      console.log(`   Steps:`);
      releaseQuest.steps.forEach((step, index) => {
        console.log(`     ${index + 1}. ${step.description}`);
      });
      console.log(`   Reward: ${releaseQuest.reward.score} points`);
      console.log(`   Items: ${releaseQuest.reward.items.join(', ')}`);
    } else {
      console.error('❌ Failed to start quest:', startQuestResponse.data.error);
    }
    
  } catch (error) {
    console.error('❌ Error adding release quest:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
    
    // If the quest doesn't exist in available quests, we need a different approach
    console.log('\n💡 Alternative: The engine currently only supports hardcoded quests.');
    console.log('   To add custom quests, you would need to:');
    console.log('   1. Modify the createDefaultGameState function in packages/engine/src/index.ts');
    console.log('   2. Or create an API endpoint for dynamic quest creation');
    console.log('   3. Or use the MCP tools to simulate quest-like activities');
  }
}

// Run the script
addReleaseQuest(); 