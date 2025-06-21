import { EventEmitter } from 'events';
import { Redis } from 'ioredis';
import { config } from '../config';
import os from 'os';

export interface HealthCheck {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  lastCheck: Date;
  message?: string;
  details?: any;
}

export interface EngineHealth {
  engineId: string;
  url: string;
  status: 'online' | 'offline' | 'degraded';
  role: 'leader' | 'worker' | 'standalone';
  lastPing: Date;
  responseTime?: number;
  metrics?: {
    connectedClients: number;
    activePlayers: number;
    uptime: number;
    memory: {
      used: number;
      total: number;
    };
    cpu: number;
  };
}

export interface SystemHealth {
  timestamp: Date;
  overall: 'healthy' | 'warning' | 'critical';
  checks: HealthCheck[];
  engines: EngineHealth[];
  redis: {
    connected: boolean;
    latency: number;
    memory: string;
  };
  system: {
    cpu: number[];
    memory: {
      total: number;
      free: number;
      used: number;
      percentage: number;
    };
    loadAverage: number[];
    uptime: number;
  };
}

export class HealthMonitor extends EventEmitter {
  private redis: Redis;
  private monitoringInterval?: NodeJS.Timeout;
  private engineHealthCache: Map<string, EngineHealth> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();

  constructor(redisUrl: string) {
    super();
    this.redis = new Redis(redisUrl, {
      connectTimeout: 10000,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });
    
    this.redis.on('error', (err) => {
      console.error('HealthMonitor Redis error:', err.message);
      // Update health check status
      this.updateHealthCheck('redis', 'critical', `Redis error: ${err.message}`);
    });
    
    this.redis.on('connect', () => {
      console.log('HealthMonitor Redis connected');
      this.updateHealthCheck('redis', 'healthy', 'Redis connected');
    });
    
    this.initializeHealthChecks();
  }

  private initializeHealthChecks() {
    // Define standard health checks
    this.healthChecks.set('redis', {
      id: 'redis',
      name: 'Redis Connection',
      status: 'unknown',
      lastCheck: new Date()
    });

    this.healthChecks.set('engines', {
      id: 'engines',
      name: 'Game Engines',
      status: 'unknown',
      lastCheck: new Date()
    });

    this.healthChecks.set('system', {
      id: 'system',
      name: 'System Resources',
      status: 'unknown',
      lastCheck: new Date()
    });
  }

  startMonitoring() {
    // Initial check
    this.performHealthCheck();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, config.monitoring.healthCheckInterval);

