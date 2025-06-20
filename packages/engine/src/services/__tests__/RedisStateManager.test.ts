import { RedisStateManager } from '../RedisStateManager';
import { GameState } from '@mymcp/types';

// Test configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const TEST_PLAYER_ID = 'test-player-debug';

describe('RedisStateManager Debug Tests', () => {
  let manager: RedisStateManager;

  beforeAll(async () => {
    // 🔴 BREAKPOINT: Test setup
    manager = new RedisStateManager(REDIS_URL, true);
  });

  afterAll(async () => {
    await manager.disconnect();
  });

  test('Create new player state', async () => {
    // 🔴 BREAKPOINT: Test player creation
    const gameState = await manager.createPlayerState(TEST_PLAYER_ID, 'Debug Hero');
    
    expect(gameState).toBeDefined();
    expect(gameState.player.id).toBe(TEST_PLAYER_ID);
    expect(gameState.player.name).toBe('Debug Hero');
    
    console.log('Created player:', gameState.player);
  });

  test('Fetch player state from Redis', async () => {
    // 🔴 BREAKPOINT: Test state retrieval
    const gameState = await manager.getPlayerState(TEST_PLAYER_ID);
    
    expect(gameState).toBeDefined();
    expect(gameState?.player.id).toBe(TEST_PLAYER_ID);
    
    console.log('Fetched state:', gameState);
  });

  test('Update player score and level', async () => {
    // 🔴 BREAKPOINT: Test state updates
    const updates: Partial<GameState> = {
      player: {
        id: TEST_PLAYER_ID,
        score: 150,
        level: 'apprentice',
        status: 'in-quest',
        name: 'Debug Hero',
        location: 'forest'
      }
    };
    
    await manager.updatePlayerState(TEST_PLAYER_ID, updates);
    await manager.updateScore(TEST_PLAYER_ID, 150);
    
    const updatedState = await manager.getPlayerState(TEST_PLAYER_ID);
    expect(updatedState?.player.score).toBe(150);
    expect(updatedState?.player.level).toBe('apprentice');
    
    console.log('Updated player:', updatedState?.player);
  });

  test('Move player between locations', async () => {
    // 🔴 BREAKPOINT: Test location changes
    await manager.movePlayer(TEST_PLAYER_ID, 'cave');
    
    const playersInCave = await manager.getPlayersInLocation('cave');
    expect(playersInCave).toContain(TEST_PLAYER_ID);
    
    console.log('Players in cave:', playersInCave);
  });

  test('Get leaderboard', async () => {
    // 🔴 BREAKPOINT: Test leaderboard
    const leaderboard = await manager.getLeaderboard(5);
    
    expect(leaderboard).toBeDefined();
    expect(leaderboard.length).toBeGreaterThan(0);
    
    console.log('Leaderboard:', leaderboard);
  });

  test('Listen for state updates', (done) => {
    // 🔴 BREAKPOINT: Test event subscriptions
    manager.on('stateUpdate', (update) => {
      console.log('Received state update:', update);
      expect(update.playerId).toBeDefined();
      done();
    });

    // Trigger an update
    manager.updatePlayerState(TEST_PLAYER_ID, {
      player: {
        id: TEST_PLAYER_ID,
        score: 200,
        name: 'Debug Hero',
        level: 'apprentice',
        status: 'idle',
        location: 'town'
      }
    });
  });
});

// Debug utility function
async function inspectRedisState(playerId: string) {
  // 🔴 BREAKPOINT: Utility for inspecting Redis state
  const manager = new RedisStateManager(REDIS_URL, true);
  
  console.log('\n=== Redis State Inspection ===');
  console.log(`Player ID: ${playerId}`);
  
  const state = await manager.getPlayerState(playerId);
  console.log('Game State:', JSON.stringify(state, null, 2));
  
  const allPlayers = await manager.getAllPlayers();
  console.log('All Players:', allPlayers);
  
  await manager.disconnect();
}

// Run inspection if called directly
if (require.main === module) {
  const playerId = process.argv[2] || TEST_PLAYER_ID;
  inspectRedisState(playerId).catch(console.error);
} 