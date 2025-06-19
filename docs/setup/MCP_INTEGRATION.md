# myMCP MCP Integration - Ready to Use! 🎮

## Quick Start

### Option 1: Start Everything Together
```bash
node start-all.js
```

### Option 2: Start Services Separately

**Terminal 1 - Engine:**
```bash
node start-engine.js
```

**Terminal 2 - MCP Server:**
```bash
node start-mcp.js
```

## Claude Desktop Integration

1. **Copy the config**: Use the generated `claude_desktop_config.json`
2. **Add to Claude Desktop**: Merge with your existing Claude Desktop config
3. **Restart Claude Desktop**: To load the new MCP server

### Config Location
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

## Testing the Integration

1. **Start services**: Use `node start-all.js`
2. **Check engine**: Visit http://localhost:3000/health
3. **Test in Claude**: Should see "myMCP" as available MCP server

## Available Resources & Tools

### Resources (Read-only data)
- `mcp://game/player/claude-player` - Player profile
- `mcp://game/quests/claude-player` - Quest data  
- `mcp://game/state/claude-player` - Complete game state
- `mcp://game/inventory/claude-player` - Player inventory
- `mcp://system/health` - System status

### Tools (Actions Claude can take)
- `start_quest(questId)` - Begin a quest
- `complete_quest_step(stepId)` - Mark step complete
- `send_chat_message(message)` - Chat with game
- `update_player(updates)` - Modify player
- And more...

## Troubleshooting

- **Engine not starting**: Check port 3000 is free
- **MCP server issues**: Ensure engine is running first
- **Claude integration**: Verify config file location and restart Claude Desktop

🎉 Your fantasy-themed game engine is now MCP-ready!