    console.log('🏥 Health monitoring started');
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      console.log('🏥 Health monitoring stopped');
    }
  }

  private async performHealthCheck() {
    const health = await this.getSystemHealth();
    this.emit('healthUpdate', health);

    // Check for alerts
    this.checkAlerts(health);
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const [
      redisHealth,
      enginesHealth,
      systemResources
    ] = await Promise.all([
      this.checkRedisHealth(),
      this.checkEnginesHealth(),
      this.getSystemResources()
    ]);

    // Update health checks
    this.updateHealthCheck('redis', redisHealth.connected ? 'healthy' : 'critical', 
      redisHealth.connected ? 'Redis connected' : 'Redis disconnected');
    
    const engineStatus = this.calculateEngineStatus(enginesHealth);
    this.updateHealthCheck('engines', engineStatus.status, engineStatus.message);

    const systemStatus = this.calculateSystemStatus(systemResources);
    this.updateHealthCheck('system', systemStatus.status, systemStatus.message);

    // Calculate overall health
    const overall = this.calculateOverallHealth();

    return {
      timestamp: new Date(),
      overall,
      checks: Array.from(this.healthChecks.values()),
      engines: enginesHealth,
      redis: redisHealth,
      system: systemResources
    };
  }

  private async checkRedisHealth() {
    const start = Date.now();
    let connected = false;
    let latency = 0;
    let memory = 'unknown';

    try {
      await this.redis.ping();
      connected = true;
      latency = Date.now() - start;

      const info = await this.redis.info('memory');
      const memMatch = info.match(/used_memory_human:(.+)/);
      if (memMatch) {
        memory = memMatch[1].trim();
      }
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    return { connected, latency, memory };
  }

  private async checkEnginesHealth(): Promise<EngineHealth[]> {
    const engines: EngineHealth[] = [];

    for (const endpoint of config.engines.endpoints) {
      const start = Date.now();
      let health: EngineHealth = {
        engineId: endpoint,
        url: endpoint,
        status: 'offline',
        role: 'standalone',
        lastPing: new Date(),
        responseTime: 0
      };

      try {
        const response = await fetch(`${endpoint}/api/status`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        });

        if (response.ok) {
          const data = await response.json() as any;
          health = {
            engineId: data.engineId || endpoint,
            url: endpoint,
            status: 'online',
            role: data.isPrimary ? 'leader' : 'worker',
            lastPing: new Date(),
            responseTime: Date.now() - start,
            metrics: {
              connectedClients: data.connectedClients || 0,
              activePlayers: data.onlinePlayers?.length || 0,
              uptime: data.uptime || 0,
              memory: data.memory || { used: 0, total: 0 },
              cpu: data.cpu || 0
            }
          };

          // Check for degraded status
          if (health.responseTime && health.responseTime > config.monitoring.alertThresholds.engineResponseTime) {
            health.status = 'degraded';
          }
        }
      } catch (error) {
        console.error(`Engine health check failed for ${endpoint}:`, error);
      }

      engines.push(health);
      this.engineHealthCache.set(endpoint, health);
    }

    return engines;
  }

  private getSystemResources() {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Calculate CPU usage
    const cpuUsage = cpus.map(cpu => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return ((total - idle) / total) * 100;
    });

    return {
      cpu: cpuUsage,
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        percentage: (usedMemory / totalMemory) * 100
      },
      loadAverage: os.loadavg(),
      uptime: os.uptime()
    };
  }

  private calculateEngineStatus(engines: EngineHealth[]) {
    const online = engines.filter(e => e.status === 'online').length;
    const degraded = engines.filter(e => e.status === 'degraded').length;
    const total = engines.length;

    if (online === 0) {
      return { status: 'critical' as const, message: 'All engines offline' };
    } else if (online < total / 2) {
      return { status: 'warning' as const, message: `Only ${online}/${total} engines online` };
    } else if (degraded > 0) {
      return { status: 'warning' as const, message: `${degraded} engines degraded` };
    } else {
      return { status: 'healthy' as const, message: `All ${total} engines online` };
    }
  }

  private calculateSystemStatus(resources: any) {
    const { cpu, memory } = resources;
    const avgCpu = cpu.reduce((a: number, b: number) => a + b, 0) / cpu.length;

    if (memory.percentage > config.monitoring.alertThresholds.memoryUsage || 
        avgCpu > config.monitoring.alertThresholds.cpuUsage) {
      return { 
        status: 'warning' as const, 
        message: `High resource usage - CPU: ${avgCpu.toFixed(1)}%, Memory: ${memory.percentage.toFixed(1)}%` 
      };
    }

    return { 
      status: 'healthy' as const, 
      message: `CPU: ${avgCpu.toFixed(1)}%, Memory: ${memory.percentage.toFixed(1)}%` 
    };
  }

  private calculateOverallHealth(): 'healthy' | 'warning' | 'critical' {
    const statuses = Array.from(this.healthChecks.values()).map(check => check.status);
    
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('warning')) return 'warning';
    return 'healthy';
  }

  private updateHealthCheck(id: string, status: 'healthy' | 'warning' | 'critical', message?: string, details?: any) {
    const check = this.healthChecks.get(id);
    if (check) {
      check.status = status;
      check.lastCheck = new Date();
      check.message = message;
      check.details = details;
    }
  }

  private checkAlerts(health: SystemHealth) {
    // Check for critical conditions
    if (health.overall === 'critical') {
      this.emit('alert', {
        level: 'critical',
        message: 'System health critical',
        health
      });
    }

    // Check Redis latency
    if (health.redis.latency > config.monitoring.alertThresholds.redisLatency) {
      this.emit('alert', {
        level: 'warning',
        message: `High Redis latency: ${health.redis.latency}ms`,
        health
      });
    }

    // Check system resources
    if (health.system.memory.percentage > config.monitoring.alertThresholds.memoryUsage) {
      this.emit('alert', {
        level: 'warning',
        message: `High memory usage: ${health.system.memory.percentage.toFixed(1)}%`,
        health
      });
    }

    const avgCpu = health.system.cpu.reduce((a, b) => a + b, 0) / health.system.cpu.length;
    if (avgCpu > config.monitoring.alertThresholds.cpuUsage) {
      this.emit('alert', {
        level: 'warning',
        message: `High CPU usage: ${avgCpu.toFixed(1)}%`,
        health
      });
    }
  }

  // Get cached engine health for quick access
  getEngineHealth(engineId: string): EngineHealth | undefined {
    return this.engineHealthCache.get(engineId);
  }

  // Manual health check trigger
  async triggerHealthCheck(): Promise<SystemHealth> {
    return this.getSystemHealth();
  }

  async disconnect() {
    this.stopMonitoring();
    await this.redis.quit();
  }
} 