# Examples and Usage Samples

This directory contains usage examples, sample files, and demonstrations for the myMCP system.

## 📋 Contents

### Postman Collections (`/postman/`)
- **MCP_TIME_QUEST_@myapi.postman_collection.json** - Complete API testing collection

## 🚀 Using the Examples

### Postman API Testing
1. Import the collection into Postman
2. Ensure the myMCP engine is running (`npm run dev:engine`)
3. Execute requests to test API functionality

### API Endpoints Included
- Health checks and system status
- Player state management
- Quest operations
- Chat interactions
- Game actions and scoring

## 📝 CLI Usage Examples

### Basic Commands
```bash
# Check system status
npm run dev:cli status

# Interactive chat session
npm run dev:cli chat -i

# Set player score
npm run dev:cli set-score 250

# Start a quest
npm run dev:cli start-quest global-meeting
```

### Advanced Usage
```bash
# View conversation history
npm run dev:cli history --number 20

# Configure CLI settings
npm run dev:cli config show
npm run dev:cli config engineUrl http://localhost:3000

# Quest management
npm run dev:cli quests
npm run dev:cli start-quest
```

## 🎮 Sample Quest Flows

### Council of Three Realms (Global Meeting)
```bash
# Start the timezone coordination quest
npm run dev:cli start-quest global-meeting

# Check quest progress
npm run dev:cli quests

# Interact with quest narrative
npm run dev:cli chat "What do I need to coordinate this meeting?"
```

### Dungeon Keeper's Vigil (Server Health)
```bash
# Begin server monitoring quest
npm run dev:cli start-quest server-health

# Learn about system monitoring
npm run dev:cli chat "How do I check server health?"
```

## 🔧 Development Examples

### Testing API Manually
```bash
# Health check
curl http://localhost:3000/health

# Get player state
curl http://localhost:3000/api/state/example-player

# Execute game action
curl -X POST http://localhost:3000/api/actions/example-player \
  -H "Content-Type: application/json" \
  -d '{"type":"SET_SCORE","payload":{"score":100},"playerId":"example-player"}'
```

## 📈 Adding New Examples

When contributing new examples:
1. Place in appropriate subdirectory
2. Include clear documentation
3. Test examples before committing
4. Update this README with descriptions
