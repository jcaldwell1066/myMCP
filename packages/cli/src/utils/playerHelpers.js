/**
 * Shared utility functions for player management
 */

/**
 * Identifies test players that can be safely cleaned up
 * @param {Array} players - Array of player objects or player IDs
 * @param {Array} preservePlayers - Array of player IDs to preserve
 * @returns {Array} Array of test players
 */
function identifyTestPlayers(players, preservePlayers = []) {
  return players.filter(player => {
    // Handle both direct player IDs (strings) and player objects
    const id = typeof player === 'string' ? player : (player.id || player.playerId);
    
    // Check if player should be preserved
    if (preservePlayers.includes(id)) {
      return false;
    }
    
    // Check if player ID matches test patterns
    return (
      id.startsWith('shell-player-') ||
      id.startsWith('cli-player-') ||
      id.startsWith('test-') ||
      id.includes('-test')
    );
  });
}

/**
 * Default list of players to preserve during cleanup
 */
const DEFAULT_PRESERVE_PLAYERS = [
  'claude-player',
  'default-player',
  'default'
];

module.exports = {
  identifyTestPlayers,
  DEFAULT_PRESERVE_PLAYERS
}; 