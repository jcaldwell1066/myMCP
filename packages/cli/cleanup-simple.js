#!/usr/bin/env node

/**
 * Simple cleanup script using existing API endpoints
 */

const axios = require('axios');

const ENGINE_URL = process.env.ENGINE_URL || 'http://localhost:3000';

// Players to preserve
const PRESERVE_PLAYERS = [
  'claude-player',
  'default-player',
  'default',
  'slack-U444KV81E'
];

async function cleanupPlayers() {
  console.log('🧹 Cleaning up test players...\n');
  
  try {
    // Get all players
    const response = await axios.get(`${ENGINE_URL}/api/players`);
    const players = response.data.data || [];
    
    console.log(`Found ${players.length} total players\n`);
    
    // Identify test players
    const testPlayers = players.filter(player => {
      const id = player.id || player.playerId;
      return !PRESERVE_PLAYERS.includes(id) && (
        id.startsWith('shell-player-') ||
        id.startsWith('cli-player-') ||
        id.startsWith('test-') ||
        id.includes('-test')
      );
    });
    
    console.log(`Test players to remove: ${testPlayers.length}`);
    testPlayers.forEach(player => {
      const id = player.id || player.playerId;
      console.log(`  • ${id} (Score: ${player.score || 0})`);
    });
    
    console.log('\nSince the API doesn\'t have a delete endpoint, here\'s a workaround:\n');
    console.log('Option 1: Use Redis CLI directly');
    console.log('─────────────────────────────────');
    console.log('redis-cli');
    
    testPlayers.forEach(player => {
      const id = player.id || player.playerId;
      console.log(`SREM game:players "${id}"`);
      console.log(`DEL "game:state:${id}"`);
    });
    
    console.log('\nOption 2: Reset test players to minimal state');
    console.log('─────────────────────────────────────────────');
    console.log('(This keeps them in the system but resets their data)\n');
    
    // Reset test players to minimal state
    for (const player of testPlayers) {
      const id = player.id || player.playerId;
      try {
        // Reset score to 0
        await axios.post(`${ENGINE_URL}/api/actions/${id}`, {
          type: 'SET_SCORE',
          payload: { score: 0 },
          playerId: id
        });
        
        // Update name to indicate it's cleaned
        await axios.put(`${ENGINE_URL}/api/state/${id}/player`, {
          name: `[cleaned] ${id}`,
          level: 'novice'
        });
        
        console.log(`✅ Reset ${id}`);
      } catch (error) {
        console.log(`❌ Failed to reset ${id}`);
      }
    }
    
    console.log('\n✅ Cleanup complete!');
    console.log('\nPreserved players:', PRESERVE_PLAYERS.join(', '));
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run cleanup
cleanupPlayers(); 