#!/usr/bin/env node

const axios = require('axios');

// Configuration
const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3456';
const PLAYER_ID = process.env.PLAYER_ID || 'jcadwell-mcp';

async function resetPlayerQuests() {
  try {
    console.log(`🔄 Resetting quests for player: ${PLAYER_ID}\n`);
    
    // Get the default quest catalog
    console.log('📚 Fetching quest catalog...');
    const catalogResponse = await axios.get(`${ENGINE_URL}/api/quest-catalog`);
    const allQuests = catalogResponse.data.data.quests;
    console.log(`✅ Found ${allQuests.length} quests in catalog`);
    
    // Get current player state
    console.log(`\n📊 Fetching current player state...`);
    const stateResponse = await axios.get(`${ENGINE_URL}/api/state/${PLAYER_ID}`);
    const currentState = stateResponse.data.data;
    console.log(`✅ Current available quests: ${currentState.quests.available.length}`);
    console.log(`   Active quest: ${currentState.quests.active ? currentState.quests.active.title : 'None'}`);
    console.log(`   Completed quests: ${currentState.quests.completed.length}`);
    
    // For now, we'll start the new quest directly since there's no API to update available quests
    const releaseQuest = allQuests.find(q => q.id === 'release-milestone-v2');
    
    if (releaseQuest) {
      console.log(`\n🎯 Found Release Milestone Quest!`);
      console.log(`   Title: ${releaseQuest.title}`);
      console.log(`   Description: ${releaseQuest.description}`);
      console.log(`   Reward: ${releaseQuest.reward.score} points`);
      
      // Try to start the quest
      console.log('\n🚀 Starting the quest...');
      try {
        const startResponse = await axios.post(`${ENGINE_URL}/api/actions/${PLAYER_ID}`, {
          type: 'START_QUEST',
          payload: {
            questId: releaseQuest.id
          },
          playerId: PLAYER_ID
        });
        
        if (startResponse.data.success) {
          console.log('✅ Quest started successfully!');
          console.log(`   ${startResponse.data.data.quest} is now active`);
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log('❌ Quest not found in player\'s available quests');
          console.log('   The player state needs to be recreated to get the new quest');
          console.log('\n💡 To fix this, you can:');
          console.log('   1. Delete the player state and let it recreate');
          console.log('   2. Manually edit the game-states.json file');
          console.log('   3. Create an API endpoint for updating available quests');
        } else {
          throw error;
        }
      }
    } else {
      console.log('❌ Release Milestone Quest not found in catalog');
      console.log('   Make sure the engine has been rebuilt and restarted');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.data);
    }
  }
}

// Run the script
resetPlayerQuests(); 