# 🪟🐧 myMCP WSL Setup Guide - Complete Walkthrough

> **A comprehensive guide for Windows users to set up myMCP in Windows Subsystem for Linux**  
> *Based on live testing and quest validation in WSL2 Ubuntu 24.04*

## 🎯 **Quest Overview: The Dual-Realm Gateway**

**Fantasy Story**: Master the ancient art of bridging the Windows Kingdom and the Linux Realm through the mystical WSL Gateway, awakening the myMCP spirits across both worlds.

**Real Objective**: Set up a complete myMCP development environment in WSL that actually works.

---

## 📋 **Prerequisites**

### Windows Requirements
- **Windows 10** version 2004+ or **Windows 11**
- **WSL2** enabled and configured
- **Ubuntu 20.04+** or **Ubuntu 24.04** (recommended)
- Administrator access for package installation

### Essential Tools (Usually Pre-installed)
- **Node.js 18+** and **npm 9+**
- **Git** 
- **Terminal** access

### Quick Prerequisites Check
```bash
# Check versions in WSL
node --version    # Should be 18.0.0 or higher  
npm --version     # Should be 9.0.0 or higher
git --version     # Any recent version
uname -a          # Should show WSL2 kernel
```

---

## 🚀 **Stage 1: WSL Environment Setup**

### Verify WSL2 Installation
```bash
# Check WSL version and distribution
wsl --list --verbose
uname -a    # Should show: microsoft-standard-WSL2
```

### Install Missing Tools (if needed)
```bash
# Update package list
sudo apt update

# Install Node.js (if not present)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Git (if not present)
sudo apt-get install -y git

# Verify installation
node --version && npm --version && git --version
```

---

## ⚔️ **Stage 2: Repository Summoning**

### Clone the Repository
```bash
# Choose your location (home directory recommended)
cd ~
mkdir -p projects && cd projects

# Clone myMCP repository
time git clone https://github.com/jcaldwell1066/myMCP.git
cd myMCP

# Verify clone success
ls -la
```

**Expected Performance**: Git clone completes in ~2-3 seconds for this repository size.

---

## 🏗️ **Stage 3: The Dependency Forge**

### Install Dependencies
```bash
# Install all npm dependencies (this takes ~1 minute)
time npm install

# You may see some deprecation warnings - this is normal
```

### Critical Build Order Fix
**🚨 IMPORTANT**: The standard `npm run build` will fail due to dependency ordering. Build shared packages first:

```bash
# Step 1: Build shared packages in correct order
npm run build --workspace=shared/types
npm run build --workspace=shared/config  
npm run build --workspace=shared/utils

# Step 2: Now build all packages
npm run build
```

### Expected Build Results
- ✅ **Success**: engine, cli, admin, mcpserver, player-dashboard
- ❌ **May Fail**: slack-integration (TypeScript errors - skip for now)

**Note**: Slack integration build failures don't prevent core functionality.

---

## 🔮 **Stage 4: The Redis Realm** *(Critical for Engine)*

### The Challenge
The myMCP engine **requires Redis** for multiplayer features and will crash without it.

### Solution Option 1: Local Redis (Recommended for Development)
```bash
# Install Redis server
sudo apt update
sudo apt install -y redis-server

# Start Redis service
sudo service redis-server start

# Verify Redis is running
redis-cli ping    # Should return: PONG

# Optional: Set Redis to start automatically
sudo systemctl enable redis-server
```

### Solution Option 2: Cloud Redis (For Production)
Create a `.env` file with cloud Redis credentials:
```bash
# Copy environment template
cp .env.example .env

# Edit .env file and add your Redis URL
nano .env
# Add line: REDIS_URL=redis://username:password@your-redis-host:6379
```

### Solution Option 3: Single-Player Mode
For development without multiplayer features, you can modify the engine to make Redis optional (advanced users).

---

## 🚀 **Stage 5: Engine Awakening**

### Start the myMCP Engine
```bash
# From project root
npm run start --workspace=packages/engine

# Or navigate to engine directory
cd packages/engine && npm start
```

### Verify Success
You should see:
```
🚀 myMCP Engine engine-3000 running on port 3000
🏥 Health check: http://localhost:3000/health
🎮 Game states: 41 loaded
⚡ Ready for multiplayer action!
```

