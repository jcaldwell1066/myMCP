// interactive-shell.js - Enhanced CLI loop for myMCP with Natural Language Interface
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

async function handleQuickCommand(command, args) {
  switch (command) {
    case 'status':
      const state = await getPlayerState();
      if (!state) return;
      
      console.log(chalk.bold.blue('📊 Adventure Status'));
      console.log(chalk.gray('─'.repeat(30)));
      console.log(chalk.green(`🧙‍♂️ Adventurer: ${state.player.name}`));
      console.log(chalk.yellow(`⭐ Glory: ${state.player.score} points`));
      console.log(chalk.magenta(`🎯 Rank: ${state.player.level}`));
      console.log(chalk.blue(`🌍 Realm: ${state.player.location}`));
      
      if (state.quests.active) {
        const progress = state.quests.active.steps.filter(s => s.completed).length;
        const total = state.quests.active.steps.length;
        console.log(chalk.cyan(`⚔️  Current Quest: ${state.quests.active.title} (${progress}/${total} steps)`));
      } else {
        console.log(chalk.gray('⚔️  Current Quest: Awaiting thy next adventure'));
      }
      break;
      
    case 'quests':
      const questsData = await getQuests();
      if (!questsData) return;
      
      console.log(chalk.bold.blue('🗡️  Available Adventures'));
      console.log(chalk.gray('─'.repeat(30)));
      
      if (questsData.active) {
        console.log(chalk.green(`⚔️  Active: ${questsData.active.title}`));
        console.log(chalk.gray(`   ${questsData.active.description}`));
        console.log();
      }
      
      if (questsData.available.length > 0) {
        console.log(chalk.blue('📋 Available Quests:'));
        questsData.available.forEach((quest, index) => {
          console.log(chalk.yellow(`   ${index + 1}. ${quest.title}`));
          console.log(chalk.gray(`      ${quest.description}`));
        });
      }
      break;
      
    case 'health':
      const health = await checkEngineHealth();
      if (!health) {
        console.log(chalk.red('❌ Cannot connect to the mystical realm!'));
        return;
      }
      
      console.log(chalk.green('✅ Realm is accessible!'));
      console.log(chalk.blue(`🔧 Version: ${health.version}`));
      if (health.llm && health.llm.enabled) {
        const workingProviders = Object.entries(health.llm.providers)
          .filter(([_, working]) => working)
          .map(([provider, _]) => provider);
        console.log(chalk.green(`✨ AI Guide powered by: ${workingProviders.join(', ')}`));
      }
      break;
      
    case 'history':
      const count = args[0] ? parseInt(args[0], 10) : 5;
      const historyState = await getPlayerState();
      if (!historyState) return;
      
      const recent = historyState.session.conversationHistory.slice(-count * 2);
      if (recent.length === 0) {
        console.log(chalk.gray('📜 No conversations yet. Start by speaking to your guide!'));
        return;
      }
      
      console.log(chalk.blue(`📜 Recent Conversations:`));
      console.log(chalk.gray('─'.repeat(50)));
      
      for (let i = 0; i < recent.length; i += 2) {
        const playerMsg = recent[i];
        const botMsg = recent[i + 1];
        
        if (playerMsg && playerMsg.sender === 'player') {
          console.log(chalk.green(`🗣️  You: ${playerMsg.message}`));
        }
        if (botMsg && botMsg.sender === 'bot') {
          console.log(chalk.cyan(`🧙‍♂️ Guide: ${botMsg.message.substring(0, 100)}${botMsg.message.length > 100 ? '...' : ''}`));
        }
        console.log();
      }
      break;
      
    case 'help':
      console.log(chalk.blue('🧙‍♂️ Adventure Guide Help'));
      console.log(chalk.gray('─'.repeat(40)));
      console.log();
      console.log(chalk.cyan('🗣️  Natural Language (Recommended):'));
      console.log(chalk.yellow('   "I want to start a new quest"'));
      console.log(chalk.yellow('   "I completed finding allies"'));
      console.log(chalk.yellow('   "What should I do next?"'));
      console.log(chalk.yellow('   "How am I doing?"'));
      console.log(chalk.yellow('   "Show me available quests"'));
      console.log();
      console.log(chalk.cyan('⚡ Quick Commands:'));
      console.log(chalk.gray('   status    - Show adventure status'));
      console.log(chalk.gray('   quests    - List available quests'));
      console.log(chalk.gray('   history   - Show recent conversations'));
      console.log(chalk.gray('   health    - Check realm connection'));
      console.log(chalk.gray('   clear     - Clear the screen'));
      console.log(chalk.gray('   exit      - Leave the realm'));
      console.log();
      console.log(chalk.green('💡 Pro tip: Just speak naturally! Your AI guide understands.'));
      break;
      
    default:
      console.log(chalk.red(`❌ Unknown command: ${command}`));
      console.log(chalk.gray('Try "help" or just speak naturally to your guide.'));
  }
}

