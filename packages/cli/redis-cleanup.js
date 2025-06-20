#!/usr/bin/env node

/**
 * Direct Redis cleanup for test players
 */

const Redis = require('ioredis');
const axios = require('axios');
const { identifyTestPlayers } = require('./src/utils/playerHelpers');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3000';

// Players to preserve
const PRESERVE_PLAYERS = [
  'claude-player',
  'default-player',
  'default',
  'slack-U444KV81E' // Your Slack user
];

async function cleanupTestPlayers() {
  console.log('🧹 Redis Player Cleanup\n');
  
  try {
    // Get all players from the set
    const allPlayers = await redis.smembers('game:players');
    console.log(`Found ${allPlayers.length} total players\n`);
    
    // Identify test players
    const testPlayers = identifyTestPlayers(allPlayers, PRESERVE_PLAYERS);
    
    if (testPlayers.length === 0) {
      console.log('No test players to clean up.');
      await redis.quit();
      return;
    }
    
    console.log(`Cleaning up ${testPlayers.length} test players:\n`);
    testPlayers.forEach(id => console.log(`  • ${id}`));
    
    console.log('\n🗑️  Removing players...\n');
    
    // Remove from players set
    if (testPlayers.length > 0) {
      const removed = await redis.srem('game:players', ...testPlayers);
      console.log(`✅ Removed ${removed} players from game:players set`);
    }
    
    // Delete state keys
    for (const playerId of testPlayers) {
      const stateKey = `game:state:${playerId}`;
      const deleted = await redis.del(stateKey);
      if (deleted) {
        console.log(`✅ Deleted state for ${playerId}`);
      }
    }
    
    // Verify remaining players
    console.log('\n📋 Remaining players:');
    const remainingPlayers = await redis.smembers('game:players');
    
    // Get details for remaining players
    for (const playerId of remainingPlayers) {
      try {
        const response = await axios.get(`${ENGINE_URL}/api/state/${playerId}`);
        const player = response.data.data?.player || {};
        console.log(`  • ${playerId} - Score: ${player.score || 0}, Level: ${player.level || 'novice'}`);
      } catch (error) {
        console.log(`  • ${playerId} - (no data)`);
      }
    }
    
    console.log(`\nTotal remaining: ${remainingPlayers.length} players`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await redis.quit();
  }
}

// Run cleanup
cleanupTestPlayers(); 