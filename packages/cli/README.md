# myMCP CLI

**Fantasy-themed Command Line Interface for the myMCP Engine**

A comprehensive CLI package offering multiple interaction modes with the myMCP fantasy chatbot system, from simple commands to immersive shell experiences.

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- myMCP Engine running (`cd packages/engine && npm start`)

### Installation
```bash
cd packages/cli
npm run build
npm link  # Optional: Install globally
```

## 🎮 Available Interfaces

### 1. **Simple CLI** (Quick Commands)
```bash
# Direct command execution
node src/simple-cli.js status
node src/simple-cli.js chat "hello there"
node src/simple-cli.js health

# Or via npm scripts
npm run simple status
npm run simple chat "what should I do?"
```

### 2. **Enhanced Adventure Guide** (Recommended)
```bash
# Immersive fantasy shell with AI guide
npm run guide
# or
npm run adventure
# or 
node enhanced-shell.js
```

### 3. **Interactive Shell**
```bash
# Traditional interactive CLI
npm run shell
# or
node interactive-shell.js
```

### 4. **Unified Shell**
```bash
# Advanced unified interface (experimental)
npm run unified
# or
node unified-shell.js
```

### 5. **Full CLI Suite** (API-Connected)
```bash
# Full featured CLI with comprehensive commands
npm run build && node dist/index.js status
# or via npm scripts
npm start status
```

## 📋 Command Reference

### Simple CLI Commands
| Command | Description | Example |
|---------|-------------|---------|
| `status` | Show player status | `mycli status` |
| `chat` | Send message to AI guide | `mycli chat "Hello!"` |
| `health` | Check engine connection | `mycli health` |

### Full CLI Commands (Built Version)
| Command | Description | Example |
|---------|-------------|---------|
| `status` | Show current game status | `mycli status` |
| `get-score` | Get current score | `mycli get-score` |
| `set-score <points>` | Set score (testing) | `mycli set-score 150` |
| `chat [message]` | Chat with AI guide | `mycli chat "what quests are available?"` |
| `chat -i` | Interactive chat mode | `mycli chat -i` |
| `start-quest [id]` | Start a quest | `mycli start-quest global-meeting` |
| `quest-steps` | View active quest steps | `mycli quest-steps` |
| `complete-step <id>` | Complete a quest step | `mycli complete-step find-allies` |
| `complete-quest` | Complete active quest | `mycli complete-quest` |
| `next` | Show next step to do | `mycli next` |
| `progress` | Show quest progress | `mycli progress` |
| `quests` | List all quests | `mycli quests` |
| `history [n]` | Show conversation history | `mycli history -n 10` |
| `config <action>` | Manage configuration | `mycli config show` |

### Adventure Guide (Enhanced Shell)
**Natural Language Interface:**
- Just speak naturally: *"I want to start a quest"*
- AI understands context: *"I completed finding allies"*
- Ask for guidance: *"What should I do next?"*

**Quick Commands:**
- `status` - Adventure status
- `quests` - Available quests  
- `history [n]` - Recent conversations
- `health` - Connection check
- `help` - Show help
- `clear` - Clear screen
- `exit` - Exit adventure

## 🏗️ Architecture

### File Structure
```
packages/cli/
├── src/
│   ├── index.ts           # Main comprehensive CLI (TypeScript)
│   └── simple-cli.js      # Simple command CLI (JavaScript)
├── dist/                  # Compiled TypeScript output
├── bin/
│   └── mycli.js          # Global binary entry point
├── enhanced-shell.js      # Immersive adventure guide
├── interactive-shell.js   # Traditional interactive shell
├── unified-shell.js       # Unified interface (experimental)
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript configuration
```

### Configuration
The CLI stores configuration in:
- **Project-relative**: `.mymcp-cli/config.json` 
- **Legacy support**: `~/.mymcp/config.json` (auto-migrated)

Default configuration:
```json
{
  "engineUrl": "http://localhost:3000",
  "playerId": "cli-player-<timestamp>",
  "apiTimeout": 5000
}
```

## 🎯 Usage Examples

### Demo Workflow (Adventure Guide)
```bash
# Start the immersive adventure guide
npm run adventure

# Natural conversation examples:
Adventure> What quests are available?
Adventure> I want to start the Council of Three Realms quest
Adventure> I completed finding allies  
Adventure> What should I do next?
Adventure> How am I doing?
Adventure> exit
```

### API-Connected CLI Demo
```bash
# 1. Check connection and status
mycli health
mycli status

# 2. Start interactive chat
mycli chat -i
# Say: "what quests are available?"

# 3. Start a quest
mycli start-quest "Council of Three Realms"

# 4. Work on quest steps
mycli quest-steps
mycli complete-step find-allies
mycli next

# 5. Check progress
mycli progress
mycli status
```

### Simple Testing
```bash
# Quick health check
node src/simple-cli.js health

# Test chat functionality  
node src/simple-cli.js chat "hello there"

# Check player status
node src/simple-cli.js status
```

## 🔧 Development

### Build Commands
```bash
npm run build      # Compile TypeScript to dist/
npm run dev        # Development mode with auto-rebuild
npm run clean      # Remove build artifacts
npm run test       # Run test suite
```

### Global Installation
```bash
npm run install-global  # Install as global 'mycli' command
# or
npm link
```

## 🌟 Features

### Multiple Interface Modes
- **Simple CLI**: Direct command execution
- **Adventure Guide**: Immersive fantasy shell with natural language
- **Interactive Shell**: Traditional Q&A interface  
- **Full CLI Suite**: Comprehensive command set with API integration

### AI Integration
- **Natural Language Processing**: Speak normally to the AI guide
- **Context Awareness**: AI remembers your quest progress
- **Multiple LLM Support**: Anthropic Claude, OpenAI, fallback responses
- **Real-time Chat**: Interactive conversations with response metadata

### Game Integration
- **Quest Management**: Start, progress, and complete fantasy quests
- **Score & Leveling**: Track progress and achievements
- **State Persistence**: All progress saved via API
- **Real-time Updates**: WebSocket support for live updates

### Developer Experience
- **TypeScript Support**: Full type safety and IntelliSense
- **Modular Architecture**: Multiple entry points for different use cases
- **Error Handling**: Graceful fallbacks and helpful error messages
- **Configuration Management**: Flexible config with migration support

## 🎲 Fantasy Theme

The CLI provides an immersive fantasy experience:
- **Player**: You are a brave adventurer
- **AI Guide**: Ancient wizard providing guidance
- **Quests**: Fantasy-themed technical challenges
- **Progression**: Medieval-style leveling (novice → apprentice → expert → master)
- **Language**: Medieval/fantasy terminology throughout

### Available Quests
1. **Council of Three Realms** - Timezone coordination and meeting scheduling
2. **Dungeon Keeper's Vigil** - Server monitoring and system health checks  
3. **Cryptomancer's Seal** - HMAC cryptographic implementation

## 🤝 Integration

This CLI integrates with:
- **myMCP Engine**: Core game state and API management
- **myMCP Types**: Shared TypeScript definitions
- **WebSocket**: Real-time state updates
- **LLM Services**: AI-powered conversations

Ready for your next adventure? Try `npm run adventure` to begin! 🗡️✨
