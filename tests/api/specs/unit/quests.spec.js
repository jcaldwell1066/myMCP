/**
 * Unit Tests for Quests Endpoint  
 * Tests GET /api/quests/:playerId functionality
 */

module.exports = function(runner) {

  runner.describe('Quests Endpoint', () => {

    runner.describe('GET /api/quests/:playerId', () => {
      
      runner.it('should return quest data structure', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/quests/${testPlayer.id}`);
        
        this.expect(response).toHaveStatus(200);
        this.expect(response.data.success).toBe(true);
        this.expect(response.data.data).toHaveProperty('available');
        this.expect(response.data.data).toHaveProperty('active');
        this.expect(response.data.data).toHaveProperty('completed');
      });

      runner.it('should return default quests for new player', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/quests/${testPlayer.id}`);
        const quests = response.data.data;
        
        this.expect(Array.isArray(quests.available)).toBe(true);
        this.expect(quests.available.length).toBe(3);
        this.expect(quests.active).toBeNull();
        this.expect(Array.isArray(quests.completed)).toBe(true);
        this.expect(quests.completed.length).toBe(0);
      });

      runner.it('should include all required quest fields', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/quests/${testPlayer.id}`);
        const availableQuests = response.data.data.available;
        
        availableQuests.forEach(quest => {
          this.expect(quest).toBeValidQuest();
          this.expect(quest).toHaveProperty('id');
          this.expect(quest).toHaveProperty('title');
          this.expect(quest).toHaveProperty('description');
          this.expect(quest).toHaveProperty('realWorldSkill');
          this.expect(quest).toHaveProperty('fantasyTheme');
          this.expect(quest).toHaveProperty('status', 'available');
          this.expect(quest).toHaveProperty('steps');
          this.expect(quest).toHaveProperty('reward');
        });
      });

      runner.it('should include valid quest steps', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/quests/${testPlayer.id}`);
        const availableQuests = response.data.data.available;
        
        availableQuests.forEach(quest => {
          this.expect(Array.isArray(quest.steps)).toBe(true);
          this.expect(quest.steps.length).toBeGreaterThan(0);
          
          quest.steps.forEach(step => {
            this.expect(step).toHaveProperty('id');
            this.expect(step).toHaveProperty('description');
            this.expect(step).toHaveProperty('completed', false);
          });
        });
      });

      runner.it('should include valid quest rewards', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/quests/${testPlayer.id}`);
        const availableQuests = response.data.data.available;
        
        availableQuests.forEach(quest => {
          this.expect(quest.reward).toHaveProperty('score');
          this.expect(typeof quest.reward.score).toBe('number');
          this.expect(quest.reward.score).toBeGreaterThan(0);
          this.expect(Array.isArray(quest.reward.items)).toBe(true);
        });
      });

      runner.it('should return expected default quest IDs', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/quests/${testPlayer.id}`);
        const availableQuests = response.data.data.available;
        
        const questIds = availableQuests.map(q => q.id);
        const expectedIds = ['global-meeting', 'server-health', 'hmac-security'];
        
        expectedIds.forEach(expectedId => {
          this.expect(questIds).toContain(expectedId);
        });
      });

      runner.it('should work with default player when no ID provided', async function() {
        const response = await this.client.get('/api/quests/');
        
        this.expect(response).toHaveStatus(200);
        this.expect(response.data.data.available.length).toBe(3);
      });

      runner.it('should maintain quest state consistency', async function() {
        const testPlayer = this.data.createPlayer();
        
        // Get quests twice to ensure consistency
        const response1 = await this.client.get(`/api/quests/${testPlayer.id}`);
        const response2 = await this.client.get(`/api/quests/${testPlayer.id}`);
        
        this.expect(response1.data.data.available.length).toBe(response2.data.data.available.length);
        this.expect(JSON.stringify(response1.data.data.available)).toBe(JSON.stringify(response2.data.data.available));
      });

      runner.it('should update quest status after starting quest', async function() {
        const testPlayer = this.data.createPlayer();
        
        // Get initial quest state
        const initialResponse = await this.client.get(`/api/quests/${testPlayer.id}`);
        const questToStart = initialResponse.data.data.available[0];
        
        // Start a quest
        await this.client.post(`/api/actions/${testPlayer.id}`, {
          type: 'START_QUEST',
          payload: { questId: questToStart.id },
          playerId: testPlayer.id
        });
        
        // Check updated quest state
        const updatedResponse = await this.client.get(`/api/quests/${testPlayer.id}`);
        const updatedQuests = updatedResponse.data.data;
        
        this.expect(updatedQuests.available.length).toBe(initialResponse.data.data.available.length - 1);
        this.expect(updatedQuests.active).not.toBeNull();
        this.expect(updatedQuests.active.id).toBe(questToStart.id);
        this.expect(updatedQuests.active.status).toBe('active');
      });

      runner.it('should include timestamp in response', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/quests/${testPlayer.id}`);
        
        this.expect(response.data).toHaveProperty('timestamp');
        const timestamp = new Date(response.data.timestamp);
        this.expect(timestamp).toBeInstanceOf(Date);
        this.expect(timestamp.getTime()).toBeGreaterThan(Date.now() - 5000);
      });

    });

  });
};
