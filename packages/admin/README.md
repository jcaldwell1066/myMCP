# myMCP Admin Dashboard

A comprehensive administrative dashboard for monitoring and managing the myMCP game ecosystem. This module provides real-time monitoring, system health checks, player management, and Redis query capabilities.

## Features

### 🏥 System Health Monitoring
- Real-time health checks for all components
- Engine status monitoring (Leader/Worker roles)
- Redis connectivity and performance metrics
- System resource monitoring (CPU, Memory, Network)
- Alert thresholds and notifications

### 📊 Dashboard Overview
- Total and active player counts
- Quest completion statistics
- System health summary
- Top players leaderboard
- Recent system events

### ⚙️ Engine Management
- Monitor multiple engine instances
- Leader/Worker status tracking
- Response time monitoring
- Connected clients per engine
- Automatic failover detection

### 👥 Player Management
- Search and filter players
- View detailed player states
- Player activity tracking
- Session management
- Quest progress monitoring

### 🏆 Leaderboard
- Real-time score updates
- Multiple ranking categories (score, quests, level)
- Player trend analysis
- Export capabilities (JSON/CSV)

### 🗄️ Redis Console
- Safe Redis query execution
- Saved query templates
- Key browser with type detection
- Performance metrics
- Query history

### 📈 Metrics & Analytics
- System performance graphs
- Historical data tracking
- Resource usage trends
- Export capabilities

## Installation

```bash
cd packages/admin
npm install
npm run build
```

## Configuration

The admin module can be configured through environment variables:

```bash
# Server Configuration
ADMIN_PORT=3500                    # Admin dashboard port
REDIS_URL=redis://localhost:6379   # Redis connection URL

# Authentication (optional)
ADMIN_AUTH_ENABLED=true           # Enable authentication
ADMIN_SECRET=your-secret-key      # Admin secret key

# Engine Endpoints
ENGINE_ENDPOINTS=http://localhost:3001,http://localhost:3002,http://localhost:3003

# Monitoring Intervals
HEALTH_CHECK_INTERVAL=5000        # Health check interval (ms)
METRICS_INTERVAL=10000            # Metrics collection interval (ms)
```

## Running the Admin Dashboard

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Docker
```bash
docker build -t mymcp-admin .
docker run -p 3500:3500 -e REDIS_URL=redis://host.docker.internal:6379 mymcp-admin
```

## API Endpoints

### Dashboard
- `GET /api/dashboard` - Get dashboard overview data
- `GET /api/events` - Get recent system events

### Health
- `GET /api/health` - Get complete system health
- `GET /api/health/engines` - Get engine health status

### Metrics
- `GET /api/metrics` - Get current system metrics
- `GET /api/metrics/history?duration=3600000` - Get metrics history
- `GET /api/metrics/summary` - Get metrics summary

### Players
- `GET /api/players?q=search` - Search players
- `GET /api/players/:playerId` - Get player details

### Leaderboard
- `GET /api/leaderboard?limit=50&offset=0` - Get leaderboard
- `GET /api/leaderboard/stats` - Get leaderboard statistics
- `GET /api/leaderboard/player/:playerId` - Get player rank

### Redis
- `POST /api/redis/query` - Execute Redis query
- `GET /api/redis/keys?pattern=*` - Search Redis keys
- `GET /api/redis/key/:key` - Get key details
- `GET /api/redis/stats` - Get Redis statistics

### Export
- `GET /api/export/leaderboard?format=csv` - Export leaderboard
- `GET /api/export/metrics?format=json` - Export metrics

## WebSocket Events

The admin dashboard uses WebSocket for real-time updates:

### Client → Server
- `subscribe` - Subscribe to update channels
- `redis:query` - Execute Redis query
- `players:search` - Search players
- `health:check` - Trigger health check

### Server → Client
- `dashboard:update` - Dashboard data update
- `health:update` - Health status update
- `metrics:update` - Metrics update
- `admin:event` - System event
- `health:alert` - Health alert

## Security Considerations

1. **Redis Queries**: Only whitelisted commands are allowed by default
2. **Authentication**: Enable `ADMIN_AUTH_ENABLED` for production
3. **CORS**: Configure allowed origins in production
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **HTTPS**: Use HTTPS in production environments

## Lunch & Learn Setup

The admin dashboard is essential for running successful lunch and learn sessions:

### Pre-Session Checklist
1. Start all engine instances
2. Verify Redis connectivity
3. Check system health (all green)
4. Clear old player data if needed
5. Test quest functionality

### During Session Monitoring
1. Monitor active player count
2. Watch for system alerts
3. Track quest completions
4. Monitor engine health
5. Check Redis performance

### Post-Session
1. Export leaderboard data
2. Save metrics for analysis
3. Review system events
4. Document any issues

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis is running: `redis-cli ping`
   - Verify REDIS_URL is correct
   - Check firewall settings

2. **Engines Show Offline**
   - Verify engine URLs in config
   - Check engine processes are running
   - Review engine logs

3. **High Memory Usage**
   - Check metrics history size
   - Clear old event logs
   - Review Redis memory usage

4. **WebSocket Disconnections**
   - Check network stability
   - Review proxy configurations
   - Increase timeout settings

## Development

### Project Structure
```
packages/admin/
├── src/
│   ├── index.ts              # Main server entry
│   ├── config.ts             # Configuration
│   ├── routes/               # API routes
│   ├── services/             # Core services
│   │   ├── AdminDashboardService.ts
│   │   ├── HealthMonitor.ts
│   │   ├── RedisQueryService.ts
│   │   ├── LeaderboardService.ts
│   │   └── SystemMetricsService.ts
│   └── websocket/            # WebSocket handlers
├── public/                   # Static files
│   ├── index.html           # Admin UI
│   └── js/
│       └── admin.js         # Client-side JavaScript
├── tests/                    # Test files
└── package.json
```

### Adding New Features

1. **New Service**: Create in `src/services/`
2. **New Route**: Add to `src/routes/index.ts`
3. **New WebSocket Event**: Update `src/websocket/index.ts`
4. **UI Update**: Modify `public/index.html` and `public/js/admin.js`

### Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Test specific service
npm test -- --testPathPattern=HealthMonitor
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Test in multi-engine setup
5. Verify WebSocket functionality

## License

Part of the myMCP project. See root LICENSE file. 