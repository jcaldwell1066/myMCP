# Redis Reset Scripts Summary

## Overview
Two scripts have been created to manage Redis data during development and testing of the myMCP game engine.

## Scripts Created

### 1. `tools/testing/reset-redis.js`
A comprehensive Node.js script for resetting Redis data with safety features.

**Key Features:**
- Shows statistics before deletion
- Confirmation prompt (bypass with `--force`)
- Dry run mode to preview changes
- Option to preserve leaderboard data
- Progress indicator for large datasets
- Batch deletion for performance

### 2. `tools/testing/quick-reset-redis.sh`
An interactive shell script for common reset scenarios.

**Menu Options:**
1. Reset all data (with confirmation)
2. Reset all data (force)
3. Reset all except leaderboard
4. Dry run
5. Reset specific player
6. Clear sessions only

### 3. `tools/testing/debug-redis-keys.js`
A utility script to analyze Redis key structure.

## Key Patterns Handled

The scripts recognize these myMCP key patterns:
- `game:state:*` - Player states
- `game:session:*` - Game sessions
- `game:location:*` - Location data
- `game:player:*` - Player-specific data
- `game:leaderboard:*` - Score rankings
- `game:quest:*` - Quest data
- `game:inventory:*` - Inventories
- `game:item:*` - Item definitions
- `game:players` - Set of all players
- `test:*` - Test data

## Quick Usage Examples

```bash
# Preview what would be deleted
node tools/testing/reset-redis.js --dry-run

# Reset all data (asks for confirmation)
node tools/testing/reset-redis.js

# Reset without confirmation
node tools/testing/reset-redis.js --force

# Keep leaderboard data
node tools/testing/reset-redis.js --keep-leaderboard

# Interactive menu
./tools/testing/quick-reset-redis.sh
```

## Configuration

The scripts use the `REDIS_URL` environment variable. Default:
```
redis://default:K2fw74hvSoiwLtyP5xeAzevBFXpXHvhU@redis-12991.c281.us-east-1-2.ec2.redns.redis-cloud.com:12991
```

## Safety Features

1. **Dry Run Mode**: Preview changes without deleting
2. **Confirmation Prompt**: Requires "yes" to proceed
3. **Statistics Display**: Shows what will be deleted
4. **Batch Processing**: Deletes in groups of 100 keys
5. **Error Handling**: Graceful connection handling
6. **Progress Tracking**: Visual feedback during deletion

## Integration with Development Workflow

```bash
# Before running tests
node tools/testing/reset-redis.js --force

# After testing to see what was created
node tools/testing/debug-redis-keys.js

# Clean up but keep scores
node tools/testing/reset-redis.js --keep-leaderboard
```

## Files Created
- `/tools/testing/reset-redis.js` - Main reset script
- `/tools/testing/quick-reset-redis.sh` - Interactive menu script
- `/tools/testing/debug-redis-keys.js` - Key analysis tool
- `/tools/testing/REDIS_RESET_GUIDE.md` - Detailed documentation
- `/tools/testing/REDIS_RESET_SUMMARY.md` - This summary 