import { HealthMonitor } from '../HealthMonitor';
import { Redis } from 'ioredis';

// Mock Redis
jest.mock('ioredis');

describe('HealthMonitor', () => {
  let healthMonitor: HealthMonitor;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    mockRedis = new Redis() as jest.Mocked<Redis>;
    healthMonitor = new HealthMonitor('redis://localhost:6379');
    
    // Mock clearInterval globally
    global.clearInterval = jest.fn();
  });

  afterEach(() => {
    healthMonitor.stopMonitoring();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default health checks', () => {
      const health = healthMonitor['healthChecks'];
      expect(health.size).toBe(3);
      expect(health.has('redis')).toBe(true);
      expect(health.has('engines')).toBe(true);
      expect(health.has('system')).toBe(true);
    });
  });

  describe('getSystemHealth', () => {
    it('should return complete system health', async () => {
      // Mock Redis health check
      mockRedis.ping.mockResolvedValue('PONG');
      mockRedis.info.mockResolvedValue('used_memory_human:1.5M\r\n');

      const health = await healthMonitor.getSystemHealth();

      expect(health).toHaveProperty('timestamp');
      expect(health).toHaveProperty('overall');
      expect(health).toHaveProperty('checks');
      expect(health).toHaveProperty('engines');
      expect(health).toHaveProperty('redis');
      expect(health).toHaveProperty('system');
    });

    it('should handle Redis connection failure', async () => {
      // Create a new HealthMonitor instance with mocked Redis that fails
      const failingRedis = new Redis() as jest.Mocked<Redis>;
      failingRedis.ping.mockRejectedValue(new Error('Connection refused'));
      failingRedis.info.mockRejectedValue(new Error('Connection refused'));
      
      // Mock the redis property to use our failing Redis instance
      Object.defineProperty(healthMonitor, 'redis', {
        value: failingRedis,
        writable: true,
        configurable: true
      });

      const health = await healthMonitor.getSystemHealth();

      expect(health.redis.connected).toBe(false);
      expect(health.checks.find(c => c.id === 'redis')?.status).toBe('critical');
    });
  });

  describe('monitoring', () => {
    it('should start and stop monitoring', () => {
      const spy = jest.spyOn(healthMonitor as any, 'performHealthCheck');
      
      healthMonitor.startMonitoring();
      expect(healthMonitor['monitoringInterval']).toBeDefined();

      healthMonitor.stopMonitoring();
      expect(global.clearInterval).toHaveBeenCalled();
    });

    it('should emit health updates', (done) => {
      mockRedis.ping.mockResolvedValue('PONG');
      mockRedis.info.mockResolvedValue('used_memory_human:1.5M\r\n');

      healthMonitor.on('healthUpdate', (health) => {
        expect(health).toBeDefined();
        expect(health.timestamp).toBeInstanceOf(Date);
        done();
      });

      healthMonitor['performHealthCheck']();
    });

    it('should emit alerts on critical conditions', (done) => {
      mockRedis.ping.mockRejectedValue(new Error('Connection refused'));

      healthMonitor.on('alert', (alert) => {
        expect(alert.level).toBe('critical');
        expect(alert.message).toContain('System health critical');
        done();
      });

      healthMonitor['performHealthCheck']();
    });
  });

  describe('engine health checks', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should check engine health successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({
          engineId: 'engine-1',
          isPrimary: true,
          connectedClients: 5,
          onlinePlayers: ['player1', 'player2'],
          uptime: 3600
        })
      });

      const engines = await healthMonitor['checkEnginesHealth']();

      expect(engines).toHaveLength(3); // Based on default config
      expect(engines[0].status).toBe('online');
      expect(engines[0].role).toBe('leader');
    });

    it('should handle engine offline status', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const engines = await healthMonitor['checkEnginesHealth']();

      expect(engines[0].status).toBe('offline');
      expect(engines[0].role).toBe('standalone');
    });

    it('should detect degraded engine status', async () => {
      // Mock a fast response that simulates high response time
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ 
          engineId: 'engine-1', 
          isPrimary: false,
          connectedClients: 5,
          onlinePlayers: ['player1', 'player2'],
          uptime: 3600
        })
      });

      // Manually set response time to trigger degraded status
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = jest.fn(() => {
        callCount++;
        // First call is start time, second call is end time
        // Make it look like the request took > 1000ms (the default threshold)
        return callCount === 1 ? 1000 : 2500;
      });

      const engines = await healthMonitor['checkEnginesHealth']();
      
      // Restore Date.now
      Date.now = originalDateNow;
      
      // The response time should be 1500ms (2500 - 1000)
      expect(engines[0].responseTime).toBe(1500);
      expect(engines[0].status).toBe('degraded');
    });
  });

  describe('system resource monitoring', () => {
    it('should collect system resources', () => {
      const resources = healthMonitor['getSystemResources']();

      expect(resources).toHaveProperty('cpu');
      expect(resources).toHaveProperty('memory');
      expect(resources).toHaveProperty('loadAverage');
      expect(resources).toHaveProperty('uptime');

      expect(Array.isArray(resources.cpu)).toBe(true);
      expect(resources.memory.percentage).toBeGreaterThanOrEqual(0);
      expect(resources.memory.percentage).toBeLessThanOrEqual(100);
    });
  });

  describe('health status calculations', () => {
    it('should calculate overall health as healthy', () => {
      healthMonitor['updateHealthCheck']('redis', 'healthy');
      healthMonitor['updateHealthCheck']('engines', 'healthy');
      healthMonitor['updateHealthCheck']('system', 'healthy');

      const overall = healthMonitor['calculateOverallHealth']();
      expect(overall).toBe('healthy');
    });

    it('should calculate overall health as warning', () => {
      healthMonitor['updateHealthCheck']('redis', 'healthy');
      healthMonitor['updateHealthCheck']('engines', 'warning');
      healthMonitor['updateHealthCheck']('system', 'healthy');

      const overall = healthMonitor['calculateOverallHealth']();
      expect(overall).toBe('warning');
    });

    it('should calculate overall health as critical', () => {
      healthMonitor['updateHealthCheck']('redis', 'critical');
      healthMonitor['updateHealthCheck']('engines', 'warning');
      healthMonitor['updateHealthCheck']('system', 'healthy');

      const overall = healthMonitor['calculateOverallHealth']();
      expect(overall).toBe('critical');
    });
  });
}); 