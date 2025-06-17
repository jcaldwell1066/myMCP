/**
 * Unit Tests for Game Actions Endpoint
 * Tests POST /api/actions/:playerId for all action types
 */

module.exports = function(runner) {

  runner.describe('Game Actions Endpoint', () => {

    runner.describe('POST /api/actions/:playerId', () => {
      
      runner.it('should validate required action fields', async function() {
        const testPlayer = this.data.createPlayer();
        const invalidAction = { /* missing required fields */ };
        
        const response = await this.client.post(
          `/api/actions/${testPlayer.id}`, 
          invalidAction,
          { expectStatus: [400] }
        );
        
        this.expect(response).toHaveStatus(400);
        this.expect(response.data.error).toContain('required');
      });

      runner.it('should reject unknown action types', async function() {
        const testPlayer = this.data.createPlayer();
        const invalidAction = {
          type: 'UNKNOWN_ACTION',
          payload: {},
          playerId: testPlayer.id
        };
        
        const response = await this.client.post(
          `/api/actions/${testPlayer.id}`, 
          invalidAction,
          { expectStatus: [400] }
        );
        
        this.expect(response).toHaveStatus(400);
        this.expect(response.data.error).toContain('Unknown action type');
      });

      runner.describe('SET_SCORE action', () => {
        
        runner.it('should set player score correctly', async function() {
          const testPlayer = this.data.createPlayer();
          const action = {
            type: 'SET_SCORE',
            payload: { score: 250 },
            playerId: testPlayer.id
          };
          
          const response = await this.client.post(`/api/actions/${testPlayer.id}`, action);
          
          this.expect(response).toHaveStatus(200);
          this.expect(response.data.data.score).toBe(250);
        });

        runner.it('should update player level based on score', async function() {
          const testPlayer = this.data.createPlayer();
          const scenarios = [
            { score: 50, expectedLevel: 'novice' },
            { score: 150, expectedLevel: 'apprentice' },
            { score: 600, expectedLevel: 'expert' },
            { score: 1200, expectedLevel: 'master' }
          ];

          for (const scenario of scenarios) {
            const action = {
              type: 'SET_SCORE',
              payload: { score: scenario.score },
              playerId: testPlayer.id
            };
            
            await this.client.post(`/api/actions/${testPlayer.id}`, action);
            
            // Verify level was updated in game state
            const stateResponse = await this.client.get(`/api/state/${testPlayer.id}`);
            this.expect(stateResponse.data.data.player.level).toBe(scenario.expectedLevel);
          }
        });

      });

      runner.describe('CHAT action', () => {
        
        runner.it('should process chat message and generate response', async function() {
          const testPlayer = this.data.createPlayer();
          const action = {
            type: 'CHAT',
            payload: { message: 'Hello, how are you?' },
            playerId: testPlayer.id
          };
          
          const response = await this.client.post(`/api/actions/${testPlayer.id}`, action);
          
          this.expect(response).toHaveStatus(200);
          this.expect(response.data.data.playerMessage.message).toBe('Hello, how are you?');
          this.expect(response.data.data.botResponse.message).toBeTruthy();
          this.expect(response.data.data.playerMessage.sender).toBe('player');
          this.expect(response.data.data.botResponse.sender).toBe('bot');
        });

        runner.it('should add messages to conversation history', async function() {
          const testPlayer = this.data.createPlayer();
          const messages = ['First message', 'Second message', 'Third message'];
          
          for (const message of messages) {
            const action = {
              type: 'CHAT',
              payload: { message },
              playerId: testPlayer.id
            };
            await this.client.post(`/api/actions/${testPlayer.id}`, action);
          }
          
          const stateResponse = await this.client.get(`/api/state/${testPlayer.id}`);
          const history = stateResponse.data.data.session.conversationHistory;
          
          this.expect(history.length).toBe(messages.length * 2); // Player + bot messages
          
          const playerMessages = history.filter(msg => msg.sender === 'player');
          this.expect(playerMessages.length).toBe(messages.length);
          
          messages.forEach((message, index) => {
            this.expect(playerMessages[index].message).toBe(message);
          });
        });

        runner.it('should generate contextual responses', async function() {
          const testPlayer = this.data.createPlayer();
          const testCases = [
            { message: 'What is my score?', expectedKeywords: ['score', 'points'] },
            { message: 'Tell me about quests', expectedKeywords: ['quest', 'available'] },
            { message: 'Hello!', expectedKeywords: ['greetings', 'hero'] }
          ];

          for (const testCase of testCases) {
            const action = {
              type: 'CHAT',
              payload: { message: testCase.message },
              playerId: testPlayer.id
            };
            
            const response = await this.client.post(`/api/actions/${testPlayer.id}`, action);
            const botMessage = response.data.data.botResponse.message.toLowerCase();
            
            const hasExpectedKeyword = testCase.expectedKeywords.some(keyword => 
              botMessage.includes(keyword.toLowerCase())
            );
            this.expect(hasExpectedKeyword).toBe(true);
          }
        });

      });

      runner.describe('START_QUEST action', () => {
        
        runner.it('should start an available quest', async function() {
          const testPlayer = this.data.createPlayer();
          
          // Get available quests first
          const questsResponse = await this.client.get(`/api/quests/${testPlayer.id}`);
          const availableQuest = questsResponse.data.data.available[0];
          
          const action = {
            type: 'START_QUEST',
            payload: { questId: availableQuest.id },
            playerId: testPlayer.id
          };
          
          const response = await this.client.post(`/api/actions/${testPlayer.id}`, action);
          
          this.expect(response).toHaveStatus(200);
          this.expect(response.data.data.quest).toBe(availableQuest.title);
          this.expect(response.data.data.status).toBe('started');
        });

        runner.it('should update player status when quest starts', async function() {
          const testPlayer = this.data.createPlayer();
          const questsResponse = await this.client.get(`/api/quests/${testPlayer.id}`);
          const availableQuest = questsResponse.data.data.available[0];
          
          const action = {
            type: 'START_QUEST',
            payload: { questId: availableQuest.id },
            playerId: testPlayer.id
          };
          
          await this.client.post(`/api/actions/${testPlayer.id}`, action);
          
          const stateResponse = await this.client.get(`/api/state/${testPlayer.id}`);
          const player = stateResponse.data.data.player;
          
          this.expect(player.status).toBe('in-quest');
          this.expect(player.currentQuest).toBe(availableQuest.id);
        });

        runner.it('should move quest from available to active', async function() {
          const testPlayer = this.data.createPlayer();
          const questsResponse = await this.client.get(`/api/quests/${testPlayer.id}`);
          const initialAvailableCount = questsResponse.data.data.available.length;
          const availableQuest = questsResponse.data.data.available[0];
          
          const action = {
            type: 'START_QUEST',
            payload: { questId: availableQuest.id },
            playerId: testPlayer.id
          };
          
          await this.client.post(`/api/actions/${testPlayer.id}`, action);
          
          const updatedQuestsResponse = await this.client.get(`/api/quests/${testPlayer.id}`);
          const updatedQuests = updatedQuestsResponse.data.data;
          
          this.expect(updatedQuests.available.length).toBe(initialAvailableCount - 1);
          this.expect(updatedQuests.active).toBeValidQuest();
          this.expect(updatedQuests.active.id).toBe(availableQuest.id);
        });

        runner.it('should return 404 for non-existent quest', async function() {
          const testPlayer = this.data.createPlayer();
          const action = {
            type: 'START_QUEST',
            payload: { questId: 'non-existent-quest' },
            playerId: testPlayer.id
          };
          
          const response = await this.client.post(
            `/api/actions/${testPlayer.id}`, 
            action,
            { expectStatus: [404] }
          );
          
          this.expect(response).toHaveStatus(404);
          this.expect(response.data.error).toBe('Quest not found');
        });

      });

      runner.describe('Session and metadata updates', () => {
        
        runner.it('should increment turn count on each action', async function() {
          const testPlayer = this.data.createPlayer();
          const initialState = await this.client.get(`/api/state/${testPlayer.id}`);
          const initialTurnCount = initialState.data.data.session.turnCount;
          
          const action = {
            type: 'SET_SCORE',
            payload: { score: 100 },
            playerId: testPlayer.id
          };
          
          await this.client.post(`/api/actions/${testPlayer.id}`, action);
          
          const updatedState = await this.client.get(`/api/state/${testPlayer.id}`);
          const updatedTurnCount = updatedState.data.data.session.turnCount;
          
          this.expect(updatedTurnCount).toBe(initialTurnCount + 1);
        });

        runner.it('should update lastAction timestamp', async function() {
          const testPlayer = this.data.createPlayer();
          const beforeTime = Date.now();
          
          const action = {
            type: 'SET_SCORE',
            payload: { score: 50 },
            playerId: testPlayer.id
          };
          
          await this.client.post(`/api/actions/${testPlayer.id}`, action);
          
          const state = await this.client.get(`/api/state/${testPlayer.id}`);
          const lastActionTime = new Date(state.data.data.session.lastAction).getTime();
          
          this.expect(lastActionTime).toBeGreaterThan(beforeTime);
          this.expect(lastActionTime).toBeLessThan(Date.now() + 1000);
        });

      });

    });

  });
};
