#!/usr/bin/env node

/**
 * Enhanced myMCP CLI - Multi-player ready with state verification
 */

const { Command } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

const program = new Command();

// Configuration
const config = {
  engineUrl: 'http://localhost:3000',
  defaultPlayerId: 'claude-player', // Default to Claude's player for compatibility
  apiTimeout: 5000,
};

// Create API client
function createApiClient() {
  return axios.create({
    baseURL: config.engineUrl + '/api',
    timeout: config.apiTimeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Error handling utility
function handleApiError(error, defaultMessage = 'An error occurred') {
  if (error.response) {
    console.log(chalk.red(`❌ Error ${error.response.status}: ${error.response.data?.error || error.response.statusText}`));
  } else if (error.request) {
    console.log(chalk.red('❌ No response from engine. Is the myMCP Engine running?'));
    console.log(chalk.gray('   Start engine: cd packages/engine && npm start'));
  } else {
    console.log(chalk.red(`❌ ${defaultMessage}: ${error.message}`));
  }
}

// Format timestamp
function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString();
}

// Format quest status with color
function formatQuestStatus(status) {
  const colors = {
    available: chalk.blue,
    active: chalk.yellow,
    completed: chalk.green,
  };
  return (colors[status] || chalk.gray)(status.toUpperCase());
}

// List all players
program
  .command('players')
  .description('List all active players in the game')
  .action(async () => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.get('/players');
      const players = response.data.data;
      
      console.log(chalk.blue('🎮 Active Players'));
      console.log(chalk.gray('─'.repeat(60)));
      
      if (players.length === 0) {
        console.log(chalk.yellow('No active players found.'));
        return;
      }
      
      players.forEach(player => {
        console.log(chalk.green(`👤 ${player.name} (${player.id})`));
        console.log(chalk.gray(`   Level: ${player.level} | Score: ${player.score} | Status: ${player.status}`));
        console.log(chalk.gray(`   Location: ${player.location} | Last Action: ${formatTime(player.lastAction)}`));
        if (player.activeQuest) {
          console.log(chalk.yellow(`   🗡️  Active Quest: ${player.activeQuest}`));
        }
        console.log();
      });
      
      console.log(chalk.blue(`Total Players: ${players.length}`));
    } catch (error) {
      handleApiError(error, 'Failed to list players');
    }
  });

// Enhanced status command with player selection
program
  .command('status')
  .description('Show detailed game status for a player')
  .option('-p, --player <playerId>', 'Player ID to check', config.defaultPlayerId)
  .action(async (options) => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.get(`/state/${options.player}`);
      const state = response.data.data;
      
      console.log(chalk.blue(`📊 Player Status: ${state.player.name} (${state.player.id})`));
      console.log(chalk.gray('─'.repeat(50)));
      
      // Player info
      console.log(chalk.green(`👤 Name: ${state.player.name}`));
      console.log(chalk.yellow(`⭐ Score: ${state.player.score} points`));
      console.log(chalk.magenta(`🎯 Level: ${state.player.level}`));
      console.log(chalk.blue(`📍 Location: ${state.player.location}`));
      console.log(chalk.cyan(`🎭 Status: ${state.player.status}`));
      
      // Session info
      console.log();
      console.log(chalk.blue('📱 Session Info'));
      console.log(chalk.gray(`   Started: ${formatTime(state.session.startTime)}`));
      console.log(chalk.gray(`   Last Action: ${formatTime(state.session.lastAction)}`));
      console.log(chalk.gray(`   Turn Count: ${state.session.turnCount}`));
      console.log(chalk.gray(`   Messages: ${state.session.conversationHistory.length}`));
      
      // Quest status
      console.log();
      console.log(chalk.blue('⚔️  Quest Status'));
      if (state.quests.active) {
        const quest = state.quests.active;
        console.log(chalk.yellow(`🔥 ACTIVE: ${quest.title}`));
        console.log(chalk.gray(`   ${quest.description}`));
        console.log(chalk.gray(`   Skill: ${quest.realWorldSkill}`));
        
        // Steps progress
        const completedSteps = quest.steps.filter(s => s.completed).length;
        console.log(chalk.blue(`   Progress: ${completedSteps}/${quest.steps.length} steps`));
        
        quest.steps.forEach((step, idx) => {
          const status = step.completed ? chalk.green('✅') : chalk.gray('⏳');
          console.log(`   ${idx + 1}. ${status} ${step.description}`);
        });
      } else {
        console.log(chalk.gray('   No active quest'));
      }
      
      console.log(chalk.blue(`   Available: ${state.quests.available.length} quests`));
      console.log(chalk.green(`   Completed: ${state.quests.completed.length} quests`));
      
      // Inventory
      console.log();
      console.log(chalk.blue(`🎒 Inventory (${state.inventory.items.length}/${state.inventory.capacity})`));
      if (state.inventory.items.length > 0) {
        state.inventory.items.forEach(item => {
          console.log(chalk.green(`   💎 ${item.name}`));
        });
      } else {
        console.log(chalk.gray('   Empty'));
      }
      
    } catch (error) {
      handleApiError(error, 'Failed to get player status');
    }
  });

