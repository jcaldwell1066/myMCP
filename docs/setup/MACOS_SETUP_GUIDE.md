# 🍎 myMCP macOS Setup Guide - Complete Walkthrough

> **A comprehensive guide for macOS users using Zsh to get from zero to a working player dashboard**

## 📋 Prerequisites

Before starting, ensure you have:
- **macOS** with **Zsh** (default on macOS 10.15+)
- **Node.js 18+** and **npm 9+** - [Download here](https://nodejs.org/)
- **Git** - Usually pre-installed, or install via Xcode Command Line Tools
- **Terminal** app or your preferred terminal emulator
- Access to a **shared Redis instance** (URL and credentials)

### Quick Prerequisites Check
```zsh
# Check versions
node --version    # Should be 18.0.0 or higher  
npm --version     # Should be 9.0.0 or higher
git --version     # Any recent version
echo $SHELL       # Should show /bin/zsh or /usr/bin/zsh
```

---

## 🚀 Step 1: Clone and Navigate to Repository

```zsh
# Clone the repository
git clone https://github.com/your-org/myMCP.git
# Replace with your actual repository URL

# Navigate to project directory
cd myMCP

# Verify you're in the right place
ls -la
# You should see: package.json, packages/, docs/, tools/, etc.
```

---

## 📦 Step 2: Install Dependencies

```zsh
# Install all workspace dependencies
npm install

# This will install dependencies for:
# - Root workspace
# - All packages/* subdirectories  
# - All shared/* subdirectories

# Wait for completion - this may take 2-3 minutes
echo "✅ Dependencies installed successfully"
```

---

## 🔧 Step 3: Configure Environment Variables

### Create Environment File
```zsh
# Copy the example environment file
cp env.example .env

# Open the .env file in your preferred editor
# Using nano (beginner-friendly):
nano .env

# Or using VS Code:
code .env

# Or using vim:
vim .env
```

### Required Configuration
Edit the `.env` file with your shared Redis details:

```env
# Redis Configuration (REQUIRED - Replace with your shared Redis)
REDIS_URL=redis://username:password@your-redis-host:6379

# Engine Configuration (Default is fine for local development)
ENGINE_URL=http://localhost:3000
VITE_ENGINE_URL=http://localhost:3000

# CORS Configuration (Default is fine for local development)
CORS_ORIGIN=http://localhost:3001,http://localhost:5173

# Node Environment
NODE_ENV=development

# Optional: LLM API Keys (for AI features)
# ANTHROPIC_API_KEY=your_anthropic_key_here
# OPENAI_API_KEY=your_openai_key_here
```

**💡 Pro Tip**: Save and close the editor:
- **Nano**: `Ctrl+X`, then `Y`, then `Enter`
- **VS Code**: `Cmd+S` to save, then close the tab
- **Vim**: `Esc`, then `:wq`, then `Enter`

### Verify Configuration
```zsh
# Check that your .env file was created correctly
cat .env | grep REDIS_URL
# Should show your Redis URL (with credentials obscured for security)

echo "✅ Environment configured successfully"
```

---

## 🏗️ Step 4: Build All Packages

### Build Everything
```zsh
# Build all packages in the workspace
npm run build

# This will build:
# - shared/types
# - shared/config  
# - shared/utils
# - packages/engine
# - packages/cli
# - packages/admin
# - packages/mcpserver
# - packages/slack-integration
# - packages/player-dashboard

# Wait for completion - this may take 1-2 minutes
echo "✅ All packages built successfully"
```

### Alternative: Build with Verbose Output
```zsh
# If you want to see detailed build output
npm run build --verbose

# Or build workspaces individually if there are issues
npm run build --workspace=shared/types
npm run build --workspace=shared/config
npm run build --workspace=shared/utils
npm run build --workspace=packages/engine
npm run build --workspace=packages/player-dashboard
```

---

## ✅ Step 5: Verify Build Artifacts

### Check Required Dist Directories
```zsh
# Verify shared packages built correctly
echo "🔍 Checking shared packages..."
ls -la shared/types/dist/
ls -la shared/config/dist/
ls -la shared/utils/dist/

# Verify engine built correctly  
echo "🔍 Checking engine build..."
ls -la packages/engine/dist/

# Check for key files
echo "🔍 Verifying key build artifacts..."
test -f shared/types/dist/index.js && echo "✅ shared/types built"
test -f shared/config/dist/index.js && echo "✅ shared/config built"  
test -f shared/utils/dist/index.js && echo "✅ shared/utils built"
test -f packages/engine/dist/index.js && echo "✅ engine built"
```

### What You Should See
Each `dist/` directory should contain:
- `index.js` - Compiled JavaScript
- `index.d.ts` - TypeScript type definitions
- `*.js.map` - Source maps
- Additional subdirectories with compiled modules

### Troubleshooting Build Issues
```zsh
# If any builds failed, try cleaning and rebuilding
npm run clean
npm install
npm run build

# Or check specific error messages
npm run build 2>&1 | grep -i error
```

---

## 🚀 Step 6: Start the Game Engine

### Open First Terminal Window
```zsh
# Navigate to engine directory
cd packages/engine

# Start the engine
npm start

# You should see output like:
# 🚀 myMCP Engine starting on port 3000
# ✅ Environment loaded successfully
# ✅ Connected to Redis at: redis://[your-redis-host]:6379
# 🌐 Server listening on port 3000
# ⚡ WebSocket server ready
```

### Verify Engine is Running
Open a **new terminal tab** (`Cmd+T`) and test:

```zsh
# Test engine health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"healthy","timestamp":"2024-01-15T10:30:00.000Z","uptime":1234}

# Test Redis connection
curl http://localhost:3000/api/health/redis

# Expected response:
# {"status":"connected","redis_status":"ready"}

echo "✅ Engine is running and connected to Redis"
```

---

## 🎮 Step 7: Start the Player Dashboard

### Open Second Terminal Window
```zsh
# Open a new terminal tab (Cmd+T) or window (Cmd+N)
# Navigate back to project root, then to player dashboard
cd ~/path/to/myMCP/packages/player-dashboard
# Replace ~/path/to/myMCP with your actual path

# Start the player dashboard
npm run dev

# You should see output like:
# 
#   VITE v5.0.0  ready in 500 ms
#
#   ➜  Local:   http://localhost:5173/
#   ➜  Network: http://192.168.1.100:5173/
#   ➜  press h to show help
```

---

## 🌐 Step 8: Access the Player Dashboard

### Open in Browser
```zsh
# Open your default browser to the dashboard
open http://localhost:5173
# Or manually navigate to http://localhost:5173 in any browser
```

### Verify Dashboard Connection
In your browser, you should see:
- ✅ **Player Dashboard** interface loads
- ✅ **Connection Status** shows "Connected" 
- ✅ **Engine Status** shows "Online"
- ✅ **Redis Status** shows "Connected"
- ✅ No console errors in browser developer tools

### Test Dashboard Functionality
```zsh
# In your browser's developer console (F12), you should see:
# ✅ WebSocket connected to ws://localhost:3000
# ✅ Engine health check passed
# ✅ Real-time connection established
```

---

## 🎯 Step 9: Verification Checklist

### System Status Check
```zsh
# Check all services are running
echo "🔍 System Status Check:"

# 1. Engine Health
curl -s http://localhost:3000/health | grep -q "healthy" && echo "✅ Engine: Healthy" || echo "❌ Engine: Issues"

# 2. Redis Connection  
curl -s http://localhost:3000/api/health/redis | grep -q "connected" && echo "✅ Redis: Connected" || echo "❌ Redis: Issues"

# 3. Player Dashboard
curl -s http://localhost:5173 | grep -q "Player Dashboard" && echo "✅ Dashboard: Running" || echo "❌ Dashboard: Issues"

# 4. Process Check
ps aux | grep -E "(node.*dist/index.js|vite)" | grep -v grep
echo "✅ All services verified"
```

### Final Verification Steps
1. ✅ **Engine running** on `http://localhost:3000`
2. ✅ **Redis connected** (check engine logs)
3. ✅ **Dashboard accessible** at `http://localhost:5173`
4. ✅ **Dashboard connects to engine** (check browser console)
5. ✅ **Real-time updates working** (dashboard shows live data)

---

## ⚡ Quick Commands Summary

### Starting Services
```zsh
# Terminal 1: Engine
cd packages/engine && npm start

# Terminal 2: Player Dashboard  
cd packages/player-dashboard && npm run dev

# Open Dashboard
open http://localhost:5173
```

### Stopping Services
```zsh
# In each terminal window, press:
Ctrl+C

# Or kill processes:
pkill -f "node.*dist/index.js"  # Kill engine
pkill -f "vite"                 # Kill dashboard
```

### Rebuilding (if needed)
```zsh
npm run clean
npm install  
npm run build
```

---

## 🚨 Troubleshooting Common Issues

### Port Already in Use
```zsh
# Find what's using port 3000
lsof -i :3000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

### Engine Won't Connect to Redis
```zsh
# Check your .env file
cat .env | grep REDIS_URL

# Test Redis connection manually (if you have redis-cli)
redis-cli -u "your-redis-url" ping
# Should return: PONG

# Check engine logs for specific error messages
```

### Dashboard Won't Load
```zsh
# Check if Vite is running
ps aux | grep vite

# Clear browser cache and reload
# Or try incognito/private browsing mode

# Check for CORS issues in browser console
```

### Build Failures
```zsh
# Clean everything and start fresh
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build

# Check Node.js version
node --version  # Should be 18+
```

---

## 📚 Next Steps & Additional Documentation

Now that you have the basic setup working, explore these additional resources:

### 🎮 **Game Features & Quests**
- **[Getting Started Guide](QUICK_SETUP.md)** - Learn about the fantasy quest system
- **[Team Demo Participation](../TEAM_DEMO_PARTICIPATION.md)** - Join collaborative adventures
- **[Quest System Documentation](../pocketFlow/myMCP-docs/01_quest_system_.md)** - Deep dive into quests

### 🔧 **Advanced Configuration**
- **[Full Startup Guide](../../STARTUP_GUIDE.md)** - Multi-engine setups and advanced configurations
- **[MCP Integration](MCP_INTEGRATION.md)** - Connect with Claude Desktop
- **[Multiplayer Setup](../multiplayer-setup.md)** - Distributed team coordination

### 💬 **Team Integration**
- **[Slack Integration](../integrations/slack/README.md)** - Add Slack bot for team coordination
- **[Admin Dashboard](../../packages/admin/README.md)** - Monitor system health and player activity
- **[API Documentation](../integrations/api/testing.md)** - Integrate with other systems

### 🏗️ **Development & Customization**
- **[Development Workflow](../DEVELOPMENT_WORKFLOW.md)** - Contributing and customization
- **[Architecture Overview](../pocketFlow/myMCP-docs/02_multi_interface_architecture_.md)** - System design
- **[Testing Guide](../integrations/api/testing.md)** - Running tests and validation

### 🛠️ **Utilities & Tools**
- **[CLI Commands](../../packages/cli/README.md)** - Interactive command-line interface
- **[Demo Setup](../../tools/demo-setup.js)** - Automated demo environment setup
- **[Testing Tools](../../tools/testing/)** - System diagnostics and debugging

### 🎯 **Quick References**
```zsh
# Health checks
curl http://localhost:3000/health           # Engine health
curl http://localhost:3000/api/health/redis # Redis connection
open http://localhost:5173                  # Player dashboard

# Logs and debugging  
tail -f ~/.mymcp-cli/logs/debug.log        # CLI logs
docker logs <redis-container>              # Redis logs (if using Docker)

# Useful development commands
npm run dev:engine                         # Engine with hot reload
npm run dev:cli                           # CLI in development mode
npm test                                  # Run test suite
```

---

## 🎉 **Welcome to myMCP!**

You now have a fully functional player dashboard connected to the game engine and shared Redis instance. 

**What's Next?**
1. **Explore the dashboard** - Click around and see what's available
2. **Try the CLI** - Run `cd packages/cli && npm run shell` for interactive commands
3. **Start a quest** - Try the "Council of Three Realms" for your first adventure
4. **Join the team** - Coordinate with others using the shared Redis instance

**Questions or Issues?**
- Check the troubleshooting section above
- Review the additional documentation links
- Open an issue in the repository
- Ask in your team's Slack channel

**Happy adventuring!** 🗡️✨

---

*This guide was created for macOS users with Zsh. For Windows CMD instructions, see the Windows setup guide. For WSL users, see [WSL_SETUP.md](WSL_SETUP.md).* 