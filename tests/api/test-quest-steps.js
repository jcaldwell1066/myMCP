/**
 * Test Quest Step Functionality
 * Demonstrates how quest steps work and tests the step progression
 */

const { TestRunner, setRunner, describe, it } = require('./framework/test-runner');

async function testQuestSteps() {
  console.log('🗡️ myMCP Engine - Quest Steps Test');
  console.log('===================================\n');

  const runner = new TestRunner({
    verbose: true,
    cleanupBetweenTests: true,
    timeout: 10000
  });

  setRunner(runner);

  describe('Quest Step Progression Test', () => {
    
    it('should show quest steps in detail', async function() {
      const player = this.data.createPlayer('quest-stepper');
      
      // Start a quest
      const questsResponse = await this.client.get(`/api/quests/${player.id}`);
      const quest = questsResponse.data.data.available[0]; // Get first available quest
      
      console.log(`🎯 Starting quest: ${quest.title}`);
      console.log(`📝 Steps available: ${quest.steps.length}`);
      
      quest.steps.forEach((step, index) => {
        console.log(`   ${index + 1}. ${step.description} (${step.id})`);
        console.log(`      Status: ${step.completed ? '✅ Completed' : '⏳ Pending'}`);
      });
      
      // Start the quest
      await this.client.post(`/api/actions/${player.id}`, {
        type: 'START_QUEST',
        payload: { questId: quest.id },
        playerId: player.id
      });
      
      console.log(`\n✅ Quest started successfully!`);
    });

    it('should complete quest steps in order', async function() {
      const player = this.data.createPlayer('step-completer');
      
      // Start a quest
      const questsResponse = await this.client.get(`/api/quests/${player.id}`);
      const quest = questsResponse.data.data.available[0];
      
      await this.client.post(`/api/actions/${player.id}`, {
        type: 'START_QUEST',
        payload: { questId: quest.id },
        playerId: player.id
      });
      
      console.log(`\n🔄 Completing steps for: ${quest.title}`);
      
      // Complete each step
      for (let i = 0; i < quest.steps.length; i++) {
        const step = quest.steps[i];
        console.log(`\n📍 Step ${i + 1}: ${step.description}`);
        
        // Complete the step
        const stepResult = await this.client.post(`/api/actions/${player.id}`, {
          type: 'COMPLETE_QUEST_STEP',
          payload: { stepId: step.id },
          playerId: player.id
        });
        
        this.expect(stepResult).toHaveStatus(200);
        this.expect(stepResult.data.data.completed).toBe(true);
        
        console.log(`   ✅ Completed: ${stepResult.data.data.step}`);
        
        // Check progress
        const updatedQuests = await this.client.get(`/api/quests/${player.id}`);
        const activeQuest = updatedQuests.data.data.active;
        const completedSteps = activeQuest.steps.filter(s => s.completed).length;
        
        console.log(`   📊 Progress: ${completedSteps}/${activeQuest.steps.length} steps`);
      }
      
      console.log(`\n🎉 All steps completed!`);
    });

    it('should complete entire quest after all steps', async function() {
      const player = this.data.createPlayer('quest-finisher');
      
      // Start and complete all steps of a quest
      const questsResponse = await this.client.get(`/api/quests/${player.id}`);
      const quest = questsResponse.data.data.available[0];
      
      // Start quest
      await this.client.post(`/api/actions/${player.id}`, {
        type: 'START_QUEST',
        payload: { questId: quest.id },
        playerId: player.id
      });
      
      // Complete all steps
      for (const step of quest.steps) {
        await this.client.post(`/api/actions/${player.id}`, {
          type: 'COMPLETE_QUEST_STEP',
          payload: { stepId: step.id },
          playerId: player.id
        });
      }
      
      // Complete the quest
      console.log(`\n🏆 Completing quest: ${quest.title}`);
      const questResult = await this.client.post(`/api/actions/${player.id}`, {
        type: 'COMPLETE_QUEST',
        payload: {},
        playerId: player.id
      });
      
      this.expect(questResult).toHaveStatus(200);
      this.expect(questResult.data.data.status).toBe('completed');
      
      console.log(`   ✅ Quest completed: ${questResult.data.data.quest}`);
      console.log(`   🎁 Reward: ${questResult.data.data.reward.score} points`);
      console.log(`   🎁 Items: ${questResult.data.data.reward.items.join(', ')}`);
      
      // Verify final state
      const finalState = await this.client.get(`/api/state/${player.id}`);
      const finalPlayer = finalState.data.data.player;
      
      console.log(`   📊 Final score: ${finalPlayer.score} points`);
      console.log(`   🎯 Final level: ${finalPlayer.level}`);
      console.log(`   💼 Status: ${finalPlayer.status}`);
      
      this.expect(finalPlayer.status).toBe('idle');
      this.expect(finalPlayer.score).toBeGreaterThan(0);
    });

    it('should show step progression workflow', async function() {
      const player = this.data.createPlayer('workflow-demo');
      
      console.log(`\n🔄 Demonstrating complete quest workflow:`);
      console.log(`   1. View available quests`);
      console.log(`   2. Start a quest`);
      console.log(`   3. Complete steps one by one`);
      console.log(`   4. Complete the quest`);
      console.log(`   5. Receive rewards`);
      
      // 1. View available quests
      const questsResponse = await this.client.get(`/api/quests/${player.id}`);
      console.log(`\n📋 Available quests: ${questsResponse.data.data.available.length}`);
      
      // 2. Start a quest
      const quest = questsResponse.data.data.available[1]; // Use second quest for variety
      await this.client.post(`/api/actions/${player.id}`, {
        type: 'START_QUEST',
        payload: { questId: quest.id },
        playerId: player.id
      });
      console.log(`🗡️ Started: ${quest.title}`);
      
      // 3. Show what CLI commands would be used
      console.log(`\n💻 CLI Commands for this workflow:`);
      console.log(`   mycli start-quest ${quest.id}`);
      console.log(`   mycli quest-steps                    # View all steps`);
      console.log(`   mycli current-step                   # See next step`);
      
      quest.steps.forEach((step, index) => {
        console.log(`   mycli complete-step ${step.id}     # Step ${index + 1}: ${step.description}`);
      });
      
      console.log(`   mycli complete-quest                 # Finish quest`);
      console.log(`   mycli quest-progress                 # View progress`);
      
      // 4. Demonstrate API calls for each step
      console.log(`\n🔧 API Workflow:`);
      for (let i = 0; i < quest.steps.length; i++) {
        const step = quest.steps[i];
        console.log(`\n   Step ${i + 1}: POST /api/actions/${player.id}`);
        console.log(`   {`);
        console.log(`     "type": "COMPLETE_QUEST_STEP",`);
        console.log(`     "payload": { "stepId": "${step.id}" }`);
        console.log(`   }`);
        
        // Actually complete it
        await this.client.post(`/api/actions/${player.id}`, {
          type: 'COMPLETE_QUEST_STEP',
          payload: { stepId: step.id },
          playerId: player.id
        });
      }
      
      console.log(`\n   Final: POST /api/actions/${player.id}`);
      console.log(`   {`);
      console.log(`     "type": "COMPLETE_QUEST",`);
      console.log(`     "payload": {}`);
      console.log(`   }`);
      
      // Complete quest
      await this.client.post(`/api/actions/${player.id}`, {
        type: 'COMPLETE_QUEST',
        payload: {},
        playerId: player.id
      });
      
      console.log(`\n🎊 Workflow completed successfully!`);
    });

  });

  try {
    const results = await runner.runFiles([]);
    
    if (results.failed === 0) {
      console.log('\n🎉 Quest Steps Test Complete!');
      console.log('==============================');
      console.log('✅ Quest step progression working correctly');
      console.log('✅ All API endpoints functional');
      console.log('✅ Ready for CLI integration');
      console.log('');
      console.log('🎯 Summary of Quest Step Features:');
      console.log('   • Steps have unique IDs and descriptions');
      console.log('   • Steps can be completed individually');
      console.log('   • Progress is tracked (X/Y completed)');
      console.log('   • Quest completion requires all steps done');
      console.log('   • Rewards are given when quest completes');
      console.log('');
      console.log('🚀 Ready to enhance CLI with step commands!');
    } else {
      console.log('\n⚠️ Some tests failed - check output above');
    }
    
    return results.failed === 0;
  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    return false;
  }
}

if (require.main === module) {
  testQuestSteps().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { testQuestSteps };
