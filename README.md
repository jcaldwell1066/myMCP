# myMCP - Fantasy Chatbot System

> 🗡️ Transform mundane technical tasks into engaging fantasy adventures

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-orange.svg)](https://expressjs.com/)
[![Progress](https://img.shields.io/badge/Progress-43.75%25%20(7/16%20tasks)-brightgreen.svg)](docs/tasks/)

A multi-interface fantasy-themed chatbot system that gamifies real-world skill development through epic quests. Built with modern Node.js architecture featuring CLI, API, web components, **MCP protocol support**, and **distributed multiplayer capabilities**.

## ✨ What Makes myMCP Special?

- 🎮 **Gamified Learning** - Master real skills through fantasy quests
- 🏗️ **Modern Architecture** - TypeScript, Express.js, React, WebSocket
- 🌟 **Multi-Interface** - CLI, Web, API, and **full MCP protocol support**
- ⚡ **Real-Time Updates** - Live game state synchronization
- 🔧 **Cross-Platform** - Works on Windows, macOS, Linux, and WSL
- 🌐 **Multiplayer Ready** - Distributed engine architecture with Redis pub/sub
- 🤖 **AI-Powered** - Deep integration with Claude via MCP protocol

## 🚀 Quick Start (2 minutes)

### Prerequisites
- [Node.js 18+](https://nodejs.org/) and npm 9+
- Git for version control

### Get Running
```bash
# 1. Clone and install
git clone <repository-url>
cd myMCP
npm install

# 2. Start the engine (Terminal 1)
npm run dev:engine
# Wait for: 🚀 myMCP Engine running on port 3000

# 3. Start the CLI (Terminal 2)  
npm run dev:cli -- status
# You should see your fantasy player status!
```

### Your First Quest
```bash
# See available adventures
npm run dev:cli -- start-quest

# Start interactive chat
npm run dev:cli -- chat -i

# Check your progress
npm run dev:cli -- get-score
```

## 🎭 Fantasy Quest System

Transform technical learning through epic adventures:

| Quest | Real-World Skill | Fantasy Theme | Reward |
|-------|------------------|---------------|---------|
| **Council of Three Realms** | Timezone coordination & meeting scheduling | Unite allies across distant kingdoms | 100 pts + Council Seal |
| **Dungeon Keeper's Vigil** | Server monitoring & system health checks | Guardian of mystical computing crystals | 75 pts + Crystal Monitor |
| **Cryptomancer's Seal** | HMAC cryptographic implementation | Master arcane message authentication | 125 pts + HMAC Grimoire |

## 🏗️ System Architecture

```
    CLI Interface          Web Interface         MCP Protocol          External Apps
         │                      │                     │                     │
         ├─────────── HTTP/REST API & WebSocket ──────────────────────────┤
         │                      │                     │                     │
    ┌────▼────┐           ┌─────▼─────┐         ┌─────▼─────┐      ┌──────▼─────┐
    │ myMCP   │           │  myMCP    │         │  Enhanced │      │  Worker    │
    │   CLI   │◄─────────►│  Engine   │◄───────►│    MCP    │      │  Engines   │
    │         │           │ (Primary) │         │  Server   │      │  (1,2,3)   │
    └─────────┘           └─────┬─────┘         └───────────┘      └──────┬─────┘
                                │                                           │
                                ├────────────Redis Pub/Sub─────────────────┤
                                │                                           │
                           ┌────▼─────┐                               ┌─────▼─────┐
                           │   Game   │                               │Multiplayer│
                           │  State   │                               │   Sync    │
                           │ Storage  │                               │  Service  │
                           └──────────┘                               └───────────┘
```

## 📦 Core Components

| Component | Description | Status | Documentation |
|-----------|-------------|---------|---------------|
| **CLI** | Fantasy-themed command interface | ✅ Complete | [packages/cli/](packages/cli/) |
| **Engine** | Game state management API with multiplayer | ✅ Complete | [packages/engine/](packages/engine/) |
| **WebApp** | React frontend with chat | 🚧 Planned | [packages/webapp/](packages/webapp/) |
| **MCP Server** | Enhanced MCP protocol implementation | ✅ Complete | [packages/mcpserver/](packages/mcpserver/) |
| **Admin** | System monitoring dashboard | 🚧 Planned | [packages/admin/](packages/admin/) |

## 🎯 Current Progress: 43.75% Complete

### ✅ Phase 1: Foundation (Tasks 1-5) - COMPLETE
- [x] Organizational analysis and project planning
- [x] Multi-workspace Node.js project structure  
- [x] CLI with Commander.js and fantasy theming
- [x] Express.js engine with REST API and WebSocket
- [x] Cross-platform CLI-Engine integration

### 🚧 Phase 2: Core Features (Tasks 6-11) - IN PROGRESS
- [ ] Tab completion system for context-aware suggestions
- [ ] LLM API integration for dynamic narrative generation
- [ ] Fantasy theme pack with skinnable assets
- [ ] Implementation of all three quest frameworks

### ✅ Phase 3: Advanced Integration - BONUS COMPLETE
- [x] **Enhanced MCP Server** - Full protocol implementation with resources, tools, and prompts
- [x] **Multiplayer Architecture** - Distributed engines with Redis synchronization

## 🤖 MCP (Model Context Protocol) Integration

myMCP now features a comprehensive MCP server that enables Claude and other AI models to interact directly with the game engine.

### MCP Resources (8 endpoints)
- **Player Profile** - Stats, achievements, and progress
- **Quest Catalog** - Available, active, and completed quests
- **Game State** - Complete game world snapshot
- **Inventory** - Items and equipment management
- **Chat History** - Conversation tracking
- **World Map** - Locations and NPCs
- **System Health** - Engine monitoring
- **LLM Status** - AI provider information

### MCP Tools (12 functions)
- Quest management (start, complete steps, finish)
- Player actions (update profile, change location, set score)
- Chat interactions (send messages, get completions)
- Inventory management (use items)
- Full game state retrieval

### MCP Prompts (5 templates)
- Character creation with backstory generation
- Dynamic quest briefings
- Context-aware help
- Progress summaries
- Next action suggestions

## 🌐 Multiplayer Capabilities

myMCP now supports distributed multiplayer with the following features:

### Architecture
- **4 Engine Instances**: 1 primary + 3 workers (ports 3000-3003)
- **Redis Pub/Sub**: Cross-engine communication
- **Socket.IO**: Real-time client connections
- **Automatic Synchronization**: Player actions broadcast across engines

### Features
- 🌍 **Cross-Engine Play** - Players on different engines can interact
- 💬 **Global Chat** - Messages synchronized across all instances
- 👥 **Player Presence** - Real-time online/offline tracking
- 📊 **Shared State** - Quest progress visible to all players
- 🔄 **Automatic Failover** - Seamless experience if an engine goes down

### Quick Start - Multiplayer
```bash
# Using Docker Compose (recommended)
npm run dev:multiplayer:build
npm run dev:multiplayer

# Or manually start all services
npm run redis:start
npm run dev:engine:primary    # Terminal 1
npm run dev:engine:worker1    # Terminal 2
npm run dev:engine:worker2    # Terminal 3
npm run dev:engine:worker3    # Terminal 4
```

## 🔧 Development Commands

```bash
# Development servers
npm run dev:cli          # CLI with hot reload
npm run dev:engine       # Single engine API server  
npm run dev:mcpserver    # Enhanced MCP server
npm run dev:multiplayer  # Full multiplayer setup

# Building
npm run build            # Build all components
npm run clean            # Clean build artifacts

# Testing  
npm run test             # Run test suites
npm run lint             # Code linting
npm run lint:fix         # Auto-fix linting issues

# MCP Testing
cd packages/mcpserver
npm run test:enhanced    # Test MCP integration
```

## 📚 Documentation

- **[📖 Getting Started](docs/GETTING_STARTED.md)** - Complete setup guide
- **[📋 Documentation Index](docs/README.md)** - All documentation
- **[🎯 Task Details](docs/tasks/)** - Individual task specifications
- **[📊 Planning Documents](docs/planning/)** - Project analysis and strategy
- **[🤖 MCP Integration](packages/mcpserver/README-enhanced.md)** - Enhanced MCP server guide
- **[🌐 Multiplayer Setup](docs/multiplayer-setup.md)** - Distributed architecture guide
- **[🔧 API Reference](docs/API.md)** - Engine API documentation *(coming soon)*

## 🧪 Testing Your Setup

### Test Engine API
```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","message":"myMCP Engine is running strong!"}
```

### Test CLI Integration  
```bash
npm run dev:cli -- status
# Should show player status and engine connectivity
```

### Run Integration Tests
```bash
cd tests/api
node test-api.js        # API endpoint tests
node test-websocket.js  # WebSocket connection tests

cd packages/mcpserver
npm run test:enhanced   # MCP protocol tests
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Read the [Contributing Guide](docs/CONTRIBUTING.md)** *(coming soon)*
2. **Fork the repository** and create your feature branch
3. **Follow the development setup** in [Getting Started](docs/GETTING_STARTED.md)
4. **Make your changes** and add tests
5. **Submit a pull request** with a clear description

### Development Guidelines
- Use TypeScript for all new code
- Follow the existing fantasy theme and terminology
- Add tests for new functionality
- Update documentation for user-facing changes

## 🚨 Getting Help

- **📚 Check the [documentation](docs/)** first
- **🐛 Open an issue** for bugs or feature requests  
- **💬 Start a discussion** for questions or ideas
- **📧 Contact maintainers** for urgent issues

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">

**Ready to begin your adventure?** 🗡️

[Get Started](docs/GETTING_STARTED.md) • [View Quests](docs/tasks/) • [API Docs](docs/API.md) • [Contributing](docs/CONTRIBUTING.md)

*Transform your technical journey into an epic adventure!* ⚡✨

</div>