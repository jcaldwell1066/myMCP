# myMCP - Fantasy Chatbot System

> 🗡️ Transform mundane technical tasks into engaging fantasy adventures

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-orange.svg)](https://expressjs.com/)
[![LLM Ready](https://img.shields.io/badge/LLM-Anthropic%20%7C%20OpenAI-purple.svg)](packages/engine/)

A multi-interface fantasy-themed chatbot system that gamifies real-world skill development through epic quests. Features **LLM-powered conversations**, **MCP protocol support**, **Slack integration**, and **distributed multiplayer capabilities**.

## ✨ What Makes myMCP Special?

- 🤖 **AI-Powered Conversations** - Natural language interactions with Anthropic/OpenAI
- 🎮 **Gamified Learning** - Master real skills through fantasy quests
- 💬 **Slack Integration** - Play directly from Slack with team dashboards
- 🌟 **Multi-Interface** - CLI, Web, API, MCP protocol, and Slack
- ⚡ **Real-Time Multiplayer** - Redis-powered distributed architecture
- 🔧 **Production Ready** - Docker support, clean architecture, TypeScript

## 🚀 Quick Start (2 minutes)

### Prerequisites
- [Node.js 18+](https://nodejs.org/) and npm 9+
- Git for version control
- (Optional) Redis for multiplayer features
- (Optional) Anthropic/OpenAI API key for AI conversations

### Get Running
```bash
# 1. Clone and install
git clone <repository-url>
cd myMCP
npm install

# 2. (Optional) Set up AI - create .env in project root
echo "ANTHROPIC_API_KEY=your-key-here" > .env

# 3. Start the engine
node tools/startup/start-engine.js

# 4. In another terminal, start the interactive CLI
cd packages/cli && npm run shell
```

### Your First Adventure
```
Adventure> help                    # See available commands
Adventure> status                  # Check your character
Adventure> I want to start a quest # Natural language works!
Adventure> What should I do next?  # Ask your AI guide
```

## 🏗️ Project Structure (Reorganized!)

```
myMCP/
├── packages/              # Monorepo packages
│   ├── engine/           # 🎮 Game engine API (Express + WebSocket)
│   ├── cli/              # 🗡️ Interactive command-line interface
│   ├── mcpserver/        # 🤖 MCP protocol server
│   ├── slack-integration/# 💬 Slack bot and dashboards
│   └── webapp/           # 🌐 React web interface (planned)
├── tools/                # Development tools
│   ├── setup/           # Setup and installation scripts
│   ├── startup/         # Service startup scripts
│   ├── testing/         # Test utilities
│   └── assets/          # Icons and images
├── shared/              # Shared code
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Common utilities
│   └── config/          # Shared configuration
├── docs/                # Documentation
│   ├── setup/           # Setup guides
│   ├── integrations/    # Integration documentation
│   └── archive/         # Historical documents
└── tests/               # Test suites
```

## 🎭 LLM-Powered Fantasy System

### Natural Language Understanding
```bash
# Instead of memorizing commands...
Adventure> start-quest council-of-three-realms  # Old way

# Just speak naturally!
Adventure> I'd like to help unite the three kingdoms
Adventure> What quests are available for a novice like me?
Adventure> Tell me more about the Council quest
```

### Dynamic AI Responses
Your AI guide adapts based on:
- Current quest progress
- Player level and achievements
- Recent actions and context
- Natural conversation flow

### Supported LLM Providers
- **Anthropic Claude** (Recommended) - Best narrative quality
- **OpenAI GPT** - Alternative option
- **Fallback System** - Works without API keys

## 💬 Slack Integration

Transform your Slack workspace into a fantasy realm!

### Features
- 🎯 **Slash Commands** - `/mymcp status`, `/mymcp quest`, `/mymcp leaderboard`
- 📊 **Live Dashboard** - Auto-updating statistics in `#mymcp-dashboard`
- 🗨️ **Team Chat** - Coordinate quests in `#mymcp-game`
- 🏆 **Achievements** - Real-time notifications for level-ups and completions
- 📈 **Activity Charts** - Visual progress tracking

### Quick Setup
```bash
# 1. Build and configure
cd packages/slack-integration
npm install && npm run build
cp .env.example .env

# 2. Add your Slack tokens to .env
# 3. Start the integration
npm start
```

## 🌐 Multiplayer Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Player A  │     │   Player B  │     │   Player C  │
│  (Engine 1) │     │  (Engine 2) │     │  (Engine 3) │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┴───────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Redis    │
                    │   Pub/Sub   │
                    └──────┬──────┘
                           │
       ┌───────────────────┴───────────────────┐
       │                                       │
┌──────▼──────┐                         ┌──────▼──────┐
│    Slack    │                         │     MCP     │
│ Integration │                         │   Server    │
└─────────────┘                         └─────────────┘
```

## 📦 Core Components

| Component | Description | Status | Key Features |
|-----------|-------------|--------|--------------|
| **Engine** | Game state API | ✅ Complete | LLM integration, Redis pub/sub, WebSocket |
| **CLI** | Interactive shell | ✅ Complete | Natural language, real-time chat |
| **MCP Server** | AI model integration | ✅ Complete | 7 resources, 9 tools, 5 prompts |
| **Slack Bot** | Team integration | ✅ Complete | Dashboards, commands, notifications |
| **Web App** | Browser interface | 🚧 Planned | React, real-time updates |

## 🔧 Quick Reference

```bash
# Start services (from project root)
node tools/startup/start-engine.js      # Game engine
node tools/startup/start-mcp.js         # MCP server
node tools/startup/start-all.js         # Everything

# Development
cd packages/cli && npm run shell        # Interactive CLI
cd packages/slack-integration && npm start  # Slack bot

# Testing
node tools/testing/test-interface.js    # Test APIs
node tools/testing/test-engine-connection.js  # Check connectivity

# Setup & Configuration  
node tools/setup/setup-mcp.js          # Initial MCP setup
node tools/setup/team-setup.sh         # Team training setup
```

## 🚀 Getting Started Paths

### For Individual Developers
1. Clone repo and install dependencies
2. Add LLM API key to `.env`
3. Start engine and CLI
4. Begin your adventure!

### For Teams with Slack
1. Follow individual setup
2. Configure Slack integration
3. Create team channels
4. Share Redis connection
5. Coordinate quests together!

### For Claude Desktop Users
1. Run `node tools/setup/setup-mcp.js`
2. Configure Claude Desktop with generated config
3. Access game directly through Claude!

## 📚 Documentation

- **[🚀 Quick Start Guide](docs/QUICK_START.md)** - Get running in minutes
- **[💬 Slack Setup](docs/integrations/slack/README.md)** - Team integration
- **[🤖 MCP Integration](docs/integrations/mcp/README.md)** - AI model setup
- **[🌐 Multiplayer Guide](docs/multiplayer-setup.md)** - Distributed setup
- **[📖 Full Documentation](docs/README.md)** - Everything else

## 🧪 Testing Your Setup

```bash
# Check engine health
curl http://localhost:3000/health

# Test LLM integration
curl -X POST http://localhost:3000/api/actions/test-player \
  -H "Content-Type: application/json" \
  -d '{"type":"CHAT","payload":{"message":"Hello!"}}'

# Verify Redis connection (if using multiplayer)
redis-cli ping
```

## 🤝 Contributing

We welcome contributions! The codebase is now cleaner and more organized:

1. **No more cluttered root** - Tools organized in `tools/` directory
2. **Portable paths** - No hardcoded usernames or paths
3. **TypeScript throughout** - Type safety everywhere
4. **Clean architecture** - Clear separation of concerns

See [Contributing Guide](docs/CONTRIBUTING.md) for details.

## 🔒 Security Notes

- Never commit `.env` files or credentials
- Use `claude_desktop_config.example.json` as a template
- Redis URLs should use environment variables
- API keys should be kept private

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">

**Ready to begin your adventure?** 🗡️

[Get Started](docs/QUICK_START.md) • [Join Slack](docs/integrations/slack/) • [View Quests](docs/tasks/)

*Transform your technical journey into an epic adventure with AI!* ⚡✨

</div> 