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
  playerId: `shell-player-${Date.now()}`,
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
      figlet.textSync('myMCP Shell', { 
        font: 'Standard',
        horizontalLayout: 'default' 
      })
    )
  );
  console.log(chalk.yellow('🗡️  Interactive Fantasy CLI Shell'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.blue('Available commands:'));
  console.log(chalk.gray('  status, get-score, set-score <num>, chat <msg>'));
  console.log(chalk.gray('  start-quest [id], quests, quest-steps, next, progress'));
  console.log(chalk.gray('  complete-step <id>, complete-quest, history, config'));
  console.log(chalk.gray('  health, help, clear, exit'));
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

async function executeCommand(input) {
  const trimmed = input.trim();
  
  if (!trimmed) return;
  
  const parts = trimmed.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);
  
  // Handle exit commands
  if (['exit', 'quit', 'bye', 'q'].includes(command)) {
    console.log(chalk.green('🎮 Thanks for playing! Goodbye, adventurer!'));
    process.exit(0);
  }
  
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
        message: chalk.cyan('myMCP>'),
        validate: () => true // Allow empty input
      }]);
      
      await executeCommand(command);
      
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
