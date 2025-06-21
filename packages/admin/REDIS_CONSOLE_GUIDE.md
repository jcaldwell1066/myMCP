# Redis Console Guide

The Redis Console in the myMCP Admin Dashboard provides direct access to Redis for debugging and monitoring.

## Example Commands

### Basic Commands
```bash
# Get all keys
KEYS *

# Get a specific player
GET player:jcadwell-mcp

# Get server information
INFO

# Get database size
DBSIZE
```

### Player Commands
```bash
# List all players
SMEMBERS game:players

# Get player data
GET player:jcadwell-mcp

# Check player existence
EXISTS player:jeff-c
```

### Leaderboard Commands
```bash
# Top 10 players by score
ZREVRANGE game:leaderboard:score 0 9 WITHSCORES

# Get a player's rank
ZREVRANK game:leaderboard:score jcadwell-mcp

# Get a player's score
ZSCORE game:leaderboard:score jcadwell-mcp
```

### Session Commands
```bash
# Find all active sessions
KEYS game:session:*

# Get session data
GET game:session:jcadwell-mcp
```

### Quest Commands
```bash
# Get player's quest data
GET quest:jcadwell-mcp

# Check available quests
KEYS quest:*
```

## Saved Queries

The console includes pre-configured queries:
- **All Players**: Lists all registered players
- **Top 10 Leaderboard**: Shows the top 10 players by score
- **Redis Server Info**: Displays server statistics
- **Active Sessions**: Finds all active game sessions

## Tips

1. Commands are case-insensitive (GET, get, Get all work)
2. Use `*` as a wildcard in KEYS commands
3. Results are automatically formatted for readability
4. Large result sets are truncated to prevent UI issues
5. The console shows both the command and its result

## Safety

The console restricts dangerous commands like:
- FLUSHDB / FLUSHALL (database deletion)
- CONFIG SET (configuration changes)
- SHUTDOWN (server shutdown)

This ensures you can safely explore the data without risk of accidental damage. 