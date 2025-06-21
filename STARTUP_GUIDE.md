# myMCP System Startup Guide

## Prerequisites

Before starting the system, ensure you have:
1. Node.js 18+ installed
2. `.env` file configured with your Redis URL
3. All packages built (see Build Instructions below)

## Quick Start

### Unified System Startup
```bash
# Default configuration (no MCP server, 2 workers)
node tools/startup/start-full-system.js

# Use presets for common configurations:
PRESET=full node tools/startup/start-full-system.js     # All services including MCP
PRESET=minimal node tools/startup/start-full-system.js  # Just engine leader, no admin/MCP
PRESET=dev node tools/startup/start-full-system.js      # 1 worker + admin, no MCP

# Or customize with individual options:
ENGINE_WORKERS=3 ENABLE_MCP=true node tools/startup/start-full-system.js
```

**Available Presets:**
- `default`: Engine leader + 2 workers + admin dashboard (no MCP)
- `full`: Engine leader + 2 workers + admin + MCP server
- `minimal`: Just engine leader (no workers, admin, or MCP)
- `dev`: Engine leader + 1 worker + admin (no MCP)

**Customization Options:**
```bash
# Environment variables you can set:
ENGINE_WORKERS=3          # Number of worker engines (default: 2)
ENGINE_START_PORT=3001    # Starting port for engines (default: 3001)
ENABLE_MCP=true          # Enable MCP server (default: false)
ENABLE_ADMIN=false       # Disable admin dashboard (default: true)
ADMIN_PORT=4000          # Admin dashboard port (default: 3500)
PRESET=full              # Use a preset configuration
```

### Option 2: Individual Service Startup

Start services individually in separate terminals:

```bash
# Terminal 1: Start primary engine
cd packages/engine
npm start
# Or with custom port: PORT=3001 IS_PRIMARY=true npm start

# Terminal 2: Start Admin Dashboard
cd packages/admin
npm start

# Terminal 3: Start MCP Server
cd packages/mcpserver
npm start

# Optional: Start additional engine instances
cd packages/engine
PORT=3002 npm start
PORT=3003 npm start
```

## Build Instructions

If you haven't built the packages or made changes:

```bash
# Build all packages
npm run build

# Or build individual packages
npm run build --workspace=shared/types
npm run build --workspace=packages/engine
npm run build --workspace=packages/admin
npm run build --workspace=packages/mcpserver
```

## Verify System Status

### 1. Check Engine Health
```bash
curl http://localhost:3000/health
# or http://localhost:3001/health for multi-engine setup
```

### 2. Access Admin Dashboard
Open in browser: http://localhost:3500

### 3. Test with CLI
```bash
cd packages/cli
npm start
```

## Environment Configuration

Create a `.env` file in the project root:

```env
# Redis Configuration (required)
REDIS_URL=redis://your-redis-url-here

# Optional configurations
ENGINE_URL=http://localhost:3000
ADMIN_PORT=3500
NODE_ENV=development
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Redis Connection Issues
- Ensure Redis is running or `.env` has correct Redis URL
- Test connection: `redis-cli ping` (for local Redis)

### Build Errors
```bash
# Clean and rebuild
npm run clean
npm install
npm run build
```

### Check Logs
- Engine logs: Check terminal output
- Admin logs: Check terminal output
- Redis issues: Check connection errors in logs

## Stopping the System

### If started with start-full-system.js:
Press `Ctrl+C` in the terminal

### If started individually:
Press `Ctrl+C` in each terminal

### Force stop all services:
```bash
# Find all node processes
ps aux | grep node | grep -E "3000|3001|3002|3003|3500"

# Kill specific processes
kill <PID>

# Or kill all at once
pkill -f "node.*dist/index.js"
```

## System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Admin Dashboard│     │   MCP Server    │     │      CLI        │
│   Port: 3500    │     │   (Optional)   │     │   Interactive   │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                        │
         └───────────────────────┴────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
         ┌──────────▼──────────┐   ┌─────────▼──────────┐
         │   Engine (Leader)   │   │   Engine Workers   │
         │    Port: 3001       │   │  Ports: 3002-3003  │
         └──────────┬──────────┘   └─────────┬──────────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
                         ┌───────▼────────┐
                         │     Redis      │
                         │  (Shared DB)   │
                         └────────────────┘
```

### Leader vs Worker Engines

The engine architecture uses a leader/worker pattern:

- **Leader Engine** (`IS_PRIMARY=true`):
  - Handles quest catalog management
  - Manages global game state
  - Coordinates multiplayer features
  - Always runs on the first port (default: 3001)

- **Worker Engines**:
  - Handle player requests
  - Process game actions
  - Can scale horizontally for load distribution
  - Automatically assigned sequential ports

The leader is determined by the `IS_PRIMARY` environment variable, which is set to `true` for the first engine started by the startup scripts.

## Development Tips

1. **Use the shared Redis instance**: Configure in `.env` to avoid local Redis setup
2. **Start with minimal setup**: Just engine + admin for basic functionality
3. **Monitor health**: Admin dashboard shows real-time system status
4. **Check logs**: All services output detailed logs to terminal

## Common Commands

```bash
# Run tests
npm test

# Run integration tests (requires Redis)
npm run test:integration --workspace=packages/engine

# Clean everything
npm run clean
rm -rf node_modules package-lock.json
npm install

# Check what's running
lsof -i :3000,3001,3002,3003,3500
ps aux | grep node | grep dist
``` 