/**
 * Integration Tests for Complete Player Journey
 * Tests realistic player scenarios from start to quest completion
 */

module.exports = function(runner) {

  runner.describe('Complete Player Journey Integration', () => {

    runner.it('should complete a full new player onboarding flow', async function() {
      // Step 1: New player checks their status
      const player = this.data.createPlayer();
      const initialState = await this.client.get(`/api/state/${player.id}`);
      this.expect(initialState.data.data.player.score).toBe(0);
      this.expect(initialState.data.data.player.level).toBe('novice');
      
      // Step 2: Player sends their first chat message
      const firstChat = await this.client.post(`/api/actions/${player.id}`, {
        type: 'CHAT',
        payload: { message: 'Hello! I\'m new here, what should I do?' },
        playerId: player.id
      });
      
      this.expect(firstChat).toHaveStatus(200);
      this.expect(firstChat.data.data.botResponse.message).toContain('quest');
      
      // Step 3: Player checks available quests
      const questsResponse = await this.client.get(`/api/quests/${player.id}`);
      this.expect(questsResponse.data.data.available.length).toBeGreaterThan(0);
      
      // Step 4: Player starts their first quest
      const firstQuest = questsResponse.data.data.available[0];
      const startQuest = await this.client.post(`/api/actions/${player.id}`, {
        type: 'START_QUEST',
        payload: { questId: firstQuest.id },
        playerId: player.id
      });
      
      this.expect(startQuest).toHaveStatus(200);
      this.expect(startQuest.data.data.quest).toBe(firstQuest.title);
      this.expect(startQuest.data.data.status).toBe('started');
      
      // Step 5: Verify player state has been updated
      const afterQuestState = await this.client.get(`/api/state/${player.id}`);
      const updatedPlayer = afterQuestState.data.data.player;
      
      this.expect(updatedPlayer.status).toBe('in-quest');
      this.expect(updatedPlayer.currentQuest).toBe(firstQuest.id);
      this.expect(afterQuestState.data.data.quests.active).toBeValidQuest();
      this.expect(afterQuestState.data.data.quests.available.length).toBe(questsResponse.data.data.available.length - 1);
    });

    runner.it('should handle score progression and leveling', async function() {
      const player = this.data.createPlayer();
      const scenarios = [
        { score: 50, expectedLevel: 'novice' },
        { score: 150, expectedLevel: 'apprentice' },
        { score: 600, expectedLevel: 'expert' },
        { score: 1200, expectedLevel: 'master' }
      ];

      for (const scenario of scenarios) {
        // Set the score
        const scoreResponse = await this.client.post(`/api/actions/${player.id}`, {
          type: 'SET_SCORE',
          payload: { score: scenario.score },
          playerId: player.id
        });
        
        this.expect(scoreResponse).toHaveStatus(200);
        this.expect(scoreResponse.data.data.score).toBe(scenario.score);
        
        // Verify level was updated correctly
        const stateResponse = await this.client.get(`/api/state/${player.id}`);
        this.expect(stateResponse.data.data.player.level).toBe(scenario.expectedLevel);
        this.expect(stateResponse.data.data.player.score).toBe(scenario.score);
      }
    });

    runner.it('should handle quest workflow from start to completion', async function() {
      const player = this.data.createPlayer();
      
      // Get available quests
      const questsResponse = await this.client.get(`/api/quests/${player.id}`);
      const questToStart = questsResponse.data.data.available[0];
      
      // Start the quest
      const startResponse = await this.client.post(`/api/actions/${player.id}`, {
        type: 'START_QUEST',
        payload: { questId: questToStart.id },
        playerId: player.id
      });
      
      this.expect(startResponse).toHaveStatus(200);
      
      // Complete each step of the quest
      for (const step of questToStart.steps) {
        const stepResponse = await this.client.post(`/api/actions/${player.id}`, {
          type: 'COMPLETE_QUEST_STEP',
          payload: { stepId: step.id },
          playerId: player.id
        });
        
        this.expect(stepResponse).toHaveStatus(200);
        this.expect(stepResponse.data.data.step).toBe(step.description);
        this.expect(stepResponse.data.data.completed).toBe(true);
      }
      
      // Complete the entire quest
      const completeResponse = await this.client.post(`/api/actions/${player.id}`, {
        type: 'COMPLETE_QUEST',
        payload: {},
        playerId: player.id
      });
      
      this.expect(completeResponse).toHaveStatus(200);
      this.expect(completeResponse.data.data.quest).toBe(questToStart.title);
      this.expect(completeResponse.data.data.status).toBe('completed');
      
      // Verify final state
      const finalState = await this.client.get(`/api/state/${player.id}`);
      const finalPlayer = finalState.data.data.player;
      
      this.expect(finalPlayer.status).toBe('idle');
      this.expect(finalPlayer.currentQuest).toBeUndefined();
      this.expect(finalPlayer.score).toBeGreaterThan(0); // Should have received reward
      this.expect(finalState.data.data.quests.active).toBeNull();
      this.expect(finalState.data.data.quests.completed.length).toBe(1);
      this.expect(finalState.data.data.inventory.items.length).toBeGreaterThan(0); // Should have reward items
    });

    runner.it('should maintain conversation history throughout the journey', async function() {
      const player = this.data.createPlayer();
      const messages = [
        'Hello, I\'m starting my adventure!',
        'What quests are available?',
        'I\'d like to start a quest.',
        'How am I doing so far?'
      ];

      // Send multiple chat messages
      for (const message of messages) {
        const chatResponse = await this.client.post(`/api/actions/${player.id}`, {
          type: 'CHAT',
          payload: { message },
          playerId: player.id
        });
        
        this.expect(chatResponse).toHaveStatus(200);
        this.expect(chatResponse.data.data.playerMessage.message).toBe(message);
        this.expect(chatResponse.data.data.botResponse.message).toBeTruthy();
      }

      // Verify conversation history
      const finalState = await this.client.get(`/api/state/${player.id}`);
      const history = finalState.data.data.session.conversationHistory;
      
      this.expect(history.length).toBe(messages.length * 2); // Each message generates player + bot response
      
      // Check that all our messages are in the history
      const playerMessages = history.filter(msg => msg.sender === 'player');
      this.expect(playerMessages.length).toBe(messages.length);
      
      messages.forEach((message, index) => {
        this.expect(playerMessages[index].message).toBe(message);
      });
    });

    runner.it('should handle tab completion context correctly', async function() {
      const player = this.data.createPlayer();
      
      // Test completion suggestions for different contexts
      const completionTests = [
        { prefix: 'quest', expectedToContain: ['quest'] },
        { prefix: 'help', expectedToContain: ['help'] },
        { prefix: '', expectedToContain: ['status', 'chat', 'help'] }
      ];

      for (const test of completionTests) {
        const response = await this.client.get(
          `/api/context/completions/${player.id}?prefix=${test.prefix}`
        );
        
        this.expect(response).toHaveStatus(200);
        this.expect(Array.isArray(response.data.data)).toBe(true);
        
        test.expectedToContain.forEach(keyword => {
          const hasMatch = response.data.data.some(suggestion => 
            suggestion.toLowerCase().includes(keyword.toLowerCase())
          );
          this.expect(hasMatch).toBe(true);
        });
      }
    });

    runner.it('should handle error recovery gracefully', async function() {
      const player = this.data.createPlayer();
      
      // Try to start a non-existent quest
      const invalidQuestResponse = await this.client.post(`/api/actions/${player.id}`, {
        type: 'START_QUEST',
        payload: { questId: 'non-existent-quest' },
        playerId: player.id
      }, { expectStatus: [404] });
      
      this.expect(invalidQuestResponse).toHaveStatus(404);
      this.expect(invalidQuestResponse.data.error).toBe('Quest not found');
      
      // Verify player state wasn't corrupted
      const stateAfterError = await this.client.get(`/api/state/${player.id}`);
      this.expect(stateAfterError.data.data.player.status).toBe('idle');
      this.expect(stateAfterError.data.data.quests.active).toBeNull();
      
      // Player should still be able to start a valid quest
      const questsResponse = await this.client.get(`/api/quests/${player.id}`);
      const validQuest = questsResponse.data.data.available[0];
      const validQuestResponse = await this.client.post(`/api/actions/${player.id}`, {
        type: 'START_QUEST',
        payload: { questId: validQuest.id },
        playerId: player.id
      });
      
      this.expect(validQuestResponse).toHaveStatus(200);
    });

  });
};
