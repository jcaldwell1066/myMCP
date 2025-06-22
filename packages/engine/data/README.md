# myMCP Engine Data Directory

This directory stores persistent game state data for the myMCP engine.

## Files

- `game-states.json` - Player game states (auto-generated)
- `backups/` - Automatic backups of game states
- `logs/` - Engine operation logs

## Structure

Game states are stored as JSON with this structure:

```json
{
  "player-id": {
    "player": { ... },
    "quests": { ... },
    "inventory": { ... },
    "session": { ... },
    "metadata": { ... }
  }
}
```

## Backup Strategy

- Auto-backup every hour
- Keep last 24 backups
- Manual backup before major updates

## Data Migration

When updating the engine, game states are automatically migrated to new schema versions.
