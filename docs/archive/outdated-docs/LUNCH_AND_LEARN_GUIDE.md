# myMCP Admin Dashboard - Lunch & Learn Setup Guide

This guide will help you set up and use the Admin Dashboard for running successful myMCP lunch and learn sessions.

## Pre-Session Setup (30 minutes before)

### 1. System Requirements Check
```bash
# Verify Node.js version (should be 18+)
node --version

# Check Redis is installed
redis-cli --version

# Verify all packages are built
cd myMCP
npm run build:all
```

### 2. Start the Full System
```bash
# From the myMCP root directory
node tools/startup/start-full-system.js
```

This will start:
- Redis (if not already running)
- 3 Game Engines (1 leader, 2 workers)
- MCP Server
- Admin Dashboard

### 3. Verify System Health

1. Open the Admin Dashboard: http://localhost:3500
2. Check the Dashboard Overview:
   - **System Status**: Should show "healthy"
   - **Active Engines**: Should show "3/3"
   - **Redis Status**: Should show "Connected"

### 4. Pre-Session Checklist

Use the Admin Dashboard to verify:

- [ ] All engines are online (System Health → Engines)
- [ ] Redis connectivity is stable (latency < 50ms)
- [ ] No critical alerts in Event Log
- [ ] System resources are adequate (CPU < 50%, Memory < 70%)

### 5. Clear Previous Session Data (Optional)

If you want to start fresh:

```bash
# In Redis Console (Admin Dashboard → Redis Console)
FLUSHDB

# Or use the cleanup script
node packages/cli/cleanup-simple.js
```

## During the Session

### 1. Monitor Active Participants

**Dashboard Overview** shows:
- Total Players: Number of registered participants
- Active Players: Currently playing (active in last 5 minutes)
- Quests Completed: Real-time progress

### 2. Real-Time Monitoring

Keep these tabs open:

1. **Dashboard**: Overall system health and player stats
2. **System Health**: Watch for performance issues
3. **Event Log**: Monitor for errors or warnings

### 3. Common Issues & Quick Fixes

#### Player Can't Connect
1. Check **Engines** tab - ensure at least one is online
2. Verify player ID in **Players** tab
3. Check **Event Log** for connection errors

#### High Latency / Slow Response
1. Check **System Health** → CPU/Memory usage
2. Look at **Redis Console** → Stats for slow queries
3. Consider restarting the slowest engine

#### Quest Not Progressing
1. Search player in **Players** tab
2. Use **Redis Console** to check quest state:
   ```
   HGETALL game:quest:active:PLAYER_ID
   ```
3. Check **Event Log** for quest-related errors

### 4. Live Demonstrations

Use the Admin Dashboard to showcase:

1. **Leaderboard Updates**
   - Show real-time score changes
   - Highlight top performers
   - Export leaderboard for prizes

2. **System Scalability**
   - Show multiple engines handling load
   - Demonstrate failover (stop one engine)
   - Monitor resource usage under load

3. **Player Journey**
   - Track individual player progress
   - Show quest completion in real-time
   - Display inventory changes

## Post-Session

### 1. Export Session Data

1. **Export Leaderboard**:
   - Go to Leaderboard tab
   - Click Export → Choose format (CSV/JSON)
   - Save for session records

2. **Export Metrics**:
   - Go to Metrics tab
   - Export performance data
   - Useful for capacity planning

### 2. Generate Session Report

Collect from Admin Dashboard:
- Total participants
- Quests completed
- Average scores
- System performance metrics
- Any issues encountered

### 3. Clean Up (Optional)

```bash
# Stop all services
Ctrl+C in the terminal running start-full-system.js

# Or clean up data while keeping services running
node packages/cli/cleanup-players.js
```

## Tips for Success

### 1. Browser Setup
- Use Chrome/Firefox for best WebSocket support
- Keep Admin Dashboard in a separate window
- Use multiple monitors if available

### 2. Performance Optimization
- Close unnecessary browser tabs
- Ensure good network connectivity
- Have Redis running on SSD if possible

### 3. Backup Plans
- Know how to restart individual services
- Have manual Redis commands ready
- Keep the start-up scripts handy

### 4. Engagement Features
- Project the leaderboard on a screen
- Announce milestones (first quest completed, etc.)
- Use event log to narrate interesting moments

## Advanced Features

### 1. Custom Queries
Save frequently used Redis queries in the console:
- Player progress checks
- Quest statistics
- Performance metrics

### 2. Real-time Alerts
Set up thresholds in config:
```javascript
alertThresholds: {
  cpuUsage: 80,
  memoryUsage: 85,
  redisLatency: 100,
  engineResponseTime: 500
}
```

### 3. Multi-Engine Scenarios
Demonstrate:
- Load balancing across engines
- Failover handling
- Scaling up/down engines

## Troubleshooting Commands

Quick Redis commands for the console:

```bash
# Check all players
SMEMBERS game:players

# Get player state
HGETALL game:state:PLAYER_ID

# Check active quests
KEYS game:quest:active:*

# Monitor Redis in real-time
MONITOR  # (Use sparingly - high overhead)

# Get Redis stats
INFO stats
```

## Session Templates

### 30-Minute Quick Session
1. 5 min: Introduction and setup verification
2. 20 min: Gameplay with live monitoring
3. 5 min: Leaderboard review and wrap-up

### 60-Minute Full Session
1. 10 min: System overview using Admin Dashboard
2. 40 min: Gameplay with demonstrations
3. 5 min: Performance analysis
4. 5 min: Q&A with live system exploration

### 90-Minute Workshop
1. 15 min: Architecture overview with Admin Dashboard
2. 30 min: First quest phase
3. 15 min: Break with leaderboard review
4. 25 min: Advanced quests
5. 5 min: Final scores and session data export

## Emergency Procedures

If something goes wrong:

1. **System Crash**: Run `node tools/startup/start-full-system.js` again
2. **Redis Issues**: `redis-cli PING` to test, restart Redis if needed
3. **Engine Failure**: Individual engines can be restarted without stopping others
4. **Data Corruption**: Use Redis Console to manually fix player states

Remember: The Admin Dashboard is your command center. Keep it open and monitor actively for the best session experience! 