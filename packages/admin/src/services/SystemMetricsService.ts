import { EventEmitter } from 'events';
import os from 'os';
import { SystemMetrics } from '@mymcp/types';

export interface DetailedMetrics extends SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    cores: number;
    model: string;
    speed: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    available: number;
    cached?: number;
    buffers?: number;
  };
  process: {
    pid: number;
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    cpu: {
      user: number;
      system: number;
    };
  };
  network?: {
    interfaces: Array<{
      name: string;
      address: string;
      family: string;
      internal: boolean;
    }>;
  };
}

export class SystemMetricsService extends EventEmitter {
  private collectionInterval?: NodeJS.Timeout;
  private metricsHistory: DetailedMetrics[] = [];
  private maxHistorySize = 100;
  private previousCpuInfo?: any;

  constructor() {
    super();
  }

  startCollection() {
    // Initial collection
    this.collectMetrics();

    // Set up periodic collection
    this.collectionInterval = setInterval(() => {
      this.collectMetrics();
    }, 10000); // Every 10 seconds

    console.log('📊 System metrics collection started');
  }

  stopCollection() {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      console.log('📊 System metrics collection stopped');
    }
  }

  private async collectMetrics() {
    const metrics = await this.getCurrentMetrics();
    this.addToHistory(metrics);
    this.emit('metrics', metrics);
  }

  async getCurrentMetrics(): Promise<DetailedMetrics> {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const processMemory = process.memoryUsage();
    const processCpu = process.cpuUsage();

    // Calculate CPU usage percentage
    const cpuUsage = this.calculateCpuUsage(cpus);

    // Get network interfaces
    const networkInterfaces = this.getNetworkInterfaces();

    const metrics: DetailedMetrics = {
      timestamp: new Date(),
      uptime: process.uptime(),
      cpu: {
        usage: cpuUsage,
        cores: cpus.length,
        model: cpus[0]?.model || 'unknown',
        speed: cpus[0]?.speed || 0,
        loadAverage: os.loadavg()
      },
      memory: {
        used: usedMemory,
        total: totalMemory,
        percentage: (usedMemory / totalMemory) * 100,
        available: freeMemory
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: {
          rss: processMemory.rss,
          heapTotal: processMemory.heapTotal,
          heapUsed: processMemory.heapUsed,
          external: processMemory.external
        },
        cpu: {
          user: processCpu.user / 1000000, // Convert to seconds
          system: processCpu.system / 1000000
        }
      },
      network: {
        interfaces: networkInterfaces
      },
      activeSessions: 0, // Will be updated by admin dashboard
      totalQuests: 0,    // Will be updated by admin dashboard
      completedQuests: 0 // Will be updated by admin dashboard
    };

    return metrics;
  }

  private calculateCpuUsage(cpus: os.CpuInfo[]): number {
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);

    return usage;
  }

  private getNetworkInterfaces() {
    const interfaces = os.networkInterfaces();
    const result: any[] = [];

    for (const [name, addresses] of Object.entries(interfaces)) {
      if (addresses) {
        for (const address of addresses) {
          result.push({
            name,
            address: address.address,
            family: address.family,
            internal: address.internal
          });
        }
      }
    }

    return result;
  }

  private addToHistory(metrics: DetailedMetrics) {
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
    }
  }

  getMetricsHistory(duration?: number): DetailedMetrics[] {
    if (!duration) {
      return [...this.metricsHistory];
    }

    const cutoff = Date.now() - duration;
    return this.metricsHistory.filter(m => m.timestamp.getTime() > cutoff);
  }

  getAverageMetrics(duration: number): any {
    const history = this.getMetricsHistory(duration);
    if (history.length === 0) return null;

    const avgCpu = history.reduce((sum, m) => sum + m.cpu.usage, 0) / history.length;
    const avgMemory = history.reduce((sum, m) => sum + m.memory.percentage, 0) / history.length;
    const avgHeap = history.reduce((sum, m) => sum + m.process.memory.heapUsed, 0) / history.length;

    return {
      cpu: avgCpu,
      memory: avgMemory,
      heapUsed: avgHeap,
      samples: history.length
    };
  }

  getMetricsSummary(): any {
    const current = this.metricsHistory[this.metricsHistory.length - 1];
    if (!current) return null;

    const oneMinuteAgo = this.getAverageMetrics(60000);
    const fiveMinutesAgo = this.getAverageMetrics(300000);
    const fifteenMinutesAgo = this.getAverageMetrics(900000);

    return {
      current: {
        cpu: current.cpu.usage,
        memory: current.memory.percentage,
        uptime: current.uptime
      },
      averages: {
        oneMinute: oneMinuteAgo,
        fiveMinutes: fiveMinutesAgo,
        fifteenMinutes: fifteenMinutesAgo
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        cores: current.cpu.cores,
        totalMemory: current.memory.total,
        hostname: os.hostname()
      }
    };
  }

  // Alert thresholds
  checkThresholds(thresholds: { cpu?: number; memory?: number; heap?: number }): any[] {
    const current = this.metricsHistory[this.metricsHistory.length - 1];
    if (!current) return [];

    const alerts = [];

    if (thresholds.cpu && current.cpu.usage > thresholds.cpu) {
      alerts.push({
        type: 'cpu',
        severity: 'warning',
        message: `CPU usage is ${current.cpu.usage.toFixed(1)}% (threshold: ${thresholds.cpu}%)`,
        value: current.cpu.usage,
        threshold: thresholds.cpu
      });
    }

    if (thresholds.memory && current.memory.percentage > thresholds.memory) {
      alerts.push({
        type: 'memory',
        severity: 'warning',
        message: `Memory usage is ${current.memory.percentage.toFixed(1)}% (threshold: ${thresholds.memory}%)`,
        value: current.memory.percentage,
        threshold: thresholds.memory
      });
    }

    if (thresholds.heap && current.process.memory.heapUsed > thresholds.heap) {
      alerts.push({
        type: 'heap',
        severity: 'warning',
        message: `Heap usage is ${(current.process.memory.heapUsed / 1024 / 1024).toFixed(1)}MB (threshold: ${(thresholds.heap / 1024 / 1024).toFixed(1)}MB)`,
        value: current.process.memory.heapUsed,
        threshold: thresholds.heap
      });
    }

    return alerts;
  }

  exportMetrics(format: 'json' | 'csv' = 'json'): string {
    const history = this.getMetricsHistory();

    if (format === 'json') {
      return JSON.stringify(history, null, 2);
    } else {
      // CSV format
      const headers = [
        'Timestamp',
        'CPU Usage (%)',
        'Memory Usage (%)',
        'Memory Used (MB)',
        'Process Heap (MB)',
        'Uptime (s)'
      ];

      const rows = history.map(m => [
        m.timestamp.toISOString(),
        m.cpu.usage.toFixed(2),
        m.memory.percentage.toFixed(2),
        (m.memory.used / 1024 / 1024).toFixed(2),
        (m.process.memory.heapUsed / 1024 / 1024).toFixed(2),
        m.uptime.toFixed(0)
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  clearHistory() {
    this.metricsHistory = [];
  }
} 