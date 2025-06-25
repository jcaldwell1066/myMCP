# Getting Started with myMCP

Welcome to myMCP - a multi-interface fantasy chatbot system that transforms mundane technical tasks into engaging adventures!

## 🎯 What is myMCP?

myMCP is a comprehensive chatbot platform featuring:
- **Fantasy-themed CLI** with interactive quest system
- **Game state management engine** with REST API and WebSocket support
- **Real-world skill development** disguised as fantasy adventures
- **Multi-interface architecture** (CLI, Web, MCP protocol)

## ⚡ Quick Start (5 minutes)

### Prerequisites
- **Node.js 18+** and **npm 9+**
- **Git** for version control
- **Terminal/Command Prompt** access

### 1. Clone and Setup
```bash
git clone <repository-url>
cd myMCP
npm install
```

### 2. Start the Engine
```bash
npm run dev:engine
```
Wait for: `🚀 myMCP Engine running on port 3000`

### 3. Start the CLI (New Terminal)
```bash
npm run dev:cli -- status
```

You should see your player status and fantasy-themed interface!

## 🎮 Your First Adventure

### Check Your Status
```bash
npm run dev:cli -- status
```

### Start an Interactive Chat
```bash
npm run dev:cli -- chat -i
```

### Begin a Quest
```bash
npm run dev:cli -- start-quest
# Choose from: Council of Three Realms, Dungeon Keeper's Vigil, or Cryptomancer's Seal
```

### Set Your Score (Demo)
```bash
npm run dev:cli -- set-score 150
npm run dev:cli -- get-score
```

## 🏗️ Development Setup

### Project Structure
```
myMCP/
├── packages/
│   ├── cli/          # Command-line interface
│   ├── engine/       # Game state management API
│   ├── webapp/       # React frontend (future)
│   ├── mcpserver/    # MCP protocol server (future)
│   └── admin/        # System monitoring (future)
├── shared/
│   └── types/        # TypeScript type definitions
├── docs/             # Documentation
├── tests/            # Integration tests
└── scripts/          # Build and utility scripts
```

### Development Commands
```bash
# Start specific components
npm run dev:cli       # CLI development mode
npm run dev:engine    # Engine development mode
npm run dev:webapp    # WebApp development mode

# Build everything
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## 🔧 Configuration

### CLI Configuration
```bash
npm run dev:cli -- config show          # View current settings
npm run dev:cli -- config engineUrl <url>  # Change engine URL
npm run dev:cli -- config timeout 10000    # Set API timeout
```

### Engine Configuration
The engine runs on `http://localhost:3000` by default. Configuration options:
- `PORT` environment variable for different port
- Game state stored in `packages/engine/data/game-states.json`

## 🧪 Testing Your Setup

### Test Engine API
```bash
curl http://localhost:3000/health
```
Should return: `{"status":"ok","message":"myMCP Engine is running strong!"}`

### Test CLI Commands
```bash
npm run dev:cli -- status      # Player status
npm run dev:cli -- quests      # Available adventures
npm run dev:cli -- history     # Conversation log
```

## 🎭 Fantasy Quest System

### Three Available Quests:

1. **Council of Three Realms**
   - **Real Skill**: Timezone coordination and meeting scheduling
   - **Fantasy Theme**: Unite allies from distant kingdoms
   - **Reward**: 100 points + Council Seal

2. **Dungeon Keeper's Vigil**
   - **Real Skill**: Server monitoring and system health checks
   - **Fantasy Theme**: Guardian of mystical computing crystals
   - **Reward**: 75 points + Crystal Monitor

3. **Cryptomancer's Seal**
   - **Real Skill**: HMAC cryptographic implementation
   - **Fantasy Theme**: Master the arcane arts of message authentication
   - **Reward**: 125 points + HMAC Grimoire

## 🚨 Troubleshooting

### CLI Can't Connect to Engine
```
🚨 Cannot connect to myMCP Engine!
   Make sure the engine is running: cd packages/engine && npm start
```
**Solution**: Start the engine first with `npm run dev:engine`

### TypeScript Compilation Errors
**Solution**: 
```bash
cd shared/types && npm run build
npm run build
```

### Port Already in Use
**Solution**: 
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill the process or use different port
PORT=3001 npm run dev:engine
```

### Cross-Platform Path Issues
**Solution**: The CLI automatically handles Windows/WSL path differences. Config is stored in project-relative `.mymcp-cli/` directory.

## 📚 Next Steps

- **Explore the API**: Visit [API Documentation](API.md)
- **Contribute**: Read [Contributing Guidelines](CONTRIBUTING.md)
- **Advanced Usage**: Check [examples/](../examples/) directory
- **Architecture**: Understand the system in [ARCHITECTURE.md](ARCHITECTURE.md)

## 🆘 Getting Help

- **Documentation**: Browse [docs/](../docs/) directory
- **Issues**: Open a GitHub issue for bugs or feature requests
- **API Reference**: Check engine's `/health` and `/api/debug` endpoints
- **Examples**: See [examples/](../examples/) for usage patterns

---

**Ready to begin your adventure?** Start with `npm run dev:cli -- start-quest` and choose your first quest! 🗡️✨