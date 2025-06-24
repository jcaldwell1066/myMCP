# ⚡ Quick Setup Guide

> **Get myMCP running in 15 minutes or less**

## 🎯 **Choose Your Setup Level**

### 🥉 **Level 1: Basic Experience** *(5 minutes, zero local setup)*
**Perfect for:** Anyone who wants to see myMCP in action

**What you need:**
- Access to Slack workspace (if available)
- Web browser

**What you get:**
- View system in action through Slack integration
- See real-time game updates and notifications
- Try slash commands: `/mymcp status`, `/mymcp help`

---

### 🥈 **Level 2: Local Engine** *(15 minutes setup)*
**Perfect for:** Developers who want hands-on experience

**Prerequisites:**
- Node.js 18+ and npm 9+
- Git access
- Terminal/command prompt

**Setup:**
```bash
# 1. Clone and install
git clone <repository-url>
cd myMCP
npm install

# 2. (Optional) Configure environment - create .env in project root
echo "REDIS_URL=your-shared-redis-url" > .env

# 3. Build and start
npm run build
npm run start:engine

# 4. In another terminal, try the CLI
cd packages/cli && npm run shell
```

**Success check:**
```bash
curl http://localhost:3000/health
# Should return: {"status":"healthy",...}
```

---

### 🥇 **Level 3: AI-Powered** *(20 minutes setup)*
**Perfect for:** Full experience with AI conversations

**Additional requirements:**
- Anthropic API key OR OpenAI API key

**Additional steps:**
```bash
# Add to your .env file (choose one):
echo "ANTHROPIC_API_KEY=your-key-here" >> .env
# OR
echo "OPENAI_API_KEY=your-key-here" >> .env

# Restart your engine
npm run start:engine
```

**Success check:**
```bash
# Test AI conversation
npm run dev:cli -- chat "What quests are available?"
```

---

## 🚀 **Your First Adventure**

### Quick Commands to Try:
```bash
# Check your status
npm run dev:cli -- status

# Start interactive chat
npm run dev:cli -- chat -i

# Begin the Council quest
npm run dev:cli -- start-quest "Council of Three Realms"

# Check available quests  
npm run dev:cli -- quests
```

### Web Interface (Optional):
```bash
# Start the dashboard
cd packages/player-dashboard && npm run dev

# Open browser to: http://localhost:5173
```

---

## 🌟 **Available Quests**

1. **Council of Three Realms** - Learn timezone coordination
2. **Dungeon Keeper's Vigil** - Practice server monitoring  
3. **Cryptomancer's Seal** - Implement HMAC security

---

## 🚨 **Troubleshooting**

### "Port already in use"
```bash
# Find what's using port 3000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Use different port
PORT=3001 npm run start:engine
```

### "Engine not responding"
```bash
# Check if running
curl http://localhost:3000/health

# Restart if needed
npm run start:engine
```

### "Build errors"
```bash
# Clean rebuild
npm run clean && npm install && npm run build
```

---

## 📚 **Next Steps**

**For Development:**
- [Full macOS Setup](MACOS_SETUP_GUIDE.md) - Comprehensive guide
- [WSL Setup](WSL_SETUP.md) - Windows subsystem setup
- [Development Workflow](../DEVELOPMENT_WORKFLOW.md) - Contributing guidelines

**For Team Use:**
- [Slack Integration](../integrations/slack/README.md) - Team coordination
- [Admin Dashboard](../../packages/admin/README.md) - System monitoring
- [Multiplayer Setup](multiplayer-setup.md) - Distributed teams

**For Integration:**
- [MCP Integration](MCP_INTEGRATION.md) - Claude Desktop connection
- [API Documentation](../integrations/api/testing.md) - REST API reference

---

**Ready to begin your quest?** Try `npm run dev:cli -- start-quest` and choose your adventure! 🗡️✨ 