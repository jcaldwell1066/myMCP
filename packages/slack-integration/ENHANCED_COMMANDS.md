# Enhanced Slack Integration Commands

The Slack integration has been enhanced to mirror the capabilities of the MCP server, providing direct state manipulation commands alongside the existing AI chat functionality.

## Command Overview

All commands use the `/mymcp` prefix followed by the specific command and its arguments.

### Core Commands

- `/mymcp status [player]` - View player status
- `/mymcp leaderboard` - View top players  
- `/mymcp chat <message>` - Send message to game AI
- `/mymcp help` - Show all available commands

### Quest Commands

- `/mymcp quest list` - View available quests
- `/mymcp quest start <questId>` - Start a specific quest
- `/mymcp quest complete step <stepId>` - Complete a quest step
- `/mymcp quest complete quest <questId>` - Complete entire quest
- `/mymcp quest active` - View your active quests

### Player Management

- `/mymcp score set <value>` - Set score to specific value
- `/mymcp score add <value>` - Add to current score
- `/mymcp score subtract <value>` - Subtract from score
- `/mymcp player update <field> <value>` - Update player field (name, level, etc.)
- `/mymcp player reset` - Reset player to initial state

### World & Items

- `/mymcp location list` - View available locations
- `/mymcp location move <location>` - Move to a location
- `/mymcp item list` - View your inventory
- `/mymcp item use <itemId>` - Use an item

## Benefits of Direct Commands

1. **Predictable Results** - Direct state manipulation without AI interpretation
2. **Faster Execution** - No LLM processing required
3. **Automation Friendly** - Can be scripted or integrated with other tools
4. **Works Without LLM** - Functions even if AI service is unavailable
5. **Precise Control** - Exact control over game state changes

## Usage Examples

### Starting a Quest
```
/mymcp quest start global-meeting
```

### Setting Score
```
/mymcp score set 100
/mymcp score add 25
```

### Moving Locations
```
/mymcp location move tavern
```

### Updating Player Info
```
/mymcp player update name "Sir Lancelot"
/mymcp player update level master
```

## Player ID Mapping

All Slack users are automatically mapped to game players using the pattern `slack-{userId}`. This ensures each Slack user has their own persistent game state.

## Error Handling

All commands include proper error handling and will provide helpful feedback if:
- Invalid arguments are provided
- The game engine is unavailable
- The requested action fails

## Integration with Game Events

The enhanced commands work seamlessly with the existing event system:
- Score changes trigger leaderboard updates
- Quest completions are broadcast to channels
- Location changes can notify other players
- All actions maintain the game's event-driven architecture 