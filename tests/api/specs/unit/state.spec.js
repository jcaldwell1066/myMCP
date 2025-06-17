/**
 * Unit Tests for Game State Endpoints
 * Tests GET /api/state/:playerId and PUT /api/state/:playerId/player
 */

module.exports = function(runner) {

  runner.describe('Game State Endpoints', () => {

    runner.describe('GET /api/state/:playerId', () => {
      
      runner.it('should create default state for new player', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/state/${testPlayer.id}`);
        
        this.expect(response).toHaveStatus(200);
        this.expect(response.data).toHaveProperty('success', true);
        this.expect(response.data.data).toBeValidGameState();
      });

      runner.it('should return player with correct default values', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/state/${testPlayer.id}`);
        const player = response.data.data.player;
        
        this.expect(player).toBeValidPlayer();
        this.expect(player.id).toBe(testPlayer.id);
        this.expect(player.name).toBe('Hero');
        this.expect(player.score).toBe(0);
        this.expect(player.level).toBe('novice');
        this.expect(player.status).toBe('idle');
        this.expect(player.location).toBe('town');
      });

      runner.it('should include all required game state sections', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/state/${testPlayer.id}`);
        const gameState = response.data.data;
        
        this.expect(gameState).toHaveProperty('player');
        this.expect(gameState).toHaveProperty('quests');
        this.expect(gameState).toHaveProperty('inventory');
        this.expect(gameState).toHaveProperty('session');
        this.expect(gameState).toHaveProperty('metadata');
      });

      runner.it('should include default quests', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/state/${testPlayer.id}`);
        const quests = response.data.data.quests;
        
        this.expect(quests).toHaveProperty('available');
        this.expect(quests).toHaveProperty('active');
        this.expect(quests).toHaveProperty('completed');
        
        this.expect(quests.available).toHaveLength(3);
        this.expect(quests.active).toBeNull();
        this.expect(quests.completed).toHaveLength(0);
      });

      runner.it('should work with default player ID when none provided', async function() {
        const response = await this.client.get('/api/state/');
        
        this.expect(response).toHaveStatus(200);
        this.expect(response.data.data.player.id).toBe('default-player');
      });

      runner.it('should persist state between requests', async function() {
        const testPlayer = this.data.createPlayer();
        
        // First request creates the state
        const response1 = await this.client.get(`/api/state/${testPlayer.id}`);
        const sessionId1 = response1.data.data.session.id;
        
        // Second request should return the same state
        const response2 = await this.client.get(`/api/state/${testPlayer.id}`);
        const sessionId2 = response2.data.data.session.id;
        
        this.expect(sessionId1).toBe(sessionId2);
      });

    });

    runner.describe('PUT /api/state/:playerId/player', () => {
      
      runner.it('should update player score', async function() {
        const testPlayer = this.data.createPlayer();
        const updateData = { score: 150 };
        const response = await this.client.put(
          `/api/state/${testPlayer.id}/player`, 
          updateData
        );
        
        this.expect(response).toHaveStatus(200);
        this.expect(response.data.data.score).toBe(150);
      });

      runner.it('should update player level based on score', async function() {
        const testPlayer = this.data.createPlayer();
        const updateData = { score: 600 };
        const response = await this.client.put(
          `/api/state/${testPlayer.id}/player`, 
          updateData
        );
        
        this.expect(response.data.data.level).toBe('expert');
      });

      runner.it('should update multiple player fields', async function() {
        const testPlayer = this.data.createPlayer();
        const updateData = { 
          score: 250, 
          status: 'exploring',
          location: 'forest'
        };
        const response = await this.client.put(
          `/api/state/${testPlayer.id}/player`, 
          updateData
        );
        
        const player = response.data.data;
        this.expect(player.score).toBe(250);
        this.expect(player.status).toBe('exploring');
        this.expect(player.location).toBe('forest');
        this.expect(player.level).toBe('apprentice'); // Should be updated based on score
      });

      runner.it('should update session metadata', async function() {
        const testPlayer = this.data.createPlayer();
        const updateData = { score: 100 };
        await this.client.put(`/api/state/${testPlayer.id}/player`, updateData);
        
        // Get the updated state
        const stateResponse = await this.client.get(`/api/state/${testPlayer.id}`);
        const session = stateResponse.data.data.session;
        
        this.expect(new Date(session.lastAction)).toBeInstanceOf(Date);
        this.expect(new Date(session.lastAction).getTime()).toBeGreaterThan(Date.now() - 5000);
      });

      runner.it('should preserve other player fields when updating', async function() {
        const testPlayer = this.data.createPlayer();
        
        // First, get initial state
        const initialResponse = await this.client.get(`/api/state/${testPlayer.id}`);
        const initialPlayer = initialResponse.data.data.player;
        
        // Update only score
        const updateData = { score: 100 };
        await this.client.put(`/api/state/${testPlayer.id}/player`, updateData);
        
        // Check that other fields are preserved
        const updatedResponse = await this.client.get(`/api/state/${testPlayer.id}`);
        const updatedPlayer = updatedResponse.data.data.player;
        
        this.expect(updatedPlayer.name).toBe(initialPlayer.name);
        this.expect(updatedPlayer.id).toBe(initialPlayer.id);
        this.expect(updatedPlayer.location).toBe(initialPlayer.location);
        this.expect(updatedPlayer.score).toBe(100); // This should be updated
      });

    });

  });
};
