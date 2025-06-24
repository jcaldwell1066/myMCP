# myMCP Team Training Setup Guide

This guide will help you set up a distributed lunch and learn session where each team member runs their own local game engine while coordinating through Slack.

## Architecture Overview

```
6 Team Members (Local Engines) → Shared Redis (Cloud) → Slack Integration (Host)
```

Each participant runs their own game engine locally, but all engines connect to a shared Redis instance for state synchronization. One person hosts the Slack integration to provide team coordination.

## Prerequisites

- 6 team members with Node.js 18+ installed
- One shared Slack workspace
- One person designated as "host" for Slack integration
- 30 minutes for setup before the session

## Option 1: Using Free Cloud Redis (Recommended)

### Step 1: Create Free Redis Instance

The host should create a free Redis instance on one of these services:

**Redis Cloud (Recommended)**
1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Sign up for free tier (30MB free)
3. Create a new database
4. Copy the connection string: `redis://default:password@host:port`

**Alternative: Upstash**
1. Go to [Upstash](https://upstash.com/)
2. Create free Redis database (10K commands/day free)
3. Copy the Redis URL from dashboard

**Alternative: Railway**
1. Go to [Railway](https://railway.app/)
2. Deploy Redis from template
3. Get connection URL from settings

### Step 2: Prepare Environment File

Create a `.env.team` file to share with team:

```bash
# Shared Redis (from cloud provider)
REDIS_URL=redis://default:your-password@your-host.redis.com:12345

# Each person uses their own ENGINE_ID
ENGINE_ID=player-[name]  # e.g., player-alice, player-bob

# Slack webhook for notifications (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Step 3: Team Member Setup Script

Create this setup script for team members:

```bash
#!/bin/bash
# save as: team-setup.sh

echo "🎮 myMCP Team Training Setup"
echo "============================"

# Get player name
read -p "Enter your name (lowercase, no spaces): " PLAYER_NAME

# Create personal .env file
cat > .env << EOF
REDIS_URL=${REDIS_URL}
ENGINE_ID=player-${PLAYER_NAME}
PORT=3000
IS_PRIMARY=false
EOF

echo "✅ Created .env file for player-${PLAYER_NAME}"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

echo "✅ Setup complete! You're ready to start."
echo ""
echo "To start your engine, run:"
echo "  npm run dev:engine"
```

### Step 4: Slack Integration Setup (Host Only)

The host runs the Slack integration:

```bash
# Host creates Slack app (see docs/integrations/slack/README.md)
cd packages/slack-integration

# Create .env with cloud Redis
cat > .env << EOF
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_DEFAULT_CHANNEL=#mymcp-training
SLACK_DASHBOARD_CHANNEL=#mymcp-dashboard
REDIS_URL=redis://default:password@your-redis.com:12345
ENGINE_URL=http://localhost:3000
EOF

npm install
npm run dev
```

## Option 2: Local Redis with Ngrok Tunnels

If cloud Redis isn't available, use local Redis with tunnels:

### Step 1: Host Sets Up Redis

```bash
# Host machine only
docker run -d -p 6379:6379 --name training-redis redis:7-alpine

# Install ngrok
npm install -g ngrok

# Expose Redis
ngrok tcp 6379
# Copy the URL: tcp://0.tcp.ngrok.io:12345
```

### Step 2: Share Tunnel URL

Share the ngrok URL with team as `REDIS_URL`:
```
REDIS_URL=redis://0.tcp.ngrok.io:12345
```

## Training Session Structure

### Pre-Session (30 minutes before)

1. **Host Actions:**
   - Set up cloud Redis or local Redis + ngrok
   - Configure and start Slack integration
   - Create Slack channels: `#mymcp-training` and `#mymcp-dashboard`
   - Share `.env.team` template with Redis URL

2. **Team Members:**
   - Clone repository
   - Run team setup script
   - Test engine startup
   - Join Slack channels

### Session Agenda (1 hour)

#### 1. Introduction (10 minutes)
- Architecture overview
- How multiplayer synchronization works
- Slack integration features demo

#### 2. Individual Setup & Testing (15 minutes)
```bash
# Each participant
npm run dev:engine

# Test connection
curl http://localhost:3000/health

# Check multiplayer status
curl http://localhost:3000/api/multiplayer/status
```

#### 3. Collaborative Quest (20 minutes)
- Everyone starts the "Council of Three Realms" quest
- Use Slack to coordinate meeting times
- Complete quest steps together
- Watch real-time updates in Slack

#### 4. Team Challenges (10 minutes)
- Leaderboard competition
- Chat interactions
- Location-based puzzles

#### 5. Technical Deep Dive (5 minutes)
- Review Redis pub/sub patterns
- Discuss event broadcasting
- Q&A

## Slack Commands for Training

### Individual Commands
```
/mymcp status              # Check your status
/mymcp quest list          # See available quests
/mymcp chat Hello team!    # Send message to game
```

### Team Coordination
```
# In #mymcp-training channel
@myMCP Let's all meet at the forest
@myMCP Who has completed the first quest?
```

### Dashboard Monitoring
The `#mymcp-dashboard` channel shows:
- Total active players
- Real-time activity
- Achievement notifications

## Troubleshooting

### Common Issues

1. **"Cannot connect to Redis"**
   - Verify REDIS_URL is correct
   - Check if Redis is accessible from your network
   - Try `redis-cli -u $REDIS_URL ping`

2. **"Engine ID already in use"**
   - Each person needs unique ENGINE_ID
   - Use format: `player-yourname`

3. **"Slack bot not responding"**
   - Ensure bot is invited to channels
   - Check Slack integration logs on host

4. **"State not syncing"**
   - Verify all engines use same REDIS_URL
   - Check `curl http://localhost:3000/api/multiplayer/status`

### Debug Mode

Enable detailed logging:
```bash
DEBUG=* npm run dev:engine
```

## Post-Session Cleanup

### For Cloud Redis
- Keep free tier for future sessions
- Or delete database from provider dashboard

### For Local Redis
```bash
# Host machine
docker stop training-redis
docker rm training-redis
killall ngrok
```

## Alternative Architectures

### A. Hybrid Approach
- 3 people share one Redis (team A)
- 3 people share another Redis (team B)
- Cross-team interactions via Slack

### B. Fully Distributed
- Each person runs Redis locally
- No direct state sharing
- All coordination through Slack

### C. Classroom Mode
- One powerful host machine
- Runs all 6 engines on different ports
- Team members connect via web UI

## Tips for Success

1. **Test Day Before**
   - Host should test full setup
   - Share setup video/screenshots

2. **Buddy System**
   - Pair experienced/new developers
   - Use Slack threads for troubleshooting

3. **Prepared Scenarios**
   - Have specific quests ready
   - Create team challenges
   - Plan collaborative puzzles

4. **Recording**
   - Record Slack interactions
   - Capture dashboard screenshots
   - Document learnings

## Learning Objectives

By end of session, participants will understand:

1. **Distributed Systems**
   - Event-driven architecture
   - Pub/sub patterns
   - State synchronization

2. **Real-time Collaboration**
   - WebSocket connections
   - Event broadcasting
   - Conflict resolution

3. **Integration Patterns**
   - External service integration
   - Webhook handling
   - API orchestration

4. **Team Coordination**
   - Async communication
   - Shared state management
   - Collaborative problem solving

## Follow-Up Ideas

After the training:

1. **Hackathon Challenge**
   - Teams build new quests
   - Add Discord integration
   - Create custom Slack commands

2. **Production Deployment**
   - Deploy to cloud
   - Set up monitoring
   - Scale to more users

3. **Technical Blog Posts**
   - Architecture decisions
   - Lessons learned
   - Performance optimizations

## Resources

- [Redis Pub/Sub Docs](https://redis.io/docs/manual/pubsub/)
- [Slack API Docs](https://api.slack.com/)
- [Socket.IO Docs](https://socket.io/docs/)
- [myMCP Architecture](../README.md)

## Questions?

Host should be prepared to answer:
- How does state sync work?
- What happens if Redis goes down?
- How to handle conflicts?
- Can we add more integrations?
- How to scale beyond 6 players? 