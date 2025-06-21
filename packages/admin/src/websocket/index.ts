import { Server as SocketIOServer } from 'socket.io';
import { Services } from '../routes';

export function setupWebSocketHandlers(io: SocketIOServer, services: Services) {
  // Set up event listeners for real-time updates
  services.dashboard.on('event', (event) => {
    io.emit('admin:event', event);
  });

  services.dashboard.on('stateUpdate', (update) => {
    io.emit('game:stateUpdate', update);
  });

  services.dashboard.on('playerPresence', (presence) => {
    io.emit('game:playerPresence', presence);
  });

  services.health.on('healthUpdate', (health) => {
    io.emit('health:update', health);
  });

  services.health.on('alert', (alert) => {
    io.emit('health:alert', alert);
  });

  services.metrics.on('metrics', (metrics) => {
    io.emit('metrics:update', metrics);
  });

  // Handle client connections
  io.on('connection', (socket) => {
    console.log(`Admin client connected: ${socket.id}`);

    // Send initial data
    socket.emit('connected', {
      id: socket.id,
      timestamp: new Date()
    });

    // Subscribe to specific updates
    socket.on('subscribe', async (channels: string[]) => {
      console.log(`Client ${socket.id} subscribing to:`, channels);
      
      for (const channel of channels) {
        socket.join(channel);
        
        // Send initial data based on channel
        switch (channel) {
          case 'dashboard':
            const dashboardData = await services.dashboard.getDashboardData();
            socket.emit('dashboard:initial', dashboardData);
            break;
            
          case 'health':
            const healthData = await services.health.getSystemHealth();
            socket.emit('health:initial', healthData);
            break;
            
          case 'metrics':
            const metricsData = await services.metrics.getCurrentMetrics();
            socket.emit('metrics:initial', metricsData);
            break;
            
          case 'leaderboard':
            const leaderboardData = await services.leaderboard.getLeaderboard(10);
            socket.emit('leaderboard:initial', leaderboardData);
            break;
        }
      }
    });

    socket.on('unsubscribe', (channels: string[]) => {
      console.log(`Client ${socket.id} unsubscribing from:`, channels);
      for (const channel of channels) {
        socket.leave(channel);
      }
    });

    // Real-time Redis queries
    socket.on('redis:query', async (data) => {
      try {
        const result = await services.redis.executeQuery(data.command, data.args);
        socket.emit('redis:result', { 
          id: data.id,
          success: true,
          result 
        });
      } catch (error: any) {
        socket.emit('redis:result', { 
          id: data.id,
          success: false,
          error: error.message 
        });
      }
    });

    // Real-time player search
    socket.on('players:search', async (query: string) => {
      try {
        const players = await services.dashboard.searchPlayers(query);
        socket.emit('players:results', players);
      } catch (error) {
        socket.emit('players:error', 'Failed to search players');
      }
    });

    // Manual health check trigger
    socket.on('health:check', async () => {
      try {
        const health = await services.health.triggerHealthCheck();
        socket.emit('health:update', health);
      } catch (error) {
        socket.emit('health:error', 'Failed to perform health check');
      }
    });

    // Get metrics for specific duration
    socket.on('metrics:history', (duration: number) => {
      try {
        const history = services.metrics.getMetricsHistory(duration);
        socket.emit('metrics:history', history);
      } catch (error) {
        socket.emit('metrics:error', 'Failed to fetch metrics history');
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Admin client disconnected: ${socket.id}`);
    });
  });

  // Periodic updates to subscribed channels
  setInterval(async () => {
    // Update dashboard subscribers
    const dashboardRooms = io.sockets.adapter.rooms.get('dashboard');
    if (dashboardRooms && dashboardRooms.size > 0) {
      const data = await services.dashboard.getDashboardData();
      io.to('dashboard').emit('dashboard:update', data);
    }

    // Update leaderboard subscribers
    const leaderboardRooms = io.sockets.adapter.rooms.get('leaderboard');
    if (leaderboardRooms && leaderboardRooms.size > 0) {
      const data = await services.leaderboard.getLeaderboard(10);
      io.to('leaderboard').emit('leaderboard:update', data);
    }
  }, 30000); // Every 30 seconds

  console.log('🔌 WebSocket handlers initialized');
} 