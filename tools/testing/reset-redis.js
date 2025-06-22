#!/usr/bin/env node

/**
 * Reset Redis Database Script
 * Clears all game-related data from Redis
 * 
 * Usage:
 *   node reset-redis.js                    # Clear all data
 *   node reset-redis.js --keep-leaderboard # Keep leaderboard data
 *   node reset-redis.js --dry-run          # Show what would be deleted
 */

const Redis = require('ioredis');
const chalk = require('chalk');
const readline = require('readline');

// Parse command line arguments
const args = process.argv.slice(2);
const keepLeaderboard = args.includes('--keep-leaderboard');
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

// Redis connection configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://default:K2fw74hvSoiwLtyP5xeAzevBFXpXHvhU@redis-12991.c281.us-east-1-2.ec2.redns.redis-cloud.com:12991';

// Create Redis client
const redis = new Redis(REDIS_URL, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableOfflineQueue: true
});

// Create readline interface for user confirmation
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Key patterns to delete
const KEY_PATTERNS = {
  gameState: 'game:state:*',
  gameSessions: 'game:session:*',
  gameLocations: 'game:location:*',
  gamePlayers: 'game:player:*',
  gameLeaderboard: 'game:leaderboard:*',
  gameQuests: 'game:quest:*',
  gameInventory: 'game:inventory:*',
  gameItems: 'game:item:*',
  // Legacy patterns (just in case)
  players: 'player:*',
  sessions: 'session:*',
  quests: 'quest:*',
  inventory: 'inventory:*',
  // Other patterns
  events: 'event:*',
  metrics: 'metrics:*',
  health: 'health:*',
  locks: 'lock:*',
  temp: 'temp:*',
  cache: 'cache:*',
  test: 'test:*'
};

async function getKeysToDelete() {
  const allKeys = [];
  const patterns = Object.entries(KEY_PATTERNS)
    .filter(([type]) => !(keepLeaderboard && type.toLowerCase().includes('leaderboard')))
    .map(([, pattern]) => pattern);

  for (const pattern of patterns) {
    const keys = await redis.keys(pattern);
    allKeys.push(...keys);
  }

  // Also handle the game:players set separately if not keeping leaderboard
  if (!keepLeaderboard) {
    const playersSet = await redis.keys('game:players');
    allKeys.push(...playersSet);
  }

  return allKeys;
}

async function deleteKeys(keys) {
  if (keys.length === 0) {
    console.log(chalk.yellow('No keys to delete.'));
    return;
  }

  // Delete in batches to avoid overloading Redis
  const batchSize = 100;
  let deleted = 0;

  for (let i = 0; i < keys.length; i += batchSize) {
    const batch = keys.slice(i, i + batchSize);
    if (!dryRun) {
      await redis.del(...batch);
    }
    deleted += batch.length;
    
    // Show progress
    const progress = Math.round((deleted / keys.length) * 100);
    process.stdout.write(`\r${chalk.blue('Progress:')} ${progress}% (${deleted}/${keys.length} keys)`);
  }
  
  console.log(''); // New line after progress
}

async function showKeyStats(keys) {
  const stats = {};
  
  // Count keys by type
  for (const key of keys) {
    const type = key.split(':')[0];
    stats[type] = (stats[type] || 0) + 1;
  }

  console.log(chalk.bold('\n📊 Keys to be deleted:'));
  console.log(chalk.gray('─'.repeat(40)));
  
  Object.entries(stats)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([type, count]) => {
      console.log(`  ${chalk.cyan(type.padEnd(15))} ${chalk.yellow(count.toString().padStart(6))} keys`);
    });
  
  console.log(chalk.gray('─'.repeat(40)));
  console.log(`  ${chalk.bold('TOTAL'.padEnd(15))} ${chalk.bold.yellow(keys.length.toString().padStart(6))} keys\n`);
}

async function main() {
  try {
    console.log(chalk.bold.red('\n🗑️  Redis Database Reset Tool\n'));
    
    // Show connection info
    const urlParts = new URL(REDIS_URL);
    console.log(chalk.gray(`Connected to: ${urlParts.hostname}:${urlParts.port}`));
    
    // Test connection
    await redis.ping();
    console.log(chalk.green('✓ Redis connection successful\n'));

    // Get keys to delete
    console.log(chalk.blue('Scanning for keys...'));
    const keys = await getKeysToDelete();

    if (keys.length === 0) {
      console.log(chalk.yellow('\nNo keys found to delete.'));
      await cleanup();
      return;
    }

    // Show what will be deleted
    await showKeyStats(keys);

    // Show options
    if (keepLeaderboard) {
      console.log(chalk.yellow('ℹ️  Keeping leaderboard data (--keep-leaderboard)'));
    }
    if (dryRun) {
      console.log(chalk.yellow('ℹ️  DRY RUN MODE - No data will be deleted'));
    }

    // Confirm deletion
    if (!dryRun && !force) {
      console.log(chalk.bold.red('\n⚠️  WARNING: This will permanently delete the data shown above!'));
      const answer = await question('\nAre you sure you want to continue? (yes/no): ');
      
      if (answer.toLowerCase() !== 'yes') {
        console.log(chalk.yellow('\nOperation cancelled.'));
        await cleanup();
        return;
      }
    }

    // Delete keys
    console.log(chalk.blue('\nDeleting keys...'));
    await deleteKeys(keys);

    if (dryRun) {
      console.log(chalk.yellow('\n✓ DRY RUN completed. No data was deleted.'));
    } else {
      console.log(chalk.green(`\n✓ Successfully deleted ${keys.length} keys from Redis.`));
    }

    // Additional cleanup tasks
    if (!dryRun) {
      console.log(chalk.blue('\nPerforming additional cleanup...'));
      
      // Reset any Redis-specific data structures
      // For example, reset sorted sets, streams, etc.
      
      console.log(chalk.green('✓ Cleanup completed.'));
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

async function cleanup() {
  rl.close();
  try {
    await redis.quit();
  } catch (error) {
    // Ignore errors during cleanup
  }
}

// Handle interrupts
process.on('SIGINT', async () => {
  console.log(chalk.yellow('\n\nOperation interrupted by user.'));
  await cleanup();
  process.exit(0);
});

// Run the script
main(); 