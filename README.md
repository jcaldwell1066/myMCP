# myMCP - Fantasy Chatbot System

> 🗡️ Transform mundane technical tasks into engaging fantasy adventures

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.18+-orange.svg)](https://expressjs.com/)
[![Progress](https://img.shields.io/badge/Progress-31.25%25%20(5/16%20tasks)-brightgreen.svg)](docs/tasks/)

A multi-interface fantasy-themed chatbot system that gamifies real-world skill development through epic quests. Built with modern Node.js architecture featuring CLI, API, and web components.

## ✨ What Makes myMCP Special?

- 🎮 **Gamified Learning** - Master real skills through fantasy quests
- 🏗️ **Modern Architecture** - TypeScript, Express.js, React, WebSocket
- 🌟 **Multi-Interface** - CLI, Web, API, and MCP protocol support
- ⚡ **Real-Time Updates** - Live game state synchronization
- 🔧 **Cross-Platform** - Works on Windows, macOS, Linux, and WSL

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
    CLI Interface          Web Interface         MCP Protocol
         │                      │                     │
         ├─────────── HTTP/REST API ───────────────────┤
         │                      │                     │
    ┌────▼────┐           ┌─────▼─────┐         ┌─────▼─────┐
    │ myMCP   │           │  myMCP    │         │  myMCP    │
    │   CLI   │◄─────────►│  Engine   │◄───────►│  Server   │
    │         │           │  (API)    │         │          │
    └─────────┘           └───┬───────┘         └───────────┘
                              │
                         ┌────▼─────┐
                         │   Game   │
                         │  State   │
                         │ Storage  │
                         └──────────┘
```

## 📦 Core Components

| Component | Description | Status | Documentation |
|-----------|-------------|---------|---------------|
| **CLI** | Fantasy-themed command interface | ✅ Complete | [packages/cli/](packages/cli/) |
| **Engine** | Game state management API | ✅ Complete | [packages/engine/](packages/engine/) |
| **WebApp** | React frontend with chat | 🚧 Planned | [packages/webapp/](packages/webapp/) |
| **MCP Server** | MCP protocol implementation | 🚧 Planned | [packages/mcpserver/](packages/mcpserver/) |
| **Admin** | System monitoring dashboard | 🚧 Planned | [packages/admin/](packages/admin/) |

## 🎯 Current Progress: 31.25% Complete

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

### 📅 Phase 3: Interfaces (Tasks 12-16) - PLANNED
- [ ] React webapp with chat interface
- [ ] Admin dashboard for system monitoring
- [ ] MCP protocol server implementation
- [ ] Full system integration testing
- [ ] Demo preparation and polish

## 🔧 Development Commands

```bash
# Development servers
npm run dev:cli       # CLI with hot reload
npm run dev:engine    # Engine API server  
npm run dev:webapp    # React webapp (future)

# Building
npm run build         # Build all components
npm run clean         # Clean build artifacts

# Testing  
npm run test          # Run test suites
npm run lint          # Code linting
npm run lint:fix      # Auto-fix linting issues
```

## 📚 Documentation

- **[📖 Getting Started](docs/GETTING_STARTED.md)** - Complete setup guide
- **[📋 Documentation Index](docs/README.md)** - All documentation
- **[🎯 Task Details](docs/tasks/)** - Individual task specifications
- **[📊 Planning Documents](docs/planning/)** - Project analysis and strategy
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

## Quest 1: 🧭 Council of Three Realms
**Goal**: Synchronize three players for an initial shared session.
### Theme
```log
🔮 Chapter 1: Preparing for the Quest
Configuration Enchantments
🎯 Objective: Prepare the configuration for launching the app.
📜 Narrative: In the dark halls of the Merchant Sanctum, the adventurer gathers sacred parameters and configures their incantations.
🛠️ Mechanics: Ensure engine and at leasat one of cli, webapp, or mcpserver are configured.
📂 Artifact: global_meeting.json
🏆 Victory Condition: Validated test config + item total check: 8.00 + 9.50 + 2.50 = 20.00
🖼 Placeholder Image: Blueprint scroll with glowing inputs and tax symbols
```
> > “Summon the council by aligning the celestial clocks of three realms.”
### Mechanics
- Invite 2+ teammates.
- Propose and confirm a meeting time.
- Unlock the meeting portal
- (e.g., shared calendar, virtual meeting, Discord room).
### Optional NPC: Oracle of Echoes
- Responds with riddle-like time zone translations or commentary on delay.
```ts
  quests: {
      available: [
        {
          id: 'global-meeting',
          title: 'Council of Three Realms',
          description: 'Unite allies from distant kingdoms to coordinate a grand council meeting.',
          realWorldSkill: 'Timezone coordination and meeting scheduling',
          fantasyTheme: 'Gathering allies across distant realms',
          status: 'available',
          steps: [
            {
              id: 'find-allies',
              description: 'Locate suitable allies in different time zones',
              completed: false,
            },
            {
              id: 'coordinate-meeting',
              description: 'Find optimal meeting time for all parties',
              completed: false,
            },
            {
              id: 'confirm-attendance',
              description: 'Confirm all allies can attend the council',
              completed: false,
            },
          ],
          reward: {
            score: 100,
            items: ['Council Seal', 'Diplomatic Medallion'],
          },
        },
```


## Quest 2: 🧪 Dungeon Keeper’s Vigil
**Goal**: Introduce check-in culture and shared awareness of system/team/self.
### Theme
```log
Purpose: Foster personal/team/system check-ins
📜 Fantasy Theme: “Inspect the crystals of uptime deep in the Server Caverns.”
💼 Skill: Monitoring, health checks, emotional well-being
🎯 Objectives:
Enter server dungeon (trigger /api/state)
Check all 3 crystals (system, team, self)
Report to guild (chat or WebSocket broadcast)
🔮 LLM Option: Glynn comments on each check (“Your core temperature is stable, knight.”)
```
> > “Inspect the crystals of uptime deep in the Server Caverns.”
### Mechanics
- Visit `/api/state` or your monitoring dashboard.
- Log a message for each of the three check types:
- ✅ System health (is the app running?)
- ✅ Team health (mood, blockers, conflicts?)
- ✅ Personal health (energy, distractions, availability?)
- ### Optional NPC: Server Warden
- Comments on streaks, uptime stats, or sarcasm for neglected systems.

```ts
        {
          id: 'server-health',
          title: 'Dungeon Keeper\'s Vigil',
          description: 'Monitor the ancient servers deep in the Mountain of Processing.',
          realWorldSkill: 'Server monitoring and system health checks',
          fantasyTheme: 'Guardian of mystical computing crystals',
          status: 'available',
          steps: [
            {
              id: 'enter-dungeon',
              description: 'Venture into the server caverns',
              completed: false,
            },
            {
              id: 'check-crystals',
              description: 'Examine the health of processing crystals',
              completed: false,
            },
            {
              id: 'report-status',
              description: 'Document crystal conditions',
              completed: false,
            },
          ],
          reward: {
            score: 75,
            items: ['Crystal Monitor', 'System Rune'],
          },
        },
```

## Quest 3: 🔐 Cryptomancer’s Seal
**Goal**: Teach secure request design and build trust in messaging via HMAC.
### Theme> “Forge a seal no dark mage can forge.”
```log
📜 Fantasy Theme: “Forge a seal no dark mage can forge.”
💼 Skill: Request signing, basic cryptographic integrity
🎯 Objectives:
Learn HMAC theory
Craft the seal (HMAC(secret, message))
Validate seal via NPC challenge
🧙 NPC: Gatekeeper Glynn (already implemented!)
“The seal is weak... Fetch the true signature!”
```
### Mechanics
- Learn HMAC: `HMAC_SHA256(secret, payload)`
- Generate a valid signature and submit to `/api/actions`
- NPC (Gatekeeper Glynn) will validate and offer entry if correct
### NPC: Gatekeeper Glynn
- Already implemented in `npcScripts/gatekeeperGlynn.ts`
- Gives lore-rich responses to success, failure, or help requests


```ts
  {
          id: 'hmac-security',
          title: 'Cryptomancer\'s Seal',
          description: 'Master the arcane arts of message authentication and integrity.',
          realWorldSkill: 'HMAC cryptographic implementation',
          fantasyTheme: 'Forging magical seals of authenticity',
          status: 'available',
          steps: [
            {
              id: 'learn-theory',
              description: 'Study the ancient cryptographic texts',
              completed: false,
            },
            {
              id: 'craft-seal',
              description: 'Create your first authentication seal',
              completed: false,
            },
            {
              id: 'verify-seal',
              description: 'Prove the seal\'s authenticity',
              completed: false,
            },
          ],
          reward: {
            score: 125,
            items: ['Cryptomancer Staff', 'HMAC Grimoire'],
          },
        }

```

⚙️ How to Use
Quests Already structured in createDefaultGameState()
Dialogue Static or NPC-scripted (gatekeeperGlynn.ts)
Scoring/XP Quest rewards (add to score, items, level)
Team Sync Achieved via shared meeting quest logic
Engine Compatibility Fully aligns with existing GameAction → generateBotResponse flow
Extensibility Each quest can optionally branch into a campaign tree later

Would you like me to:
📥 Bundle this into a Markdown PDF for printing?

🎞 Generate Mermaid diagrams (quest lifecycle, message routing)?

🧙 Add more NPCs for the onboarding series?
