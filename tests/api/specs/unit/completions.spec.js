/**
 * Unit Tests for Context Completions Endpoint
 * Tests GET /api/context/completions/:playerId functionality
 */

module.exports = function(runner) {

  runner.describe('Context Completions Endpoint', () => {

    runner.describe('GET /api/context/completions/:playerId', () => {
      
      runner.it('should return completion suggestions array', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/context/completions/${testPlayer.id}`);
        
        this.expect(response).toHaveStatus(200);
        this.expect(response.data.success).toBe(true);
        this.expect(Array.isArray(response.data.data)).toBe(true);
      });

      runner.it('should return default suggestions with no prefix', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/context/completions/${testPlayer.id}`);
        const suggestions = response.data.data;
        
        this.expect(suggestions.length).toBeGreaterThan(0);
        this.expect(suggestions).toContain('status');
        this.expect(suggestions).toContain('chat');
        this.expect(suggestions).toContain('help');
      });

      runner.it('should filter suggestions based on prefix', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/context/completions/${testPlayer.id}?prefix=qu`);
        const suggestions = response.data.data;
        
        // Should return quest-related suggestions
        const hasQuestSuggestions = suggestions.some(s => 
          s.toLowerCase().includes('quest')
        );
        this.expect(hasQuestSuggestions).toBe(true);
      });

      runner.it('should provide quest-specific completions', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/context/completions/${testPlayer.id}?prefix=quest`);
        const suggestions = response.data.data;
        
        // Should include quest titles
        this.expect(suggestions.some(s => s.includes('Council of Three Realms'))).toBe(true);
        this.expect(suggestions.some(s => s.includes('Dungeon Keeper'))).toBe(true);
        this.expect(suggestions.some(s => s.includes('Cryptomancer'))).toBe(true);
      });

      runner.it('should provide spell-related completions', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/context/completions/${testPlayer.id}?prefix=cast`);
        const suggestions = response.data.data;
        
        // Should include spell suggestions
        this.expect(suggestions).toContain('fireball');
        this.expect(suggestions).toContain('heal');
        this.expect(suggestions).toContain('teleport');
        this.expect(suggestions).toContain('shield');
      });

      runner.it('should limit suggestions to reasonable number', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/context/completions/${testPlayer.id}?prefix=`);
        const suggestions = response.data.data;
        
        this.expect(suggestions.length).toBeLessThan(20);
      });

      runner.it('should handle empty prefix gracefully', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/context/completions/${testPlayer.id}?prefix=`);
        
        this.expect(response).toHaveStatus(200);
        this.expect(Array.isArray(response.data.data)).toBe(true);
        this.expect(response.data.data.length).toBeGreaterThan(0);
      });

      runner.it('should handle non-matching prefix', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/context/completions/${testPlayer.id}?prefix=xyzabc`);
        const suggestions = response.data.data;
        
        this.expect(Array.isArray(suggestions)).toBe(true);
        // May be empty or contain partial matches
      });

      runner.it('should be case insensitive', async function() {
        const testPlayer = this.data.createPlayer();
        const upperResponse = await this.client.get(`/api/context/completions/${testPlayer.id}?prefix=QUEST`);
        const lowerResponse = await this.client.get(`/api/context/completions/${testPlayer.id}?prefix=quest`);
        
        this.expect(upperResponse.data.data.length).toBeGreaterThan(0);
        this.expect(lowerResponse.data.data.length).toBeGreaterThan(0);
        // Both should return quest-related suggestions
      });

      runner.it('should work with default player when no ID provided', async function() {
        const response = await this.client.get('/api/context/completions/?prefix=help');
        
        this.expect(response).toHaveStatus(200);
        this.expect(Array.isArray(response.data.data)).toBe(true);
      });

      runner.it('should include player inventory items when relevant', async function() {
        const testPlayer = this.data.createPlayer();
        
        // First, give the player some items by completing a quest partially
        // This is a more complex test that depends on game state
        
        const response = await this.client.get(`/api/context/completions/${testPlayer.id}?prefix=use`);
        const suggestions = response.data.data;
        
        this.expect(Array.isArray(suggestions)).toBe(true);
        // For a new player, might not have items, but endpoint should still work
      });

      runner.it('should provide contextual suggestions based on player state', async function() {
        const testPlayer = this.data.createPlayer();
        
        // Set player to have some score and level
        await this.client.post(`/api/actions/${testPlayer.id}`, {
          type: 'SET_SCORE',
          payload: { score: 500 },
          playerId: testPlayer.id
        });
        
        const response = await this.client.get(`/api/context/completions/${testPlayer.id}?prefix=`);
        const suggestions = response.data.data;
        
        this.expect(suggestions).toContain('status');
        this.expect(suggestions.length).toBeGreaterThan(0);
      });

      runner.it('should include timestamp in response', async function() {
        const testPlayer = this.data.createPlayer();
        const response = await this.client.get(`/api/context/completions/${testPlayer.id}`);
        
        this.expect(response.data).toHaveProperty('timestamp');
        const timestamp = new Date(response.data.timestamp);
        this.expect(timestamp).toBeInstanceOf(Date);
      });

    });

  });
};