async function handleChat(message) {
  console.log(chalk.green(`🗣️  You: ${message}`));
  console.log(chalk.gray('🧙‍♂️ Your guide ponders thy words...'));
  
  const result = await executeEngineCommand('CHAT', { message });
  if (result && result.botResponse) {
    console.log(chalk.cyan(`🧙‍♂️ Guide: ${result.botResponse.message}`));
    
    // Show LLM metadata if available
    if (result.llmMetadata && result.llmMetadata.provider !== 'fallback') {
      console.log(chalk.gray(`   ✨ Generated by ${result.llmMetadata.provider} (${result.llmMetadata.responseTime}ms)`));
    } else if (result.llmMetadata && result.llmMetadata.provider === 'fallback') {
      console.log(chalk.gray(`   💡 Enhanced response (add API key for full AI power)`));
    }
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
  
  const quickCommands = ['status', 'quests', 'history', 'help', 'health'];
  
  if (quickCommands.includes(command)) {
    await handleQuickCommand(command, args);
  } else {
    // Everything else goes to natural language chat
    await handleChat(trimmed);
  }
}

async function startShell() {
  console.clear();
  showBanner();
  
  // Test connection first
  console.log(chalk.blue('🔮 Connecting to the mystical realm...'));
  const health = await checkEngineHealth();
  
  if (!health) {
    console.log(chalk.red('⚠️  Warning: Could not connect to realm'));
    console.log(chalk.gray('   Make sure engine is running: cd packages/engine && npm start'));
  } else {
    console.log(chalk.green('✓ Connected to the mystical realm!'));
    if (health.llm && health.llm.enabled) {
      const workingProviders = Object.entries(health.llm.providers)
        .filter(([_, working]) => working)
        .map(([provider, _]) => provider);
      console.log(chalk.green(`✨ AI Guide empowered by: ${workingProviders.join(', ')}`));
    } else {
      console.log(chalk.yellow('💡 Enhanced guide mode (add API key for full AI power)'));
    }
  }
  
  console.log(chalk.gray('Speak naturally to your guide, or type "help" for quick commands.'));
  console.log();
  
  // Main command loop
  while (true) {
    try {
      const { command } = await inquirer.prompt([{
        type: 'input',
        name: 'command',
        message: chalk.cyan('Adventure>'),
        validate: () => true
      }]);
      
      await processInput(command);
      console.log(); // Add spacing between interactions
      
    } catch (error) {
      if (error.name === 'ExitPromptError') {
        console.log(chalk.green('\\n🌟 Farewell, brave adventurer!'));
        process.exit(0);
      } else {
        console.log(chalk.red('An unexpected enchantment occurred:'), error.message);
      }
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(chalk.green('\\n🌟 Farewell, brave adventurer! Until we meet again!'));
  process.exit(0);
});

// Start the shell
startShell().catch(error => {
  console.error(chalk.red('Failed to enter the realm:'), error.message);
  process.exit(1);
});