// Quest details command
program
  .command('quests')
  .description('Show detailed quest information')
  .option('-p, --player <playerId>', 'Player ID to check', config.defaultPlayerId)
  .option('-a, --available', 'Show only available quests')
  .option('-c, --completed', 'Show only completed quests')
  .action(async (options) => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.get(`/quests/${options.player}`);
      const quests = response.data.data;
      
      console.log(chalk.blue('⚔️  Quest Status'));
      console.log(chalk.gray('─'.repeat(50)));
      
      // Active quest
      if (quests.active && !options.available && !options.completed) {
        console.log(chalk.yellow('🔥 ACTIVE QUEST'));
        const quest = quests.active;
        console.log(chalk.green(`   ${quest.title}`));
        console.log(chalk.gray(`   ${quest.description}`));
        console.log(chalk.blue(`   Real Skill: ${quest.realWorldSkill}`));
        
        const completedSteps = quest.steps.filter(s => s.completed).length;
        console.log(chalk.yellow(`   Progress: ${completedSteps}/${quest.steps.length} steps completed`));
        
        quest.steps.forEach((step, idx) => {
          const status = step.completed ? chalk.green('✅') : chalk.red('❌');
          console.log(`     ${idx + 1}. ${status} ${step.description}`);
        });
        
        console.log(chalk.magenta(`   Reward: ${quest.reward.score} points + ${quest.reward.items.join(', ')}`));
        console.log();
      }
      
      // Available quests
      if ((!options.completed && quests.available.length > 0) || options.available) {
        console.log(chalk.blue(`📋 AVAILABLE QUESTS (${quests.available.length})`));
        quests.available.forEach((quest, idx) => {
          console.log(chalk.cyan(`${idx + 1}. ${quest.title}`));
          console.log(chalk.gray(`   ${quest.description}`));
          console.log(chalk.blue(`   Skill: ${quest.realWorldSkill}`));
          console.log(chalk.magenta(`   Reward: ${quest.reward.score} points`));
          console.log();
        });
      }
      
      // Completed quests
      if ((!options.available && quests.completed.length > 0) || options.completed) {
        console.log(chalk.green(`✅ COMPLETED QUESTS (${quests.completed.length})`));
        quests.completed.forEach((quest, idx) => {
          console.log(chalk.green(`${idx + 1}. ${quest.title} (${quest.reward.score} points)`));
        });
      }
      
    } catch (error) {
      handleApiError(error, 'Failed to get quest information');
    }
  });

