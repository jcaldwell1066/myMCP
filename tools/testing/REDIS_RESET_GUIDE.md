# Redis Reset Scripts Guide

This directory contains scripts for resetting and managing Redis data during development and testing.

## Scripts

### 1. reset-redis.js
A comprehensive Node.js script for resetting Redis data with various options.

**Features:**
- Shows detailed statistics of keys to be deleted
- Batch deletion for performance
- Progress indicator
- Confirmation prompt (can be bypassed with --force)
- Selective data preservation

**Usage:**
```bash
# Reset all data (with confirmation)
node tools/testing/reset-redis.js

# Reset without confirmation
node tools/testing/reset-redis.js --force

# Keep leaderboard data
node tools/testing/reset-redis.js --keep-leaderboard

# Dry run - see what would be deleted
node tools/testing/reset-redis.js --dry-run

# Combine options
node tools/testing/reset-redis.js --keep-leaderboard --dry-run
```

### 2. quick-reset-redis.sh
An interactive shell script for common reset scenarios.

**Features:**
- Interactive menu
- Quick access to common operations
- Single player reset
- Session-only clearing

**Usage:**
```bash
# Run the interactive menu
./tools/testing/quick-reset-redis.sh
```

**Menu Options:**
1. Reset all data (with confirmation)
2. Reset all data (force, no confirmation)
3. Reset all except leaderboard
4. Dry run (show what would be deleted)
5. Reset specific player data
6. Clear all sessions only
0. Cancel

## Key Patterns

The scripts target the following Redis key patterns:

- `player:*` - Player profiles and data
- `session:*` - Active game sessions
- `quest:*` - Quest states and progress
- `inventory:*` - Player inventories
- `chat:*` - Chat history
- `event:*` - Game events
- `leaderboard:*` - Score rankings
- `metrics:*` - System metrics
- `health:*` - Health check data
- `lock:*` - Distributed locks
- `temp:*` - Temporary data
- `cache:*` - Cached data

## Safety Features

1. **Confirmation Prompt**: By default, asks for confirmation before deleting
2. **Dry Run Mode**: See what would be deleted without actually deleting
3. **Progress Indicator**: Shows deletion progress for large datasets
4. **Batch Processing**: Deletes keys in batches to avoid overloading Redis
5. **Graceful Shutdown**: Handles Ctrl+C interruption properly

## Environment Variables

The scripts use the following environment variable:

- `REDIS_URL` - Redis connection URL (default: redis://default:myMCP2024!@redis-12991.c281.us-east-1-2.ec2.redns.redis-cloud.com:12991)

You can set this in your environment or `.env` file:
```bash
export REDIS_URL="redis://username:password@host:port"
```

## Examples

### Development Workflow

```bash
# Before running tests, clear all data
node tools/testing/reset-redis.js --force

# Check what test data was created
node tools/testing/reset-redis.js --dry-run

# Clean up after tests but keep leaderboard
node tools/testing/reset-redis.js --keep-leaderboard
```

### Debugging Specific Players

```bash
# Use the interactive menu
./tools/testing/quick-reset-redis.sh
# Select option 5
# Enter player ID: jcadwell-mcp
```

### Automated Testing

```bash
# In your test scripts
npm run test:setup && node tools/testing/reset-redis.js --force && npm run test:integration
```

## Notes

- The scripts use the `ioredis` library for Redis connectivity
- All operations are logged with colored output using `chalk`
- The scripts handle connection failures gracefully
- Progress is shown for operations on large datasets
- Keys are deleted in batches of 100 to maintain performance

## Troubleshooting

If you encounter connection issues:
1. Check your Redis credentials in environment variables
2. Ensure Redis is accessible from your network
3. Verify the Redis Cloud instance is running
4. Check for any firewall or network restrictions

For permission errors:
```bash
chmod +x tools/testing/*.sh
``` 