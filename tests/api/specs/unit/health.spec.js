/**
 * Unit Tests for Health Endpoint
 * Tests the /health endpoint functionality
 */

module.exports = function(runner) {

  runner.describe('Health Endpoint', () => {
    
    runner.it('should return 200 status code', async function() {
      const response = await this.client.get('/health');
      this.expect(response).toHaveStatus(200);
    });

    runner.it('should return valid health information', async function() {
      const response = await this.client.get('/health');
      this.expect(response.data).toHaveProperty('status', 'ok');
      this.expect(response.data).toHaveProperty('message');
      this.expect(response.data).toHaveProperty('timestamp');
      this.expect(response.data).toHaveProperty('version');
      this.expect(response.data).toHaveProperty('activeStates');
    });

    runner.it('should have correct response structure', async function() {
      const response = await this.client.get('/health');
      const { data } = response;
      
      this.expect(data.status).toBe('ok');
      this.expect(data.version).toBe('1.0.0');
      this.expect(typeof data.activeStates).toBe('number');
      this.expect(typeof data.wsConnections).toBe('number');
      this.expect(data.message).toContain('myMCP Engine');
    });

    runner.it('should return timestamp in ISO format', async function() {
      const response = await this.client.get('/health');
      const timestamp = new Date(response.data.timestamp);
      
      this.expect(timestamp).not.toBeNull();
      this.expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    runner.it('should be consistent across multiple calls', async function() {
      const response1 = await this.client.get('/health');
      const response2 = await this.client.get('/health');
      
      this.expect(response1.data.status).toBe(response2.data.status);
      this.expect(response1.data.version).toBe(response2.data.version);
      this.expect(response1.data.message).toBe(response2.data.message);
    });

    runner.it('should handle concurrent requests', async function() {
      const promises = Array(5).fill().map(() => this.client.get('/health'));
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        this.expect(response).toHaveStatus(200);
        this.expect(response.data.status).toBe('ok');
      });
    });

  });
};
