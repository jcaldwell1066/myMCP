# Enhanced myMCP MCP Server

## Overview

This enhanced MCP server implements the comprehensive MCP integration mapping you designed, transforming your basic myMCP engine into a full-featured MCP interface with resources, tools, prompts, and future streaming capabilities.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   MCP Client    │────▶│   Enhanced MCP   │────▶│  myMCP Engine   │
│   (Claude)      │     │     Server       │     │  (REST API)     │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

## Implementation Status

### ✅ Phase 1: Core MCP Components (COMPLETED)

#### 🔍 Resources (8 endpoints)
- **Player Profile** (`mcp://game/player/{playerId}`) - Player stats, level, achievements
- **Quest Catalog** (`mcp://game/quests/{playerId}`) - Available, active, completed quests  
- **Full Game State** (`mcp://game/state/{playerId}`) - Complete game state
- **Player Inventory** (`mcp://game/inventory/{playerId}`) - Items and equipment
- **Chat History** (`mcp://game/chat-history/{playerId}`) - Conversation history
- **Game World** (`mcp://game/world/{playerId}`) - Locations, NPCs, world state
- **System Health** (`mcp://system/health`) - Engine health status
- **LLM Status** (`mcp://system/llm-status`) - LLM provider information

#### 🔧 Tools (12 functions)

**Quest Management:**
- `start_quest(playerId, questId)` - Start new quest
- `complete_quest_step(playerId, stepId)` - Complete quest step  
- `complete_quest(playerId)` - Complete current quest

**Player Management:**
- `update_player(playerId, updates)` - Update player info
- `set_player_score(playerId, score)` - Set player score
- `change_location(playerId, location)` - Move player

**Chat & Interaction:**
- `send_chat_message(playerId, message)` - Send chat message
- `get_completions(playerId, prefix)` - Context-aware completions

**Inventory:**
- `use_item(playerId, itemId)` - Use inventory item

**General:**
- `get_game_state(playerId)` - Get complete state

#### 💬 Prompts (5 templates)
- **Character Creation** - Generate backstory and personality
- **Quest Briefing** - Explain objectives and context
- **Help Context** - Context-aware assistance
- **Progress Summary** - Player achievement overview
- **Next Actions** - Suggest next steps

### 🚧 Phase 2: Enhanced Features (PLANNED)

#### 📡 Streaming (Future)
- `mcp://streams/game-updates/{playerId}` - Real-time state updates
- `mcp://streams/chat/{playerId}` - Live chat stream

#### 🧠 Advanced Context (Future)
- Enhanced prompt templates with dynamic context
- Intelligent action suggestions
- Adaptive difficulty recommendations

## File Structure

```
mcpserver/
├── src/
│   ├── index.ts              # Original basic server
│   ├── enhanced-server.ts    # New comprehensive server ⭐
│   ├── test-enhanced.ts      # Test suite for enhanced features
│   └── minimal-test.ts       # Basic connectivity test
├── dist/                     # Compiled JavaScript
├── package.json              # Updated with enhanced scripts
└── README-enhanced.md        # This documentation
```

## Getting Started

### 1. Build the Enhanced Server

```bash
cd packages/mcpserver
npm run build
```

### 2. Start the Enhanced Server

```bash
# Development mode with auto-reload
npm run dev:enhanced

# Production mode
npm run start:enhanced
```

### 3. Test the Enhanced Server

```bash
# Run comprehensive test suite
npm run build && node dist/test-enhanced.js
```

## Usage Examples

### Resource Access

```javascript
// Get player profile
GET mcp://game/player/player123
{
  "name": "Hero",
  "level": "apprentice",
  "score": 1500,
  "currentQuest": "dragon-slaying",
  "achievements": ["first-quest", "level-up"],
  "location": "tavern"
}

// Get quest catalog
GET mcp://game/quests/player123
{
  "available": [...],
  "active": {...},
  "completed": [...],
  "recommended": [...]
}
```

### Tool Execution

```javascript
// Start a quest
CALL start_quest({
  "playerId": "player123",
  "questId": "dragon-slaying"
})

// Send chat message
CALL send_chat_message({
  "playerId": "player123", 
  "message": "I want to explore the forest"
})

// Change location
CALL change_location({
  "playerId": "player123",
  "location": "forest"
})
```

