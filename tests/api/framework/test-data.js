/**
 * Test Data Management for myMCP Engine Tests
 * Handles test players, game states, and cleanup
 */

const path = require('path');
const fs = require('fs');

class TestData {
  constructor() {
    this.testPlayers = new Map();
    this.gameStatesFile = path.join(process.cwd(), 'packages', 'engine', 'data', 'game-states.json');
    this.backupFile = this.gameStatesFile + '.test-backup';
  }

  /**
   * Create a test player with specified configuration
   */
  createPlayer(playerId = null, config = {}) {
    const id = playerId || `test-player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const player = {
      id,
      name: config.name || 'TestHero',
      score: config.score || 0,
      level: config.level || 'novice',
      status: config.status || 'idle',
      location: config.location || 'town',
      ...config
    };
    
    this.testPlayers.set(id, player);
    return player;
  }

  /**
   * Get test player data
   */
  getPlayer(playerId) {
    return this.testPlayers.get(playerId);
  }

  /**
   * Create test quest data
   */
  createQuest(questId = null, config = {}) {
    const id = questId || `test-quest-${Date.now()}`;
    
    return {
      id,
      title: config.title || 'Test Quest',
      description: config.description || 'A test quest for automated testing',
      realWorldSkill: config.realWorldSkill || 'Test automation',
      fantasyTheme: config.fantasyTheme || 'Testing the mystical APIs',
      status: config.status || 'available',
      steps: config.steps || [
        {
          id: 'test-step-1',
          description: 'Complete the first test step',
          completed: false
        }
      ],
      reward: config.reward || {
        score: 50,
        items: ['Test Badge']
      }
    };
  }

  /**
   * Create test game action
   */
  createAction(type, payload, playerId = null) {
    const player = playerId || this.getRandomTestPlayer();
    
    return {
      type,
      payload,
      playerId: player.id,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get a random test player
   */
  getRandomTestPlayer() {
    const players = Array.from(this.testPlayers.values());
    return players.length > 0 ? players[0] : this.createPlayer();
  }

  /**
   * Backup current game states
   */
  async backupGameStates() {
    try {
      if (fs.existsSync(this.gameStatesFile)) {
        fs.copyFileSync(this.gameStatesFile, this.backupFile);
      }
    } catch (error) {
      console.warn(`Warning: Could not backup game states: ${error.message}`);
    }
  }

  /**
   * Restore game states from backup
   */
  async restoreGameStates() {
    try {
      if (fs.existsSync(this.backupFile)) {
        fs.copyFileSync(this.backupFile, this.gameStatesFile);
        fs.unlinkSync(this.backupFile);
      }
    } catch (error) {
      console.warn(`Warning: Could not restore game states: ${error.message}`);
    }
  }

  /**
   * Clean up test data
   */
  async cleanup() {
    try {
      // Remove test players from game states file
      if (fs.existsSync(this.gameStatesFile)) {
        const gameStates = JSON.parse(fs.readFileSync(this.gameStatesFile, 'utf8'));
        
        // Remove any players that start with 'test-' or are in our test players map
        const cleanedStates = {};
        for (const [playerId, state] of Object.entries(gameStates)) {
          if (!playerId.startsWith('test-') && !this.testPlayers.has(playerId)) {
            cleanedStates[playerId] = state;
          }
        }
        
        fs.writeFileSync(this.gameStatesFile, JSON.stringify(cleanedStates, null, 2));
      }
      
      // Clear test players map
      this.testPlayers.clear();
      
    } catch (error) {
      console.warn(`Warning: Could not clean up test data: ${error.message}`);
    }
  }

  /**
   * Generate test scenarios
   */
  getTestScenarios() {
    return {
      newPlayer: {
        description: 'Brand new player with default state',
        player: this.createPlayer('scenario-new-player', {
          score: 0,
          level: 'novice',
          status: 'idle'
        })
      },
      
      experiencedPlayer: {
        description: 'Experienced player with high score',
        player: this.createPlayer('scenario-experienced-player', {
          score: 750,
          level: 'expert',
          status: 'idle'
        })
      },
      
      activeQuestPlayer: {
        description: 'Player with an active quest',
        player: this.createPlayer('scenario-active-quest-player', {
          score: 200,
          level: 'apprentice',
          status: 'in-quest',
          currentQuest: 'global-meeting'
        })
      },
      
      chatScenarios: [
        { message: 'Hello!', expectedKeywords: ['greetings', 'hero', 'assist'] },
        { message: 'What quests are available?', expectedKeywords: ['quest', 'available'] },
        { message: 'What is my score?', expectedKeywords: ['score', 'points'] },
        { message: 'Help me', expectedKeywords: ['help', 'assist', 'guide'] }
      ],
      
      actionScenarios: [
        {
          type: 'SET_SCORE',
          payload: { score: 100 },
          description: 'Set player score to 100'
        },
        {
          type: 'CHAT',
          payload: { message: 'Test chat message' },
          description: 'Send a chat message'
        },
        {
          type: 'START_QUEST',
          payload: { questId: 'server-health' },
          description: 'Start the server health quest'
        }
      ]
    };
  }

  /**
   * Validate game state structure
   */
  validateGameState(gameState) {
    const required = ['player', 'quests', 'inventory', 'session', 'metadata'];
    const missing = required.filter(field => !gameState[field]);
    
    if (missing.length > 0) {
      throw new Error(`Game state missing required fields: ${missing.join(', ')}`);
    }
    
    // Validate player structure
    const playerRequired = ['id', 'name', 'score', 'level', 'status', 'location'];
    const playerMissing = playerRequired.filter(field => gameState.player[field] === undefined);
    
    if (playerMissing.length > 0) {
      throw new Error(`Player state missing required fields: ${playerMissing.join(', ')}`);
    }
    
    return true;
  }
}

module.exports = TestData;
