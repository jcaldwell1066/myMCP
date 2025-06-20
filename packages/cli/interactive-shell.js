// interactive-shell.js - Enhanced CLI loop for myMCP with LLM integration
const { Command } = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const inquirer = require('inquirer');
const axios = require('axios');
const path = require('path');

// Configuration
const config = {
  engineUrl: 'http://localhost:3000',
  playerId: process.env.PLAYER_ID || process.argv[2] || `shell-player-${Date.now()}`,
  apiTimeout: 30000, // Increased from 5000 to 30000 for LLM responses
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

function showBanner() {
  console.log(
    chalk.cyan(
      figlet.textSync('Adventure Guide', { 
        font: 'Standard',
        horizontalLayout: 'default' 
      })
    )
  );
  console.log(chalk.yellow('🧙‍♂️ Interactive Fantasy Adventure with AI Guide'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.blue('Natural conversation mode:'));
  console.log(chalk.gray('  Just speak naturally: "I want to start a quest"'));
  console.log(chalk.gray('  Your guide understands: "I completed finding allies"'));
  console.log(chalk.gray('  Ask anything: "What should I do next?"'));
  console.log();
  console.log(chalk.blue('Quick commands (optional):'));
  console.log(chalk.gray('  status, quests, history, help, clear, exit'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log();
}

async function executeEngineCommand(action, payload = {}) {
  try {
    const apiClient = createApiClient();
    const response = await apiClient.post(`/actions/${config.playerId}`, {
      type: action,
      payload,
      playerId: config.playerId,
    });
    return response.data.data;
  } catch (error) {
    handleApiError(error, `Failed to execute ${action}`);
    return null;
  }
}

async function getPlayerState() {
  try {
    const apiClient = createApiClient();
    const response = await apiClient.get(`/state/${config.playerId}`);
    return response.data.data;
  } catch (error) {
    handleApiError(error, 'Failed to get player state');
    return null;
  }
}

async function getQuests() {
  try {
    const apiClient = createApiClient();
    const response = await apiClient.get(`/quests/${config.playerId}`);
    return response.data.data;
  } catch (error) {
    handleApiError(error, 'Failed to get quests');
    return null;
  }
}

async function checkEngineHealth() {
  try {
    const healthClient = axios.create({
      baseURL: config.engineUrl,
      timeout: 3000,
    });
    const response = await healthClient.get('/health');
    return response.data;
  } catch (error) {
    return null;
  }
}

async function processInput(input) {
  const trimmed = input.trim();
  
  if (!trimmed) return;
  
  // Handle exit commands
  if (['exit', 'quit', 'bye', 'farewell'].includes(trimmed.toLowerCase())) {
    console.log(chalk.green('🌟 Farewell, brave adventurer! May thy journey continue with wisdom and courage!'));
    process.exit(0);
  }
  
  // Handle clear
  if (trimmed.toLowerCase() === 'clear') {
    console.clear();
    showBanner();
    return;
  }
  
  // Check if it's a quick command
  const parts = trimmed.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  const quickCommands = ['status', 'quests', 'history', 'help', 'health', 'config', 'get-score', 'set-score', 'switch-player', 'list-players'];
  
  if (quickCommands.includes(command)) {
    await executeCommand(command + ' ' + args.join(' '));
  } else {
    // Everything else goes to chat (remove the 'chat' prefix requirement)
    console.log(chalk.green(`🗣️  You: ${trimmed}`));
    console.log(chalk.gray('🤖 Your guide ponders thy words...'));
    await executeCommand('chat ' + trimmed);
  }
}

async function executeCommand(fullCommand) {
  const parts = fullCommand.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  // Handle help
  if (command === 'help') {
    console.log(chalk.blue('🎯 myMCP Interactive Shell Commands:'));
    console.log();
    console.log(chalk.cyan('🏥 System Commands:'));
    console.log(chalk.yellow('  health') + chalk.gray(' - Check engine connection and LLM status'));
    console.log(chalk.yellow('  status') + chalk.gray(' - Show current player status'));
    console.log(chalk.yellow('  config') + chalk.gray(' - Show current configuration'));
    console.log();
    console.log(chalk.cyan('💬 Chat & Interaction:'));
    console.log(chalk.yellow('  chat <message>') + chalk.gray(' - Chat with the AI guide (powered by LLM!)'));
    console.log(chalk.yellow('  history [num]') + chalk.gray(' - Show recent conversation history'));
    console.log();
    console.log(chalk.cyan('📊 Player Management:'));
    console.log(chalk.yellow('  get-score') + chalk.gray(' - Get current score'));
    console.log(chalk.yellow('  set-score <number>') + chalk.gray(' - Set score (e.g., set-score 100)'));
    console.log(chalk.yellow('  switch-player <id>') + chalk.gray(' - Switch to different player (e.g., switch-player claude-player)'));
    console.log(chalk.yellow('  list-players') + chalk.gray(' - List all players and scores'));
    console.log();
    console.log(chalk.cyan('⚔️  Quest Management:'));
    console.log(chalk.yellow('  quests') + chalk.gray(' - View all quests'));
    console.log(chalk.yellow('  start-quest [id]') + chalk.gray(' - Start a quest'));
    console.log(chalk.yellow('  quest-steps') + chalk.gray(' - View active quest steps'));
    console.log(chalk.yellow('  next') + chalk.gray(' - Show current/next step'));
    console.log(chalk.yellow('  complete-step <id>') + chalk.gray(' - Complete a quest step'));
    console.log(chalk.yellow('  complete-quest') + chalk.gray(' - Finish the active quest'));
    console.log(chalk.yellow('  progress') + chalk.gray(' - Show quest progress'));
    console.log();
    console.log(chalk.cyan('🛠️  Shell Commands:'));
    console.log(chalk.yellow('  help') + chalk.gray(' - Show this help'));
    console.log(chalk.yellow('  clear') + chalk.gray(' - Clear the screen'));
    console.log(chalk.yellow('  exit') + chalk.gray(' - Exit the shell'));
    console.log();
    console.log(chalk.gray('💡 Tip: Chat messages will be sent to our AI guide powered by LLM!'));
    return;
  }
  
  // Handle clear screen
  if (command === 'clear') {
    console.clear();
    showBanner();
    return;
  }
  
  // Handle health check
  if (command === 'health') {
    const health = await checkEngineHealth();
    if (!health) {
      console.log(chalk.red('❌ Cannot connect to myMCP Engine!'));
      console.log(chalk.gray('   Make sure the engine is running: cd packages/engine && npm start'));
      return;
    }
    
    console.log(chalk.green('✅ Engine is running!'));
    console.log(chalk.blue(`🔧 Version: ${health.version}`));
    console.log(chalk.blue(`🎮 Active states: ${health.activeStates}`));
    console.log(chalk.blue(`🔌 WebSocket connections: ${health.wsConnections}`));
    
    if (health.llm) {
      console.log(chalk.blue(`🤖 LLM enabled: ${health.llm.enabled}`));
      console.log(chalk.blue(`📡 Providers: ${health.llm.availableProviders.join(', ')}`));
      if (health.llm.enabled) {
        const workingProviders = Object.entries(health.llm.providers)
          .filter(([_, working]) => working)
          .map(([provider, _]) => provider);
        console.log(chalk.green(`✨ Active LLM: ${workingProviders.join(', ')}`));
      }
    }
    return;
  }
  
  // Handle status
  if (command === 'status') {
    const state = await getPlayerState();
    if (!state) return;
    
    console.log(chalk.bold.blue('📊 Current Status'));
    console.log(chalk.gray('─'.repeat(30)));
    console.log(chalk.green(`👤 Player: ${state.player.name}`));
    console.log(chalk.yellow(`⭐ Score: ${state.player.score} points`));
    console.log(chalk.magenta(`🎯 Level: ${state.player.level}`));
    console.log(chalk.blue(`📍 Location: ${state.player.location}`));
    console.log(chalk.cyan(`💭 Status: ${state.player.status}`));
    
    if (state.quests.active) {
      console.log(chalk.cyan(`⚔️  Current Quest: ${state.quests.active.title}`));
    } else {
      console.log(chalk.gray('⚔️  Current Quest: None (ready for adventure!)'));
    }
    
    const sessionTime = Math.floor((Date.now() - new Date(state.session.startTime).getTime()) / 1000);
    console.log(chalk.gray(`⏱️  Session Time: ${sessionTime}s`));
    console.log(chalk.gray(`🎲 Turn Count: ${state.session.turnCount}`));
    console.log(chalk.gray(`💬 Conversations: ${state.session.conversationHistory.length}`));
    return;
  }
  
  // Handle chat - Route to LLM!
  if (command === 'chat') {
    const message = args.join(' ');
    if (!message) {
      console.log(chalk.yellow('Please provide a message: chat Hello, wise guide!'));
      return;
    }
    
    console.log(chalk.green(`🗣️  You: ${message}`));
    console.log(chalk.gray('🤖 Thinking...'));
    
    const result = await executeEngineCommand('CHAT', { message });
    if (result && result.botResponse) {
      console.log(chalk.cyan(`🤖 Bot: ${result.botResponse.message}`));
      
      // Show LLM metadata if available
      if (result.llmMetadata && result.llmMetadata.provider !== 'fallback') {
        console.log(chalk.gray(`   💡 Generated by ${result.llmMetadata.provider} (${result.llmMetadata.responseTime}ms, ${result.llmMetadata.tokensUsed} tokens)`));
      } else if (result.llmMetadata && result.llmMetadata.provider === 'fallback') {
        console.log(chalk.gray(`   💡 Enhanced fallback response (no LLM API key)`));
      }
    }
    return;
  }
  
  // Handle get-score
  if (command === 'get-score') {
    const state = await getPlayerState();
    if (!state) return;
    
    console.log(chalk.green(`⭐ Current score: ${state.player.score} points`));
    console.log(chalk.magenta(`🎯 Level: ${state.player.level}`));
    
    const levelMessages = {
      novice: 'Every master was once a beginner. Keep adventuring!',
      apprentice: 'You are making good progress! Greater challenges await.',
      expert: 'Impressive skills! You are becoming a true hero.',
      master: 'Legendary! The realm sings of your achievements.',
    };
    
    console.log(chalk.gray(`💭 ${levelMessages[state.player.level] || 'Keep up the great work!'}`));
    return;
  }
  
  // Handle set-score
  if (command === 'set-score') {
    const scoreStr = args[0];
    if (!scoreStr) {
      console.log(chalk.yellow('Please provide a score: set-score 100'));
      return;
    }
    
    const score = parseInt(scoreStr, 10);
    if (isNaN(score) || score < 0) {
      console.log(chalk.red('❌ Invalid score. Please provide a positive number.'));
      return;
    }
    
    const currentState = await getPlayerState();
    if (!currentState) return;
    
    const oldScore = currentState.player.score;
    const result = await executeEngineCommand('SET_SCORE', { score });
    
    if (result) {
      const scoreDiff = score - oldScore;
      if (scoreDiff > 0) {
        console.log(chalk.green(`🎉 Score increased by ${scoreDiff} points!`));
      } else if (scoreDiff < 0) {
        console.log(chalk.yellow(`📉 Score decreased by ${Math.abs(scoreDiff)} points.`));
      } else {
        console.log(chalk.blue('📊 Score updated (no change).'));
      }
      
      const newState = await getPlayerState();
      if (newState) {
        console.log(chalk.cyan(`⭐ New score: ${newState.player.score} points (Level: ${newState.player.level})`));
      }
    }
    return;
  }
  
  // Handle quests
  if (command === 'quests') {
    const questsData = await getQuests();
    if (!questsData) return;
    
    console.log(chalk.bold.blue('🗡️  Quest Status'));
    console.log(chalk.gray('─'.repeat(30)));
    
    if (questsData.active) {
      console.log(chalk.green('⚔️  Active Quest:'));
      console.log(chalk.cyan(`   ${questsData.active.title}`));
      console.log(chalk.gray(`   ${questsData.active.description}`));
      console.log(chalk.yellow(`   Progress: ${questsData.active.steps.filter(s => s.completed).length}/${questsData.active.steps.length} steps`));
      console.log();
    }
    
    if (questsData.available.length > 0) {
      console.log(chalk.blue('📋 Available Quests:'));
      questsData.available.forEach((quest, index) => {
        console.log(chalk.yellow(`   ${index + 1}. ${quest.title} (${quest.id})`));
        console.log(chalk.gray(`      ${quest.description}`));
      });
      console.log();
    }
    
    if (questsData.completed.length > 0) {
      console.log(chalk.green('✅ Completed Quests:'));
      questsData.completed.forEach((quest, index) => {
        console.log(chalk.green(`   ${index + 1}. ${quest.title}`));
      });
    }
    return;
  }
  
  // Handle history
  if (command === 'history') {
    const count = args[0] ? parseInt(args[0], 10) : 10;
    const state = await getPlayerState();
    if (!state) return;
    
    const recent = state.session.conversationHistory.slice(-count);
    
    if (recent.length === 0) {
      console.log(chalk.gray('📜 No conversation history yet. Start chatting with "chat <message>"!'));
      return;
    }
    
    console.log(chalk.blue(`📜 Recent Conversation History (last ${recent.length} messages):`));
    console.log(chalk.gray('─'.repeat(50)));
    
    recent.forEach((msg) => {
      const timeStr = new Date(msg.timestamp).toLocaleTimeString();
      const icon = msg.sender === 'player' ? '🗣️ ' : '🤖';
      const color = msg.sender === 'player' ? chalk.green : chalk.cyan;
      console.log(color(`${icon} [${timeStr}] ${msg.message}`));
    });
    return;
  }
  
  // Handle config
  if (command === 'config') {
    console.log(chalk.blue('🔧 Shell Configuration:'));
    console.log(chalk.gray('─'.repeat(25)));
    console.log(chalk.yellow(`Engine URL: ${config.engineUrl}`));
    console.log(chalk.yellow(`Player ID: ${config.playerId}`));
    console.log(chalk.yellow(`API Timeout: ${config.apiTimeout}ms`));
    return;
  }
  
  // Handle switch-player
  if (command === 'switch-player') {
    const newPlayerId = args[0];
    if (!newPlayerId) {
      console.log(chalk.yellow('Please provide a player ID: switch-player claude-player'));
      return;
    }
    
    const oldPlayerId = config.playerId;
    config.playerId = newPlayerId;
    console.log(chalk.green(`✅ Switched from ${oldPlayerId} to ${newPlayerId}`));
    
    // Try to get new player status
    const state = await getPlayerState();
    if (state) {
      console.log(chalk.cyan(`👤 Now playing as: ${state.player.name} (Score: ${state.player.score})`));
    }
    return;
  }
  
  // Handle list-players
  if (command === 'list-players') {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.get('/players');
      const players = response.data.data;
      
      console.log(chalk.bold.blue('🎮 All Players'));
      console.log(chalk.gray('─'.repeat(60)));
      
      if (players.length === 0) {
        console.log(chalk.gray('No players found'));
        return;
      }
      
      // Sort by score descending
      players.sort((a, b) => b.score - a.score);
      
      players.forEach((player, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
        const scoreColor = player.score >= 1000 ? chalk.yellow : player.score >= 500 ? chalk.green : chalk.white;
        const current = player.id === config.playerId ? ' ← (current)' : '';
        
        console.log(`${medal} ${chalk.cyan(player.id.padEnd(25))} ${scoreColor(player.score.toString().padStart(6) + ' pts')} ${chalk.magenta(player.level.padEnd(10))} ${chalk.gray(player.status)}${chalk.blue(current)}`);
      });
      
      console.log(chalk.gray('\n─'.repeat(60)));
      console.log(chalk.gray(`Total players: ${players.length}`));
    } catch (error) {
      handleApiError(error, 'Failed to list players');
    }
    return;
  }
  
  // Handle unknown commands
  console.log(chalk.red(`❌ Unknown command: ${command}`));
  console.log(chalk.gray('Type "help" for available commands.'));
}

async function startShell() {
  console.clear();
  showBanner();
  
  // Test connection first
  console.log(chalk.blue('🔧 Testing connection to myMCP Engine...'));
  const health = await checkEngineHealth();
  
  if (!health) {
    console.log(chalk.red('⚠️  Warning: Could not connect to engine'));
    console.log(chalk.gray('   Make sure engine is running: cd packages/engine && npm start'));
  } else {
    console.log(chalk.green('✓ Connected to engine successfully!'));
    if (health.llm && health.llm.enabled) {
      const workingProviders = Object.entries(health.llm.providers)
        .filter(([_, working]) => working)
        .map(([provider, _]) => provider);
      console.log(chalk.green(`✨ LLM AI enabled with: ${workingProviders.join(', ')}`));
    } else {
      console.log(chalk.yellow('💡 LLM not configured - using enhanced fallback responses'));
    }
  }
  console.log();
  
  // Main command loop
  while (true) {
    try {
      const { command } = await inquirer.prompt([{
        type: 'input',
        name: 'command',
        message: chalk.cyan('Adventure>'), // Changed from myMCP>
        validate: () => true // Allow empty input
      }]);
      
      await processInput(command);
      
    } catch (error) {
      if (error.name === 'ExitPromptError') {
        console.log(chalk.green('\n🎮 Goodbye, adventurer!'));
        process.exit(0);
      } else {
        console.log(chalk.red('Shell error:'), error.message);
      }
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(chalk.green('\n🎮 Goodbye, adventurer!'));
  process.exit(0);
});

// Start the shell
startShell().catch(error => {
  console.error(chalk.red('Failed to start shell:'), error.message);
  process.exit(1);
});