### Prompt Generation

```javascript
// Character creation prompt
GET_PROMPT game/character-creation {
  "playerName": "Aragorn",
  "preferredClass": "ranger"
}

// Quest briefing prompt  
GET_PROMPT game/quest-briefing {
  "questId": "dragon-slaying",
  "playerLevel": "intermediate"
}
```

## API Mapping

### REST → MCP Resource Mapping

| MCP Resource | REST Endpoint | Description |
|-------------|---------------|-------------|
| `mcp://game/player/{id}` | `GET /api/state/{id}` | Player data extraction |
| `mcp://game/quests/{id}` | `GET /api/state/{id}` | Quest data extraction |
| `mcp://game/inventory/{id}` | `GET /api/state/{id}` | Inventory extraction |
| `mcp://game/world/{id}` | `GET /api/state/{id}` | World state extraction |
| `mcp://system/health` | `GET /health` | Direct mapping |

### Tool → Action Mapping

| MCP Tool | REST Action | Payload |
|----------|-------------|---------|
| `start_quest` | `POST /api/actions` | `{type: "START_QUEST", payload: {questId}}` |
| `send_chat_message` | `POST /api/actions` | `{type: "CHAT", payload: {message}}` |
| `set_player_score` | `POST /api/actions` | `{type: "SET_SCORE", payload: {score}}` |
| `change_location` | `POST /api/actions` | `{type: "CHANGE_LOCATION", payload: {location}}` |

## Configuration

### Environment Variables

```bash
# Engine connection
ENGINE_BASE_URL=http://localhost:3000

# Default player for testing
DEFAULT_PLAYER_ID=mcp-player

# Optional: Enable debug logging
DEBUG=mcp:*
```

### MCP Client Configuration

Add to your MCP client config:

```json
{
  "mcpServers": {
    "myMCP-enhanced": {
      "command": "node",
      "args": ["./packages/mcpserver/dist/enhanced-server.js"],
      "env": {
        "ENGINE_BASE_URL": "http://localhost:3000",
        "DEFAULT_PLAYER_ID": "your-player-id"
      }
    }
  }
}
```

## Benefits of Enhanced Implementation

### 🎯 Standardized Access
- Claude can directly interact with structured game state
- Consistent resource URIs across all game components
- Automatic data type handling and validation

### 🧠 Rich Context
- Full game state available as structured resources
- Context-aware prompts for better interactions
- Intelligent action suggestions based on current state

### ⚡ Action Capability
- Claude can execute game actions through tools
- Real-time state updates after actions
- Error handling and validation

### 💡 Intelligent Assistance
- Contextual prompts for better gameplay
- Dynamic help based on current situation
- Progress tracking and goal suggestions

## Troubleshooting

### Common Issues

**Server won't start:**
```bash
# Check if engine is running
curl http://localhost:3000/health

# Start engine first
cd packages/engine
npm start
```

**Resource read failures:**
- Verify engine is responding to REST API calls
- Check player ID exists in engine state
- Ensure proper JSON formatting in responses

**Tool execution errors:**
- Validate required parameters are provided
- Check engine action endpoint compatibility
- Verify action types match engine expectations

## Next Steps

1. **Test Integration** - Use the test suite to verify all functionality
2. **Add Streaming** - Implement WebSocket support for real-time updates  
3. **Enhanced Prompts** - Add more sophisticated context awareness
4. **Performance** - Add caching and optimize resource access
5. **Security** - Add authentication and rate limiting

## Comparison: Basic vs Enhanced

| Feature | Basic Server | Enhanced Server |
|---------|-------------|-----------------|
| Resources | 3 basic | 8 comprehensive |
| Tools | 2 functions | 12 functions |
| Prompts | None | 5 templates |
| Context Awareness | Minimal | Rich game state |
| Action Coverage | Chat only | Full game actions |
| Documentation | Basic | Comprehensive |

The enhanced server transforms your myMCP engine from a simple chat interface into a comprehensive game management system that Claude can intelligently interact with!
