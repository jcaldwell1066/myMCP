/**
 * Custom Test Example - Quest Completion Flow
 * Test your specific business logic scenarios
 */

const { describe, it, beforeEach, expect } = require('../../framework/test-runner');

module.exports = function(runner) {

  describe('Custom Quest Completion Scenarios', () => {
    let player;

    beforeEach(async function() {
      player = this.data.createPlayer('quest-master');
    });

    it('should handle rapid quest progression', async function() {
      // Set high score
      await this.client.post(`/api/actions/${player.id}`, {
        type: 'SET_SCORE',
        payload: { score: 1000 },
        playerId: player.id
      });

      // Verify master level
      const state = await this.client.get(`/api/state/${player.id}`);
      expect(state.data.data.player.level).toBe('master');

      // Start multiple quests in sequence
      const questsResponse = await this.client.get(`/api/quests/${player.id}`);
      for (const quest of questsResponse.data.data.available) {
        const startResponse = await this.client.post(`/api/actions/${player.id}`, {
          type: 'START_QUEST',
          payload: { questId: quest.id },
          playerId: player.id
        });
        
        if (startResponse.statusCode === 200) {
          console.log(`   🎯 Started quest: ${quest.title}`);
          break; // Can only have one active quest
        }
      }
    });

    it('should validate chat context awareness', async function() {
      // Test context-aware chat responses
      const chatScenarios = [
        { input: 'What quests do I have?', expectKeyword: 'quest' },
        { input: 'How do I level up?', expectKeyword: 'score' },
        { input: 'Tell me about my character', expectKeyword: 'hero' }
      ];

      for (const scenario of chatScenarios) {
        const response = await this.client.post(`/api/actions/${player.id}`, {
          type: 'CHAT',
          payload: { message: scenario.input },
          playerId: player.id
        });

        expect(response).toHaveStatus(200);
        const botResponse = response.data.data.botResponse.message.toLowerCase();
        expect(botResponse).toContain(scenario.expectKeyword);
        console.log(`   💬 "${scenario.input}" → "${response.data.data.botResponse.message}"`);
      }
    });

    it('should test tab completion intelligence', async function() {
      // Test completion suggestions get smarter based on context
      const completionTests = [
        { prefix: 'qu', expectCount: '>0', description: 'Quest suggestions' },
        { prefix: 'help', expectCount: '>0', description: 'Help suggestions' },
        { prefix: 'cast', expectCount: '>0', description: 'Spell suggestions' },
        { prefix: 'xyz', expectCount: '>=0', description: 'No matches gracefully handled' }
      ];

      for (const test of completionTests) {
        const response = await this.client.get(
          `/api/context/completions/${player.id}?prefix=${test.prefix}`
        );
        
        expect(response).toHaveStatus(200);
        const count = response.data.data.length;
        
        if (test.expectCount === '>0') {
          expect(count).toBeGreaterThan(0);
        }
        
        console.log(`   🎯 "${test.prefix}" → ${count} suggestions (${test.description})`);
      }
    });

  });
};
