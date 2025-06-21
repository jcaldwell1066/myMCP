import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { AdminDashboardService } from './services/AdminDashboardService';
import { HealthMonitor } from './services/HealthMonitor';
import { RedisQueryService } from './services/RedisQueryService';
import { LeaderboardService } from './services/LeaderboardService';
import { SystemMetricsService } from './services/SystemMetricsService';
import { setupRoutes } from './routes';
import { setupWebSocketHandlers } from './websocket';
import { config } from './config';

export class AdminServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private services: {
    dashboard: AdminDashboardService;
    health: HealthMonitor;
    redis: RedisQueryService;
    leaderboard: LeaderboardService;
    metrics: SystemMetricsService;
  };

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.corsOrigins,
        credentials: true
      }
    });

    // Initialize services
    this.services = {
      dashboard: new AdminDashboardService(),
      health: new HealthMonitor(config.redisUrl),
      redis: new RedisQueryService(config.redisUrl),
      leaderboard: new LeaderboardService(config.redisUrl),
      metrics: new SystemMetricsService()
    };

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware() {
    // Security
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"]
        }
      }
    }));

    // CORS
    this.app.use(cors({
      origin: config.corsOrigins,
      credentials: true
    }));

    // Logging
    this.app.use(morgan('combined'));

    // Body parsing
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Static files for admin UI
    this.app.use(express.static('public'));
  }

  private setupRoutes() {
    setupRoutes(this.app, this.services);
  }

  private setupWebSocket() {
    setupWebSocketHandlers(this.io, this.services);
    
    // Start real-time monitoring
    this.services.health.startMonitoring();
    this.services.metrics.startCollection();
  }

  async start(port: number = 3500) {
    try {
      await this.services.dashboard.initialize();
      
      this.server.listen(port, () => {
        console.log(`🚀 Admin Dashboard running at http://localhost:${port}`);
        console.log(`📊 WebSocket endpoint: ws://localhost:${port}`);
        console.log(`🔧 API endpoint: http://localhost:${port}/api`);
      });
    } catch (error) {
      console.error('Failed to start admin server:', error);
      process.exit(1);
    }
  }

  async stop() {
    await this.services.health.stopMonitoring();
    await this.services.metrics.stopCollection();
    this.server.close();
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new AdminServer();
  server.start();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });
}

export default AdminServer; 