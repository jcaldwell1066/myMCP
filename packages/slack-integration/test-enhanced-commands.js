#!/usr/bin/env node

/**
 * Test script for enhanced Slack commands
 * This simulates the Slack command handling to verify the new commands work correctly
 */

const axios = require('axios');

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3000';
const TEST_USER_ID = 'U123456789'; // Simulated Slack user ID
const TEST_PLAYER_ID = `slack-${TEST_USER_ID}`;

// Mock respond function
const mockRespond = (response) => {
  console.log('\n📤 Slack Response:');
  if (typeof response === 'string') {
    console.log(response);
  } else if (response.blocks) {
    response.blocks.forEach(block => {
      if (block.type === 'header') {
        console.log(`\n=== ${block.text.text} ===`);
      } else if (block.type === 'section' && block.text) {
        console.log(block.text.text);
      } else if (block.type === 'context' && block.elements) {
        block.elements.forEach(el => console.log(`  ${el.text}`));
      }
    });
  }
};

// Test functions for each command type
async function testScoreCommands() {
  console.log('\n🧪 Testing Score Commands...');
  
  // Test set score
  try {
    const response = await axios.post(`${ENGINE_URL}/api/actions/${TEST_PLAYER_ID}`, {
      type: 'SET_SCORE',
      payload: { score: 100 },
      playerId: TEST_PLAYER_ID
    });
    console.log('✅ Score set command successful');
  } catch (error) {
    console.error('❌ Score set failed:', error.message);
  }
}

async function testLocationCommands() {
  console.log('\n🧪 Testing Location Commands...');
  
  // Test list locations
  try {
    const response = await axios.get(`${ENGINE_URL}/api/state/${TEST_PLAYER_ID}`);
    const locations = response.data.data?.world?.locations || [];
    console.log(`✅ Found ${locations.length} locations`);
  } catch (error) {
    console.error('❌ Location list failed:', error.message);
  }
}

async function testQuestCommands() {
  console.log('\n🧪 Testing Quest Commands...');
  
  // Test list quests
  try {
    const response = await axios.get(`${ENGINE_URL}/api/quests/${TEST_PLAYER_ID}`);
    const quests = response.data.data?.available || [];
    console.log(`✅ Found ${quests.length} available quests`);
    
    // Try to start a quest if any available
    if (quests.length > 0) {
      const questId = quests[0].id;
      const startResponse = await axios.post(`${ENGINE_URL}/api/actions/${TEST_PLAYER_ID}`, {
        type: 'START_QUEST',
        payload: { questId },
        playerId: TEST_PLAYER_ID
      });
      console.log(`✅ Started quest: ${questId}`);
    }
  } catch (error) {
    console.error('❌ Quest commands failed:', error.message);
  }
}

async function testPlayerCommands() {
  console.log('\n🧪 Testing Player Commands...');
  
  // Test update player
  try {
    const response = await axios.put(`${ENGINE_URL}/api/state/${TEST_PLAYER_ID}/player`, {
      name: 'Test Player'
    });
    console.log('✅ Player update successful');
  } catch (error) {
    console.error('❌ Player update failed:', error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Testing Enhanced Slack Commands');
  console.log(`Engine URL: ${ENGINE_URL}`);
  console.log(`Test Player ID: ${TEST_PLAYER_ID}`);
  
  // Check if engine is running
  try {
    await axios.get(`${ENGINE_URL}/health`);
    console.log('✅ Engine is running');
  } catch (error) {
    console.error('❌ Engine is not running. Please start the engine first.');
    process.exit(1);
  }
  
  // Run all tests
  await testScoreCommands();
  await testLocationCommands();
  await testQuestCommands();
  await testPlayerCommands();
  
  console.log('\n✅ All tests completed!');
}

// Run tests
runTests().catch(console.error); 