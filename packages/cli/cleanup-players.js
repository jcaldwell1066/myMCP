#!/usr/bin/env node

/**
 * Cleanup script to remove test players from the system
 * Preserves important players like claude-player and default-player
 */

const axios = require('axios');
const readline = require('readline');

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3000';

// Players to preserve (won't be deleted)
const PRESERVE_PLAYERS = [
  'claude-player',
  'default-player',
  'default'
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function getPlayers() {
  try {
    const response = await axios.get(`${ENGINE_URL}/api/players`);
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch players:', error.message);
    return [];
  }
}

async function deletePlayer(playerId) {
  try {
    // Try to delete via API endpoint if it exists
    await axios.delete(`${ENGINE_URL}/api/players/${playerId}`);
    return true;
  } catch (error) {
    // If delete endpoint doesn't exist, we'll need to handle it differently
    console.log(`⚠️  Cannot delete ${playerId} - API endpoint may not exist`);
    return false;
  }
}

async function cleanupPlayers() {
  console.log('🧹 Player Cleanup Utility\n');
  
  // Get all players
  const players = await getPlayers();
  
  if (players.length === 0) {
    console.log('No players found.');
    rl.close();
    return;
  }
  
  // Identify players to clean up
  const testPlayers = players.filter(player => {
    const id = player.id || player.playerId;
    return !PRESERVE_PLAYERS.includes(id) && (
      id.startsWith('shell-player-') ||
      id.startsWith('cli-player-') ||
      id.startsWith('test-') ||
      id.includes('-test')
    );
  });
  
  if (testPlayers.length === 0) {
    console.log('No test players found to clean up.');
    rl.close();
    return;
  }
  
  // Show players that will be deleted
  console.log('The following test players will be deleted:\n');
  testPlayers.forEach(player => {
    const id = player.id || player.playerId;
    console.log(`  • ${id} (Score: ${player.score || 0}, Level: ${player.level || 'novice'})`);
  });
  
  console.log(`\nTotal: ${testPlayers.length} players`);
  console.log('\nPreserving:', PRESERVE_PLAYERS.join(', '));
  
  // Confirm deletion
  rl.question('\nProceed with deletion? (y/N): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      console.log('\n🗑️  Deleting test players...\n');
      
      let deleted = 0;
      let failed = 0;
      
      for (const player of testPlayers) {
        const id = player.id || player.playerId;
        process.stdout.write(`Deleting ${id}... `);
        
        const success = await deletePlayer(id);
        if (success) {
          console.log('✅');
          deleted++;
        } else {
          console.log('❌');
          failed++;
        }
      }
      
      console.log(`\n✅ Deleted: ${deleted} players`);
      if (failed > 0) {
        console.log(`❌ Failed: ${failed} players`);
        console.log('\nNote: The API may not have a delete endpoint. You might need to:');
        console.log('1. Clear the Redis database manually');
        console.log('2. Or implement a delete endpoint in the engine');
      }
    } else {
      console.log('\nCancelled.');
    }
    
    rl.close();
  });
}

// Alternative approach using Redis directly
async function cleanupViaRedis() {
  console.log('\n📝 Alternative: Direct Redis Cleanup Commands\n');
  console.log('If the API delete doesn\'t work, you can use these Redis commands:\n');
  
  const players = await getPlayers();
  const testPlayers = players.filter(player => {
    const id = player.id || player.playerId;
    return !PRESERVE_PLAYERS.includes(id) && (
      id.startsWith('shell-player-') ||
      id.startsWith('cli-player-') ||
      id.startsWith('test-') ||
      id.includes('-test')
    );
  });
  
  console.log('# Connect to Redis');
  console.log('redis-cli\n');
  
  console.log('# Remove test players from the players set');
  testPlayers.forEach(player => {
    const id = player.id || player.playerId;
    console.log(`SREM game:players "${id}"`);
  });
  
  console.log('\n# Delete player state keys');
  testPlayers.forEach(player => {
    const id = player.id || player.playerId;
    console.log(`DEL "game:state:${id}"`);
  });
  
  console.log('\n# Verify remaining players');
  console.log('SMEMBERS game:players');
}

// Check if we should show Redis commands
if (process.argv.includes('--redis')) {
  cleanupViaRedis();
} else {
  cleanupPlayers();
} 