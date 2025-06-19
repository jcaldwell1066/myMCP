# myMCP Multiplayer Setup Guide

This guide explains how to set up and run the distributed multiplayer system for myMCP.

## Architecture Overview

The multiplayer system consists of:
- **Multiple Engine Instances**: 1 primary and 3 worker engines (ports 3000-3003)
- **Redis Pub/Sub**: For cross-engine communication
- **Socket.IO**: For real-time client connections
- **Shared Game State**: Each engine maintains its own state but broadcasts updates

## Prerequisites

- Node.js 18+
- Docker (for Redis and multi-engine setup)
- Redis (can be run via Docker)

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. Build and start all services:
```bash
npm run dev:multiplayer:build
npm run dev:multiplayer
```

2. Stop all services:
```bash
npm run dev:multiplayer:down
```

### Option 2: Manual Setup

1. Start Redis:
```bash
npm run redis:start
```

2. Start the primary engine:
```bash
npm run dev:engine:primary
```

3. Start worker engines (in separate terminals):
```bash
npm run dev:engine:worker1
npm run dev:engine:worker2
npm run dev:engine:worker3
```

4. Stop Redis when done:
```bash
npm run redis:stop
```

## Testing the Multiplayer System

### Using the Web Demo

1. Open `examples/multiplayer-demo.html` in multiple browser windows
2. Select different engines from the dropdown
3. Try sending messages in the global chat
4. Watch as player presence updates across all windows

### Using the CLI

Connect different CLI instances to different engines:

```bash
# Terminal 1 - Connect to primary engine
cd packages/cli
ENGINE_URL=http://localhost:3000 node dist/index.js chat -i

# Terminal 2 - Connect to worker 1
cd packages/cli
ENGINE_URL=http://localhost:3001 node dist/index.js chat -i
```

### Using the MCP Server

The MCP server connects to the primary engine by default but is aware of the multiplayer setup:

```bash
ENGINE_URL=http://localhost:3000 MULTIPLAYER_MODE=true npm run dev:mcpserver
```

## API Endpoints

Each engine exposes a multiplayer status endpoint:

```bash
# Check multiplayer status
curl http://localhost:3000/api/multiplayer/status
```

## Features

### 🌐 Cross-Engine Communication
- Players connected to different engines can see each other
- Global chat messages are synchronized across all engines
- Quest progress is shared in real-time

### 🎮 Player Presence
- Online/offline status tracked across engines
- Player location updates broadcast to relevant players
- Session management with automatic cleanup

### 💬 Global Chat
- Messages sent to one engine appear on all engines
- System announcements can be broadcast globally
- Chat history maintained per session

### 📊 Shared Game State
- Each engine maintains its own persistent state
- Updates are broadcast via Redis pub/sub
- Automatic synchronization of player actions

## Configuration

### Environment Variables

```env
# Engine configuration
PORT=3000                    # Engine port
ENGINE_ID=engine-primary     # Unique engine identifier
IS_PRIMARY=true             # Primary engine flag
REDIS_URL=redis://localhost:6379

# Multiplayer features
MULTIPLAYER_MODE=true       # Enable multiplayer features
```

### CORS Settings

The engines are configured to accept connections from:
- http://localhost:3001-3003 (other engines)
- http://localhost:5173 (Vite dev server)
- Any local file:// URLs (for HTML demos)

## Troubleshooting

### Redis Connection Issues
- Ensure Redis is running: `docker ps | grep redis`
- Check Redis connectivity: `redis-cli ping`

### Socket.IO Connection Failed
- Verify CORS settings in engine configuration
- Check browser console for connection errors
- Ensure the selected engine is running

### Players Not Appearing
- Verify all engines are connected to the same Redis instance
- Check multiplayer status endpoint on each engine
- Ensure player identification is sent after connection

## Advanced Usage

### Scaling Beyond 4 Engines

1. Update `docker-compose.multiplayer.yml` to add more workers
2. Update the `peerEngines` array in MultiplayerService
3. Add new npm scripts for additional workers

### Custom Events

Add new event types in `MultiplayerService.ts`:

```typescript
// Subscribe to custom events
this.subClient.subscribe('game:custom:event');

// Publish custom events
this.publishEvent('game:custom:event', {
  type: 'CUSTOM_EVENT',
  data: { /* your data */ }
});
```

### Integration with External Services

The architecture supports integration with:
- Slack (via Slack Bolt SDK)
- Discord (via discord.js)
- Custom web applications
- Mobile apps via Socket.IO clients

## Performance Considerations

- Each engine handles its own subset of players
- Redis pub/sub is used for lightweight message passing
- Game state is persisted locally on each engine
- Consider using Redis Cluster for production deployments 