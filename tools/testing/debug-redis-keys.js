#!/usr/bin/env node

/**
 * Debug Redis Keys
 * Shows all keys in Redis to understand the key structure
 */

const Redis = require('ioredis');
const chalk = require('chalk');

// Redis connection
const REDIS_URL = process.env.REDIS_URL || 'redis://default:K2fw74hvSoiwLtyP5xeAzevBFXpXHvhU@redis-12991.c281.us-east-1-2.ec2.redns.redis-cloud.com:12991';

async function main() {
  const redis = new Redis(REDIS_URL, {
    enableOfflineQueue: true
  });

  try {
    console.log(chalk.bold.blue('\n🔍 Redis Key Analysis\n'));
    
    // Get all keys
    console.log(chalk.yellow('Scanning all keys...'));
    const allKeys = await redis.keys('*');
    
    console.log(chalk.green(`\nFound ${allKeys.length} total keys\n`));
    
    // Group keys by prefix
    const keyGroups = {};
    
    for (const key of allKeys) {
      const prefix = key.split(':')[0];
      if (!keyGroups[prefix]) {
        keyGroups[prefix] = [];
      }
      keyGroups[prefix].push(key);
    }
    
    // Display grouped keys
    console.log(chalk.bold('Keys grouped by prefix:'));
    console.log(chalk.gray('─'.repeat(50)));
    
    for (const [prefix, keys] of Object.entries(keyGroups)) {
      console.log(chalk.cyan(`\n${prefix}:`));
      keys.slice(0, 5).forEach(key => {
        console.log(`  - ${key}`);
      });
      if (keys.length > 5) {
        console.log(chalk.gray(`  ... and ${keys.length - 5} more`));
      }
    }
    
    // Show some sample key types
    console.log(chalk.bold('\n\nSample key types:'));
    console.log(chalk.gray('─'.repeat(50)));
    
    for (const key of allKeys.slice(0, 10)) {
      const type = await redis.type(key);
      console.log(`${key.padEnd(40)} ${chalk.yellow(type)}`);
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error.message);
  } finally {
    await redis.quit();
  }
}

main(); 