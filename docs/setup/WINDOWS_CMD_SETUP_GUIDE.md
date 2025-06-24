# 🪟 myMCP Windows CMD Setup Guide - Complete Walkthrough

> **A comprehensive guide for Windows users using Command Prompt (CMD) to get from zero to a working player dashboard**

## 📋 Prerequisites

Before starting, ensure you have:
- **Windows 10** or **Windows 11**
- **Administrator access** for software installation
- **Command Prompt (CMD)** - Available by default
- **Git for Windows** - [Download here](https://git-scm.com/download/win)
- **Node.js 18+** and **npm 9+** - [Download here](https://nodejs.org/)
- **Stable internet connection** for downloads and Redis setup

### Quick Prerequisites Check
```cmd
:: Check versions in Command Prompt
node --version    
:: Should be 18.0.0 or higher  
npm --version     
:: Should be 9.0.0 or higher
git --version     
:: Any recent version
echo %OS%         
:: Should show Windows_NT
```

---

## 🚀 Step 1: Install Required Software

### Install Git for Windows
```cmd
:: Download and install Git for Windows from https://git-scm.com/download/win
:: Choose "Use Git from the Windows Command Prompt" during installation
:: Verify installation
git --version
```

### Install Node.js
```cmd
:: Download LTS version from https://nodejs.org/
:: Run the installer with default settings
:: Verify installation
node --version
npm --version
```

### Configure Git (First Time Setup)
```cmd
:: Set your Git identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

:: Verify configuration
git config --list
```

---

## 📁 Step 2: Create Project Directory and Clone Repository

### Choose Your Location
```cmd
:: Navigate to a suitable directory (e.g., your user folder)
cd %USERPROFILE%
mkdir projects
cd projects

:: Alternative: Use C:\dev if you prefer
:: mkdir C:\dev
:: cd C:\dev
```

### Clone the Repository
```cmd
:: Clone myMCP repository
git clone https://github.com/jcaldwell1066/myMCP.git
cd myMCP

:: Verify you're in the right place
dir
:: You should see: package.json, packages\, docs\, tools\, etc.
```

**Expected Performance**: Git clone should complete in 5-10 seconds depending on your internet connection.

---

## 📦 Step 3: Install Dependencies

### Install All Dependencies
```cmd
:: Install all workspace dependencies
npm install

:: This will install dependencies for:
:: - Root workspace
:: - All packages\ subdirectories  
:: - All shared\ subdirectories

:: Wait for completion - this may take 3-5 minutes on Windows
echo Dependencies installed successfully
```

**⚠️ Windows-Specific Notes:**
- Windows Defender may scan `node_modules` during installation, slowing the process
- If installation seems stuck, temporarily disable real-time protection
- Large `node_modules` folder is normal (~200MB+ after installation)

---

## 🔧 Step 4: Configure Environment Variables

### Create Environment File
```cmd
:: Copy the example environment file
copy .env.example .env

:: Edit the .env file with Notepad
notepad .env

:: Or use VS Code if installed:
:: code .env
```

### Required Configuration
Edit the `.env` file with your configuration:

```env
# Redis Configuration (Choose one option below)
# Option 1: Local Redis (if installed)
REDIS_URL=redis://localhost:6379

# Option 2: Cloud Redis (recommended for beginners)
# REDIS_URL=redis://username:password@your-redis-host:6379

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

**💡 Pro Tip**: Save the file in Notepad by pressing `Ctrl+S`, then close Notepad.

---

## 🏗️ Step 5: Build All Packages

### Critical Build Order Fix
**🚨 IMPORTANT**: The standard `npm run build` will fail due to dependency ordering. Build shared packages first:

```cmd
:: Step 1: Build shared packages in correct order
npm run build --workspace=shared/types
npm run build --workspace=shared/config  
npm run build --workspace=shared/utils

:: Step 2: Now build all packages
npm run build

:: This will build:
:: - shared/types, shared/config, shared/utils
:: - packages/engine
:: - packages/cli
:: - packages/admin
:: - packages/mcpserver
:: - packages/player-dashboard
```

### Expected Build Results
- ✅ **Success**: engine, cli, admin, mcpserver, player-dashboard
- ❌ **May Fail**: slack-integration (TypeScript errors - skip for now)

**Note**: Slack integration build failures don't prevent core functionality.

### Alternative: Build with Verbose Output
```cmd
:: If you want to see detailed build output
npm run build --verbose

:: Or build workspaces individually if there are issues
npm run build --workspace=shared\types
npm run build --workspace=shared\config
npm run build --workspace=shared\utils
npm run build --workspace=packages\engine
npm run build --workspace=packages\player-dashboard
```

---

## ✅ Step 6: Verify Build Artifacts

### Check Required Dist Directories
```cmd
:: Verify shared packages built correctly
echo Checking shared packages...
dir shared\types\dist\
dir shared\config\dist\
dir shared\utils\dist\

:: Verify engine built correctly  
echo Checking engine build...
dir packages\engine\dist\

:: Check for key files
if exist shared\types\dist\index.js echo ✅ shared/types built
if exist shared\config\dist\index.js echo ✅ shared/config built  
if exist shared\utils\dist\index.js echo ✅ shared/utils built
if exist packages\engine\dist\index.js echo ✅ engine built
```

### What You Should See
Each `dist\` directory should contain:
- `index.js` - Compiled JavaScript
- `index.d.ts` - TypeScript type definitions
- `*.js.map` - Source maps
- Additional subdirectories with compiled modules

---

## 🔮 Step 7: Set Up Redis (Critical for Engine)

### The Challenge
The myMCP engine **requires Redis** for multiplayer features and will crash without it.

### Option 1: Cloud Redis (Recommended for Beginners)
```cmd
:: Sign up for a free Redis cloud service:
:: - Redis Cloud (redis.com) - 30MB free
:: - Upstash (upstash.com) - 10K requests/day free
:: - AWS ElastiCache (requires AWS account)

:: Update your .env file with the provided connection URL
notepad .env
:: Add line: REDIS_URL=redis://username:password@your-redis-host:6379
```

### Option 2: Local Redis with Docker (Intermediate)
```cmd
:: Install Docker Desktop for Windows from docker.com
:: After installation, run:
docker run -d -p 6379:6379 --name redis redis:latest

:: Verify Redis is running
docker ps
:: Should show redis container running on port 6379
```

### Option 3: Local Redis Installation (Advanced)
```cmd
:: Download Redis for Windows from:
:: https://github.com/microsoftarchive/redis/releases
:: Or use Windows Subsystem for Linux (WSL) for official Redis

:: Alternative: Use Memurai (Redis-compatible for Windows)
:: Download from: https://www.memurai.com/
```

### Verify Redis Connection
```cmd
:: Test Redis connection (if using local Redis)
:: Install redis-cli or use telnet
telnet localhost 6379
:: Type: ping
:: Should respond: PONG
```

---

## 🚀 Step 8: Start the Game Engine

### Open First Command Prompt Window
```cmd
:: Navigate to engine directory
cd packages\engine

:: Start the engine
npm start

:: You should see output like:
:: 🚀 myMCP Engine engine-3000 running on port 3000
:: ✅ Environment loaded successfully
:: ✅ Connected to Redis at: redis://[your-redis-host]:6379
:: 🌐 Server listening on port 3000
:: ⚡ WebSocket server ready
```

### Verify Engine is Running
Open a **new Command Prompt window** (`Win+R`, type `cmd`, press Enter) and test:

```cmd
:: Test engine health endpoint
curl http://localhost:3000/health

:: If curl is not available, use PowerShell:
powershell -Command "Invoke-RestMethod http://localhost:3000/health"

:: Expected response:
:: {"status":"healthy","timestamp":"2024-01-15T10:30:00.000Z","uptime":1234}

echo Engine is running and connected to Redis
```

**Windows Firewall Note**: Windows may ask for firewall permission - click "Allow" to permit local connections.

---

## 🎮 Step 9: Start the Player Dashboard

### Open Second Command Prompt Window
```cmd
:: Open a new Command Prompt window
:: Navigate back to project root, then to player dashboard
cd %USERPROFILE%\projects\myMCP\packages\player-dashboard
:: Replace with your actual path if different

:: Start the player dashboard
npm run dev

:: You should see output like:
:: 
::   VITE v5.0.0  ready in 500 ms
::
::   ➜  Local:   http://localhost:5173/
::   ➜  Network: http://192.168.1.100:5173/
::   ➜  press h to show help
```

---

## 🌐 Step 10: Access the Player Dashboard

### Open in Browser
```cmd
:: Open your default browser to the dashboard
start http://localhost:5173
:: Or manually navigate to http://localhost:5173 in any browser
```

### Verify Dashboard Connection
In your browser, you should see:
- ✅ **Player Dashboard** interface loads
- ✅ **Connection Status** shows "Connected" 
- ✅ **Engine Status** shows "Online"
- ✅ **Redis Status** shows "Connected"
- ✅ No console errors in browser developer tools

### Test Dashboard Functionality
Press `F12` in your browser to open developer tools. In the Console tab, you should see:
```
✅ WebSocket connected to ws://localhost:3000
✅ Engine health check passed
✅ Real-time connection established
```

---

## 🎯 Step 11: Verification Checklist

### System Status Check
```cmd
:: Check all services are running
echo System Status Check:

:: 1. Engine Health (PowerShell command)
powershell -Command "try { (Invoke-RestMethod http://localhost:3000/health).status } catch { 'Engine: Issues' }"

:: 2. Check running processes
tasklist /FI "IMAGENAME eq node.exe"
:: Should show Node.js processes for engine and dashboard

:: 3. Check open ports
netstat -an | findstr :3000
netstat -an | findstr :5173
:: Should show LISTENING on both ports

echo All services verified
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
```cmd
:: Command Prompt 1: Engine
cd packages\engine && npm start

:: Command Prompt 2: Player Dashboard  
cd packages\player-dashboard && npm run dev

:: Open Dashboard
start http://localhost:5173
```

### Stopping Services
```cmd
:: In each Command Prompt window, press:
Ctrl+C

:: Or kill processes from Task Manager
:: Look for Node.js processes and end them
```

### Rebuilding (if needed)
```cmd
npm run clean
npm install  
npm run build --workspace=shared\types
npm run build --workspace=shared\config
npm run build --workspace=shared\utils
npm run build
```

---

## 🚨 Troubleshooting Common Windows Issues

### Port Already in Use
```cmd
:: Find what's using port 3000
netstat -ano | findstr :3000

:: Kill the process (replace PID with actual process ID)
taskkill /F /PID <PID>

:: Or use a different port
set PORT=3001 && npm start
```

### Engine Won't Connect to Redis
```cmd
:: Check your .env file
type .env | findstr REDIS_URL

:: If using Docker, check container status
docker ps
docker logs redis

:: Check engine logs for specific error messages
```

### Dashboard Won't Load
```cmd
:: Check if Vite is running
tasklist | findstr node

:: Clear browser cache and reload
:: Or try incognito/private browsing mode

:: Check for CORS issues in browser console (F12)
```

### Build Failures
```cmd
:: Clean everything and start fresh
npm run clean
rmdir /S /Q node_modules
del package-lock.json
npm install
npm run build --workspace=shared\types
npm run build --workspace=shared\config
npm run build --workspace=shared\utils
npm run build

:: Check Node.js version
node --version
:: Should be 18+
```

### Windows Defender Issues
```cmd
:: If npm install is very slow:
:: 1. Open Windows Security
:: 2. Go to Virus & threat protection
:: 3. Add exclusion for your project folder
:: 4. Rerun npm install
```

### PowerShell Execution Policy
```cmd
:: If PowerShell scripts are blocked:
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser"
```

### File Path Too Long Errors
```cmd
:: If you get "file path too long" errors:
:: 1. Enable long paths in Windows
:: 2. Run as administrator:
powershell -Command "New-ItemProperty -Path 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name 'LongPathsEnabled' -Value 1 -PropertyType DWORD -Force"

:: 3. Restart Command Prompt
```

---

## 🎮 Quick Reference Commands

### Essential Startup Sequence
```cmd
:: 1. Start Redis (if using Docker)
docker start redis

:: 2. Terminal 1: Engine
cd packages\engine && npm start

:: 3. Terminal 2: Player Dashboard  
cd packages\player-dashboard && npm run dev

:: 4. Open Dashboard
start http://localhost:5173
```

### Development Workflow
```cmd
:: Clean rebuild (if needed)
npm run clean
npm install
npm run build --workspace=shared\types
npm run build --workspace=shared\config
npm run build --workspace=shared\utils
npm run build

:: Run tests
npm test

:: Check engine health
powershell -Command "Invoke-RestMethod http://localhost:3000/health"
```

### Windows-Specific Commands
```cmd
:: Check running services
tasklist | findstr node
netstat -an | findstr ":3000\|:5173"

:: Stop all Node processes (if needed)
taskkill /F /IM node.exe

:: Check Windows version
ver

:: Open project in File Explorer
explorer .
```

---

## 📊 Performance Expectations

Based on typical Windows development environments:

| Operation | Time | Notes |
|-----------|------|-------|
| Git clone | ~5-10s | Depends on internet speed |
| npm install | ~3-5min | Windows Defender may slow this |
| Full build | ~45s | After shared packages built |
| Engine startup | ~8s | Includes Redis connection |

**Windows-Specific Considerations**:
- Windows Defender real-time scanning affects `node_modules` performance
- File system operations are generally slower than Linux/macOS
- Multiple Command Prompt windows needed for concurrent services

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
- **[WSL Setup](WSL_SETUP_GUIDE_ENHANCED.md)** - Alternative Linux environment

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
```cmd
:: Health checks
powershell -Command "Invoke-RestMethod http://localhost:3000/health"
start http://localhost:5173

:: Windows-specific debugging
tasklist | findstr node
netstat -an | findstr ":3000\|:5173"

:: Useful development commands
npm run dev:engine    :: Engine with hot reload (if configured)
npm test              :: Run test suite
```

---

## 🎉 **Welcome to myMCP on Windows!**

You now have a fully functional player dashboard connected to the game engine and Redis instance, running natively on Windows. 

**What's Next?**
1. **Explore the dashboard** - Click around and see what's available
2. **Try the CLI** - Run `cd packages\cli && npm run shell` for interactive commands
3. **Start a quest** - Try the "Council of Three Realms" for your first adventure
4. **Join the team** - Coordinate with others using the multiplayer features

**Questions or Issues?**
- Check the troubleshooting section above
- Review the additional documentation links
- Open an issue in the repository
- Ask in your team's communication channel

**Happy adventuring on Windows!** 🪟⚡✨

---

*This guide was created for Windows users with Command Prompt. For macOS instructions, see [MACOS_SETUP_GUIDE.md](MACOS_SETUP_GUIDE.md). For WSL users, see [WSL_SETUP_GUIDE_ENHANCED.md](WSL_SETUP_GUIDE_ENHANCED.md).* 
