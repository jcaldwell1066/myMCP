# myMCP CLI

Command-line interface for the myMCP Fantasy Chatbot System.

## Installation

From the project root:
```bash
cd packages/cli
npm run build
npm link
```

## Usage

### Basic Commands

```bash
# Check your adventure status
mycli status

# Get your current score
mycli get-score

# Set score (for testing)
mycli set-score 150

# Start a quest
mycli start-quest
mycli start-quest "Council of Three Realms"

# Chat with the bot
mycli chat "hello there"
mycli chat -i  # Interactive mode

# View conversation history
mycli history
mycli history -n 5  # Last 5 messages
```

### Demo Flow for Lunch and Learn

```bash
# 1. Check initial status
mycli status

# 2. Start interactive chat
mycli chat -i
# Say: "what quests are available?"

# 3. Start the main quest
mycli start-quest "Council of Three Realms"

# 4. Check updated status
mycli status

# 5. Set a score to show persistence
mycli set-score 100

# 6. Verify score persists
mycli get-score
```

## Features

- **Persistent State**: All progress saved to `~/.mycli-state.json`
- **Interactive Chat**: Full conversation mode with bot responses
- **Quest System**: Three fantasy quests with hard-coded progression
- **Score Management**: Level progression based on achievements
- **Conversation History**: Track all interactions
- **Fantasy Theme**: Immersive medieval/fantasy styling

## Hard-coded Demo Responses

The CLI includes pre-programmed responses for:
- Greetings ("hello", "hi")
- Help requests ("help", "what can you do")
- Quest information ("quests", "adventures")
- Score inquiries ("score", "points")
- Farewells ("bye", "goodbye")

## File Structure

```
packages/cli/
├── src/
│   └── index.ts     # Main CLI implementation
├── dist/            # Compiled JavaScript (after build)
├── package.json     # Dependencies and scripts
├── tsconfig.json    # TypeScript configuration
└── README.md        # This file
```

## Development

```bash
# Build the CLI
npm run build

# Run in development mode (auto-rebuilds)
npm run dev

# Run tests
npm run test

# Clean build artifacts
npm run clean
```

## State File Format

The CLI stores state in `~/.mycli-state.json`:

```json
{
  "player": {
    "name": "Hero",
    "score": 0,
    "level": "novice",
    "currentQuest": "Council of Three Realms"
  },
  "session": {
    "startTime": "2025-06-11T04:30:00.000Z",
    "conversationHistory": [
      {
        "timestamp": "2025-06-11T04:30:15.000Z",
        "type": "player",
        "message": "hello"
      },
      {
        "timestamp": "2025-06-11T04:30:15.100Z", 
        "type": "bot",
        "message": "Greetings, brave adventurer!"
      }
    ]
  }
}
```

This demonstrates the shared state concept that will be expanded when connecting to the myMCP-engine in Task 5.
