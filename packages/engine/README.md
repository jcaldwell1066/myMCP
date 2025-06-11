# myMCP Engine

Express.js API server providing game state management and quest logic for the myMCP Fantasy Chatbot System.

## Overview

The engine is the central component that:
- Manages game state for all players
- Handles quest progression and rewards
- Provides WebSocket real-time updates
- Stores data persistently in JSON files
- Validates all game actions

## Installation & Setup

```bash
# From project root
cd packages/engine
npm run build
npm run dev  # Development mode with auto-restart
```

## API Endpoints

### Health & Status
```
GET /health
```
Returns engine health and statistics.

### Game State Management
```
GET /api/state/:playerId?
PUT /api/state/:playerId/player
```
Get current game state or update player information.

### Game Actions
```
POST /api/actions/:playerId?
```
Execute game actions like starting quests, chatting, etc.

**Action Types:**
- `SET_SCORE` - Update player score
- `START_QUEST` - Begin a new quest
- `COMPLETE_QUEST_STEP` - Mark quest step as done
- `COMPLETE_QUEST` - Finish entire quest
- `CHAT` - Send chat message (gets bot response)
- `USE_ITEM` - Use inventory item
- `CHANGE_LOCATION` - Move to different location
- `UPDATE_PLAYER_STATUS` - Change player status

### Quest Management
```
GET /api/quests/:playerId?
```
Get available, active, and completed quests.

### Tab Completion
```
GET /api/context/completions/:playerId?prefix=<text>
```
Get context-aware command suggestions.

## Game State Structure

```typescript
interface GameState {
  player: {
    id: string;
    name: string;
    score: number;
    level: 'novice' | 'apprentice' | 'expert' | 'master';
    status: 'idle' | 'chatting' | 'in-quest' | 'completed-quest';
    location: 'town' | 'forest' | 'cave' | 'shop';
    currentQuest?: string;
  };
  quests: {
    available: Quest[];
    active: Quest | null;
    completed: Quest[];
  };
  inventory: {
    items: Item[];
    capacity: number;
    status: 'empty' | 'has-item' | 'full';
  };
  session: {
    id: string;
    startTime: Date;
    lastAction: Date;
    turnCount: number;
    conversationHistory: ChatMessage[];
  };
  metadata: {
    version: string;
    lastUpdated: Date;
  };
}
```

## Built-in Quests

### 1. Council of Three Realms (global-meeting)
**Real Skill**: Timezone coordination and meeting scheduling  
**Fantasy Theme**: Gathering allies across distant kingdoms  
**Reward**: 100 points + Council Seal + Diplomatic Medallion

### 2. Dungeon Keeper's Vigil (server-health)
**Real Skill**: Server monitoring and system health checks  
**Fantasy Theme**: Guardian of mystical computing crystals  
**Reward**: 75 points + Crystal Monitor + System Rune

### 3. Cryptomancer's Seal (hmac-security)
**Real Skill**: HMAC cryptographic implementation  
**Fantasy Theme**: Forging magical seals of authenticity  
**Reward**: 125 points + Cryptomancer Staff + HMAC Grimoire

## WebSocket Real-time Updates

The engine broadcasts state changes to all connected WebSocket clients:

```javascript
const ws = new WebSocket('ws://localhost:3000');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'STATE_UPDATE') {
    // Update UI with new state
    updateGameState(data.update.data);
  }
};
```

## Data Persistence

Game states are saved to `data/game-states.json`:
- Auto-saves after every action
- In-memory caching for performance
- Graceful error handling
- Automatic backup creation

## Level Progression

Player levels automatically update based on score:
- **Novice**: 0-99 points
- **Apprentice**: 100-499 points  
- **Expert**: 500-999 points
- **Master**: 1000+ points

## Development

### Running Tests
```bash
npm test
```

### Building
```bash
npm run build
```

### Development Mode
```bash
npm run dev  # Auto-restarts on changes
```

### API Testing
```bash
# Health check
curl http://localhost:3000/health

# Get game state
curl http://localhost:3000/api/state/test-player

# Set score
curl -X POST http://localhost:3000/api/actions/test-player \
  -H "Content-Type: application/json" \
  -d '{"type":"SET_SCORE","payload":{"score":150},"playerId":"test-player"}'

# Start quest
curl -X POST http://localhost:3000/api/actions/test-player \
  -H "Content-Type: application/json" \
  -d '{"type":"START_QUEST","payload":{"questId":"global-meeting"},"playerId":"test-player"}'
```

## Integration with CLI

In Task 5, the CLI will be updated to call these APIs instead of using local file storage:

```typescript
// Instead of file operations
const state = loadState();

// Will become API calls
const response = await fetch('http://localhost:3000/api/state/player-id');
const state = await response.json();
```

## Environment Variables

```bash
PORT=3000                    # Server port
CORS_ORIGIN=http://localhost:3001  # Allowed origins
NODE_ENV=development         # Environment mode
```

## Architecture Integration

```
myMCP-cli ──┐
             ├─→ myMCP-engine ←── myMCP-webapp
myMCP-admin ─┘      ↑
                    └── myMCP-mcpserver
```

The engine serves as the central hub that all other components communicate with for shared state management.

## Error Handling

- Validates all incoming requests
- Returns appropriate HTTP status codes
- Logs errors for debugging
- Graceful degradation on failures

## Future Enhancements (Tasks 6-7)

- **Tab Completion**: Enhanced context-aware suggestions
- **LLM Integration**: Dynamic bot responses
- **Advanced Quests**: More complex quest mechanics
- **Database Migration**: Move from JSON to proper database