### Test the Engine
```bash
# In another terminal window
curl http://localhost:3000/health
# Should return JSON with status: "healthy"
```

---

## 🌟 **Stage 6: Portal Testing**

### Test the CLI Interface
```bash
# Start the interactive CLI
cd packages/cli && npm run shell

# Or run quick commands
npm run dev:cli status
npm run dev:cli chat "Hello myMCP!"
```

### Test the Web Dashboard (Optional)
```bash
# Start the player dashboard
cd packages/player-dashboard && npm run dev

# Access at: http://localhost:5173
```

---

## 📜 **Stage 7: Contribution Mastery**

### Set Up Development Workflow
```bash
# Check current git configuration
git config --list

# Configure git for contributions (if needed)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Create development branch
git checkout -b feature/my-awesome-feature

# Make changes and commit
git add .
git commit -m "feat: my awesome contribution"
```

### Development Commands
```bash
# Run tests
npm test

# Run specific package tests
npm run test --workspace=packages/engine

# Development mode with hot reload
npm run dev --workspace=packages/engine
```

---

## 🚨 **Common Issues & Solutions**

### Issue: Build Fails with Type Errors
```bash
Error: Output file '@mymcp/types' has not been built
```
**Solution**: Build shared packages first (see Stage 3)

### Issue: Engine Crashes with Redis Error
```bash
Error: connect ECONNREFUSED 127.0.0.1:6379
```
**Solution**: Install and start Redis (see Stage 4)

### Issue: Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000
# Kill the process or use different port
PORT=3001 npm run start --workspace=packages/engine
```

### Issue: npm install Takes Forever
- WSL I/O can be slower than native Linux
- Consider using npm cache or moving project to Linux filesystem
- Performance is acceptable (~60 seconds for full install)

### Issue: Permission Errors
```bash
# Fix npm permissions (if needed)
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) node_modules
```

---

## 🎮 **Quick Reference Commands**

### Essential Startup Sequence
```bash
# 1. Navigate to project
cd ~/projects/myMCP

# 2. Start Redis (if not running)
sudo service redis-server start

# 3. Start engine
npm run start --workspace=packages/engine

# 4. In new terminal: Start CLI
cd packages/cli && npm run shell
```

### Development Workflow
```bash
# Clean rebuild (if needed)
npm run clean
npm install
npm run build --workspace=shared/types
npm run build --workspace=shared/config
npm run build --workspace=shared/utils
npm run build

# Run tests
npm test

# Check engine health
curl http://localhost:3000/health
```

---

## 🏆 **Success Criteria**

You've successfully completed the WSL setup when:

- ✅ **Repository cloned** and dependencies installed
- ✅ **Shared packages built** in correct order
- ✅ **Redis running** and accessible
- ✅ **Engine starts** without crashing
- ✅ **Health endpoint** returns JSON response
- ✅ **CLI interface** responds to commands
- ✅ **Ready for development** and contributions

---

## 📊 **Performance Expectations**

Based on live testing in WSL2 Ubuntu 24.04:

| Operation | Time | Notes |
|-----------|------|-------|
| Git clone | ~2.4s | Excellent performance |
| npm install | ~60s | Normal for this project size |
| Full build | ~30s | After shared packages built |
| Engine startup | ~5s | Fast startup time |

---

## 🎯 **Next Steps**

### Explore myMCP Features
- **[Getting Started Guide](QUICK_SETUP.md)** - Learn the quest system
- **[CLI Commands](../../packages/cli/README.md)** - Interactive interface
- **[Admin Dashboard](../../packages/admin/README.md)** - System monitoring

### Join the Adventure
- **Try the Council of Three Realms quest** - Learn timezone coordination
- **Set up Slack integration** - Team collaboration
- **Contribute improvements** - Help make the guide even better

---

## 🛠️ **Troubleshooting Resources**

- **System Health**: `curl http://localhost:3000/health`
- **Redis Status**: `redis-cli ping`
- **Process Check**: `ps aux | grep node`
- **Port Usage**: `lsof -i :3000`
- **Logs**: Engine outputs detailed logs to console

---

**Congratulations! You've mastered the Dual-Realm Gateway and can now wield myMCP across both Windows and Linux!** 🪟🐧✨

*This guide was created through live testing and validation in WSL2 Ubuntu 24.04. Issues discovered during testing were used to improve the documentation accuracy.* 