// Chat command with player selection
program
  .command('chat')
  .description('Chat with the AI guide')
  .argument('[message]', 'Message to send')
  .option('-p, --player <playerId>', 'Player ID to use', config.defaultPlayerId)
  .action(async (message, options) => {
    if (!message) {
      console.log(chalk.yellow('Please provide a message: mycli chat "Hello!" -p player-id'));
      return;
    }
    
    try {
      const apiClient = createApiClient();
      const response = await apiClient.post(`/actions/${options.player}`, {
        type: 'CHAT',
        payload: { message },
        playerId: options.player,
      });
      
      const result = response.data.data;
      console.log(chalk.green(`🗣️  You (${options.player}): ${message}`));
      console.log(chalk.cyan(`🤖 Bot: ${result.botResponse.message}`));
      
      // Show any executed actions
      if (result.executedActions && result.executedActions.length > 0) {
        console.log();
        console.log(chalk.yellow('🎯 Actions Executed:'));
        result.executedActions.forEach(action => {
          console.log(chalk.blue(`   ⚡ ${action.action.type}: ${JSON.stringify(action.result)}`));
        });
      }
      
      if (result.llmMetadata && result.llmMetadata.provider !== 'fallback') {
        console.log(chalk.gray(`   (via ${result.llmMetadata.provider})`));
      }
    } catch (error) {
      handleApiError(error, 'Failed to send chat message');
    }
  });

// State comparison command (useful for debugging)
program
  .command('compare')
  .description('Compare state between two players or before/after actions')
  .option('-1, --player1 <playerId>', 'First player ID', config.defaultPlayerId)
  .option('-2, --player2 <playerId>', 'Second player ID')
  .action(async (options) => {
    if (!options.player2) {
      console.log(chalk.yellow('Please provide a second player ID: mycli compare -1 player1 -2 player2'));
      return;
    }
    
    try {
      const apiClient = createApiClient();
      const [response1, response2] = await Promise.all([
        apiClient.get(`/state/${options.player1}`),
        apiClient.get(`/state/${options.player2}`)
      ]);
      
      const state1 = response1.data.data;
      const state2 = response2.data.data;
      
      console.log(chalk.blue('🔍 Player Comparison'));
      console.log(chalk.gray('─'.repeat(50)));
      
      console.log(`${chalk.green('Player 1:')} ${state1.player.name} (${state1.player.id})`);
      console.log(`${chalk.green('Player 2:')} ${state2.player.name} (${state2.player.id})`);
      console.log();
      
      // Compare key metrics
      const comparisons = [
        { label: 'Score', val1: state1.player.score, val2: state2.player.score },
        { label: 'Level', val1: state1.player.level, val2: state2.player.level },
        { label: 'Status', val1: state1.player.status, val2: state2.player.status },
        { label: 'Location', val1: state1.player.location, val2: state2.player.location },
        { label: 'Active Quest', val1: state1.quests.active?.title || 'None', val2: state2.quests.active?.title || 'None' },
        { label: 'Completed Quests', val1: state1.quests.completed.length, val2: state2.quests.completed.length },
        { label: 'Inventory Items', val1: state1.inventory.items.length, val2: state2.inventory.items.length },
        { label: 'Turn Count', val1: state1.session.turnCount, val2: state2.session.turnCount },
      ];
      
      comparisons.forEach(comp => {
        const match = comp.val1 === comp.val2;
        const color = match ? chalk.gray : chalk.yellow;
        console.log(color(`${comp.label}: ${comp.val1} | ${comp.val2} ${match ? '✅' : '⚠️'}`));
      });
      
    } catch (error) {
      handleApiError(error, 'Failed to compare players');
    }
  });

// Watch command for real-time monitoring
program
  .command('watch')
  .description('Watch a player\'s state for changes (polls every 2 seconds)')
  .option('-p, --player <playerId>', 'Player ID to watch', config.defaultPlayerId)
  .option('-i, --interval <seconds>', 'Polling interval in seconds', '2')
  .action(async (options) => {
    const interval = parseInt(options.interval) * 1000;
    let lastState = null;
    
    console.log(chalk.blue(`👀 Watching player: ${options.player} (polling every ${options.interval}s)`));
    console.log(chalk.gray('Press Ctrl+C to stop'));
    console.log(chalk.gray('─'.repeat(50)));
    
    const watchLoop = async () => {
      try {
        const apiClient = createApiClient();
        const response = await apiClient.get(`/state/${options.player}`);
        const currentState = response.data.data;
        
        if (lastState) {
          // Check for changes
          const changes = [];
          
          if (currentState.player.score !== lastState.player.score) {
            changes.push(`Score: ${lastState.player.score} → ${currentState.player.score}`);
          }
          
          if (currentState.player.status !== lastState.player.status) {
            changes.push(`Status: ${lastState.player.status} → ${currentState.player.status}`);
          }
          
          if (currentState.session.turnCount !== lastState.session.turnCount) {
            changes.push(`Turn Count: ${lastState.session.turnCount} → ${currentState.session.turnCount}`);
          }
          
          const activeQuest1 = currentState.quests.active?.title || 'None';
          const activeQuest2 = lastState.quests.active?.title || 'None';
          if (activeQuest1 !== activeQuest2) {
            changes.push(`Active Quest: ${activeQuest2} → ${activeQuest1}`);
          }
          
          if (changes.length > 0) {
            console.log(chalk.yellow(`📝 [${new Date().toLocaleTimeString()}] Changes detected:`));
            changes.forEach(change => console.log(chalk.green(`   ✨ ${change}`)));
            console.log();
          }
        }
        
        lastState = JSON.parse(JSON.stringify(currentState)); // Deep copy
        
      } catch (error) {
        console.log(chalk.red(`❌ [${new Date().toLocaleTimeString()}] ${error.message}`));
      }
      
      setTimeout(watchLoop, interval);
    };
    
    watchLoop();
  });

// Enhanced health check
program
  .command('health')
  .description('Check engine connection and system status')
  .action(async () => {
    try {
      const healthClient = axios.create({
        baseURL: config.engineUrl,
        timeout: 3000,
      });
      const response = await healthClient.get('/health');
      
      console.log(chalk.green('✅ Engine is running!'));
      console.log(chalk.blue(`🔧 Version: ${response.data.version}`));
      console.log(chalk.blue(`🎮 Active states: ${response.data.activeStates}`));
      console.log(chalk.blue(`🔌 WebSocket connections: ${response.data.wsConnections}`));
      
      if (response.data.llm) {
        console.log(chalk.blue(`🤖 LLM enabled: ${response.data.llm.enabled}`));
        console.log(chalk.blue(`📡 Providers: ${response.data.llm.availableProviders.join(', ')}`));
      }
      
      // Test API endpoints
      console.log();
      console.log(chalk.blue('🧪 Testing API endpoints...'));
      
      try {
        const apiClient = createApiClient();
        await apiClient.get('/players');
        console.log(chalk.green('   ✅ /api/players'));
      } catch (error) {
        console.log(chalk.red('   ❌ /api/players'));
      }
      
      try {
        const apiClient = createApiClient();
        await apiClient.get('/quest-catalog');
        console.log(chalk.green('   ✅ /api/quest-catalog'));
      } catch (error) {
        console.log(chalk.red('   ❌ /api/quest-catalog'));
      }
      
    } catch (error) {
      handleApiError(error, 'Failed to check engine health');
    }
  });

// Set program info
program
  .name('mycli-enhanced')
  .description('Enhanced myMCP Fantasy Chatbot CLI - Multi-player Ready')
  .version('0.2.0');

// Parse command line arguments
program.parse();

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  console.log(chalk.cyan('🗡️  Enhanced myMCP CLI - Multi-player State Verification'));
  console.log(chalk.gray('─'.repeat(60)));
  program.outputHelp();
  console.log();
  console.log(chalk.yellow('💡 Quick Start:'));
  console.log(chalk.gray('  mycli-enhanced health           - Check engine status'));
  console.log(chalk.gray('  mycli-enhanced players          - List all players'));
  console.log(chalk.gray('  mycli-enhanced status           - View Claude\'s player status'));
  console.log(chalk.gray('  mycli-enhanced status -p <id>   - View specific player'));
  console.log(chalk.gray('  mycli-enhanced quests           - View quest status'));
  console.log(chalk.gray('  mycli-enhanced watch            - Monitor state changes'));
  console.log(chalk.gray('  mycli-enhanced compare -1 p1 -2 p2 - Compare players'));
}
