#!/usr/bin/env node

/**
 * myMCP CLI - Command Line Interface for the Fantasy Chatbot System
 * Now integrated with the myMCP Engine API! 🚀
 */

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import axios from 'axios';

// Configuration management
interface CLIConfig {
  engineUrl: string;
  playerId: string;
  apiTimeout: number;
}

// Use project-relative config to avoid WSL/Windows path conflicts
const PROJECT_ROOT = join(__dirname, '..', '..');
const CONFIG_DIR = join(PROJECT_ROOT, '.mymcp-cli');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

// Also check legacy location for migration
const LEGACY_CONFIG_DIR = join(homedir(), '.mymcp');
const LEGACY_CONFIG_FILE = join(LEGACY_CONFIG_DIR, 'config.json');

// Ensure config directory exists
function ensureConfigDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

// Load or create configuration with legacy migration
function getConfig(): CLIConfig {
  ensureConfigDir();
  
  // Check if we need to migrate from legacy location
  if (!existsSync(CONFIG_FILE) && existsSync(LEGACY_CONFIG_FILE)) {
    try {
      console.log(chalk.yellow('🔄 Migrating config from legacy location...'));
      const legacyData = readFileSync(LEGACY_CONFIG_FILE, 'utf8');
      writeFileSync(CONFIG_FILE, legacyData);
      console.log(chalk.green('✅ Config migrated successfully!'));
      return JSON.parse(legacyData);
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not migrate legacy config, creating new one'));
    }
  }
  
  if (!existsSync(CONFIG_FILE)) {
    const defaultConfig: CLIConfig = {
      engineUrl: 'http://localhost:3000',
      playerId: `cli-player-${Date.now()}`,
      apiTimeout: 5000,
    };
    writeFileSync(CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    console.log(chalk.blue(`ℹ️  Created config at: ${CONFIG_FILE}`));
    return defaultConfig;
  }
  
  try {
    const data = readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log(chalk.red('⚠️  Error loading config, using defaults'));
    return getConfig(); // This will create default config
  }
}

// Update configuration
function updateConfig(updates: Partial<CLIConfig>) {
  const config = getConfig();
  const newConfig = { ...config, ...updates };
  writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
  return newConfig;
}

// API Client setup
function createApiClient() {
  const config = getConfig();
  return axios.create({
    baseURL: config.engineUrl + '/api',
    timeout: config.apiTimeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Error handling utility
function handleApiError(error: any, defaultMessage: string = 'An error occurred') {
  if (error.response) {
    // The request was made and the server responded with a status code
    console.log(chalk.red(`❌ Error ${error.response.status}: ${error.response.data?.error || error.response.statusText}`));
  } else if (error.request) {
    // The request was made but no response was received
    console.log(chalk.red('❌ No response from engine. Is the myMCP Engine running?'));
    console.log(chalk.gray('   Start engine: cd packages/engine && npm start'));
  } else {
    // Something happened in setting up the request
    console.log(chalk.red(`❌ ${defaultMessage}: ${error.message}`));
  }
}

// Display banner function
function showBanner() {
  console.log(
    chalk.cyan(
      figlet.textSync('myMCP CLI', { 
        font: 'Standard',
        horizontalLayout: 'default' 
      })
    )
  );
  console.log(chalk.yellow('🗡️  Fantasy Chatbot CLI - API Connected Edition'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log();
}

// API Service functions
async function getPlayerState() {
  try {
    const config = getConfig();
    const apiClient = createApiClient();
    const response = await apiClient.get(`/state/${config.playerId}`);
    return response.data.data;
  } catch (error) {
    handleApiError(error, 'Failed to get player state');
    return null;
  }
}

async function executeGameAction(actionType: string, payload: any) {
  try {
    const config = getConfig();
    const apiClient = createApiClient();
    const response = await apiClient.post(`/actions/${config.playerId}`, {
      type: actionType,
      payload,
      playerId: config.playerId,
    });
    return response.data.data;
  } catch (error) {
    handleApiError(error, 'Failed to execute action');
    return null;
  }
}

async function getQuests() {
  try {
    const config = getConfig();
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
    const config = getConfig();
    const apiClient = axios.create({
      baseURL: config.engineUrl,
      timeout: 3000,
    });
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    return null;
  }
}

// Initialize program
const program = new Command();

// Status command - now uses API
program
  .command('status')
  .description('Show current game status and player information')
  .action(async () => {
    showBanner();
    
    // Check engine health first
    const health = await checkEngineHealth();
    if (!health) {
      console.log(chalk.red('🚨 Cannot connect to myMCP Engine!'));
      console.log(chalk.gray('   Make sure the engine is running: cd packages/engine && npm start'));
      return;
    }
    
    console.log(chalk.green('🔗 Connected to myMCP Engine'));
    console.log(chalk.gray(`   Engine: ${health.message} (v${health.version})`));
    console.log();
    
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
    console.log();
  });

// Get Score command - now uses API
program
  .command('get-score')
  .description('Get current player score')
  .action(async () => {
    const state = await getPlayerState();
    if (!state) return;
    
    console.log(chalk.green(`⭐ Current score: ${state.player.score} points`));
    console.log(chalk.magenta(`🎯 Level: ${state.player.level}`));
    
    // Level-based encouragement
    const levelMessages = {
      novice: 'Every master was once a beginner. Keep adventuring!',
      apprentice: 'You\'re making good progress! Greater challenges await.',
      expert: 'Impressive skills! You\'re becoming a true hero.',
      master: 'Legendary! The realm sings of your achievements.',
    };
    
    console.log(chalk.gray(`💭 ${levelMessages[state.player.level as keyof typeof levelMessages] || 'Keep up the great work!'}`));
  });

// Set Score command - now uses API
program
  .command('set-score')
  .description('Set player score (for testing and demo purposes)')
  .argument('<score>', 'new score value')
  .action(async (scoreStr) => {
    const score = parseInt(scoreStr, 10);
    
    if (isNaN(score) || score < 0) {
      console.log(chalk.red('❌ Invalid score. Please provide a positive number.'));
      return;
    }
    
    // Get current state to compare
    const currentState = await getPlayerState();
    if (!currentState) return;
    
    const oldScore = currentState.player.score;
    
    // Execute SET_SCORE action
    const result = await executeGameAction('SET_SCORE', { score });
    if (!result) return;
    
    const scoreDiff = score - oldScore;
    if (scoreDiff > 0) {
      console.log(chalk.green(`🎉 Score increased by ${scoreDiff} points!`));
    } else if (scoreDiff < 0) {
      console.log(chalk.yellow(`📉 Score decreased by ${Math.abs(scoreDiff)} points.`));
    } else {
      console.log(chalk.blue('📊 Score updated (no change).'));
    }
    
    // Get updated state to show new level
    const newState = await getPlayerState();
    if (newState) {
      console.log(chalk.cyan(`⭐ New score: ${newState.player.score} points (Level: ${newState.player.level})`));
    }
  });

// Chat command - now uses API
program
  .command('chat')
  .description('Start an interactive chat session or send a single message')
  .argument('[message]', 'optional message to send')
  .option('-i, --interactive', 'start interactive chat mode')
  .action(async (message, options) => {
    // Check engine connection first
    const health = await checkEngineHealth();
    if (!health) {
      console.log(chalk.red('🚨 Cannot connect to myMCP Engine!'));
      console.log(chalk.gray('   Make sure the engine is running: cd packages/engine && npm start'));
      return;
    }
    
    if (options.interactive || !message) {
      // Interactive mode
      showBanner();
      console.log(chalk.blue('💬 Starting interactive chat session...'));
      console.log(chalk.green('🔗 Connected to myMCP Engine API'));
      console.log(chalk.gray('Type "exit", "quit", or "bye" to end the conversation.'));
      console.log();
      
      const state = await getPlayerState();
      if (!state) return;
      
      console.log(chalk.cyan(`🤖 Bot: Welcome back, ${state.player.name}! How can I assist you today?`));
      
      let chatActive = true;
      
      while (chatActive) {
        const { userMessage } = await inquirer.prompt([{
          type: 'input',
          name: 'userMessage',
          message: chalk.green('🗣️  You:'),
          validate: (input) => input.trim() !== '' || 'Please enter a message',
        }]);
        
        // Check for exit commands
        const exitCommands = ['exit', 'quit', 'bye', 'goodbye'];
        if (exitCommands.includes(userMessage.toLowerCase().trim())) {
          const result = await executeGameAction('CHAT', { message: userMessage });
          if (result && result.botResponse) {
            console.log(chalk.cyan(`🤖 Bot: ${result.botResponse.message}`));
          }
          chatActive = false;
          continue;
        }
        
        // Send message to API
        const result = await executeGameAction('CHAT', { message: userMessage });
        if (result && result.botResponse) {
          console.log(chalk.cyan(`🤖 Bot: ${result.botResponse.message}`));
        } else {
          console.log(chalk.red('❌ Failed to get response from bot'));
          chatActive = false;
        }
      }
    } else {
      // Single message mode
      console.log(chalk.green(`🗣️  You: ${message}`));
      const result = await executeGameAction('CHAT', { message });
      if (result && result.botResponse) {
        console.log(chalk.cyan(`🤖 Bot: ${result.botResponse.message}`));
      }
    }
  });

// Start Quest command - now uses API
program
  .command('start-quest')
  .description('Begin a new quest adventure')
  .argument('[questId]', 'ID or name of the quest to start')
  .action(async (questInput) => {
    const questsData = await getQuests();
    if (!questsData) return;
    
    if (!questInput) {
      console.log(chalk.blue('🗡️  Available Quests:'));
      console.log(chalk.gray('─'.repeat(25)));
      questsData.available.forEach((quest: any, index: number) => {
        console.log(chalk.yellow(`${index + 1}. ${quest.title} (${quest.id})`));
        console.log(chalk.gray(`   ${quest.description}`));
        console.log(chalk.cyan(`   Skill: ${quest.realWorldSkill}`));
        console.log(chalk.magenta(`   Reward: ${quest.reward.score} points`));
        console.log();
      });
      console.log(chalk.gray('Usage: mycli start-quest global-meeting'));
      console.log(chalk.gray('   or: mycli start-quest "Council of Three Realms"'));
      return;
    }
    
    // Find quest by ID or title
    const quest = questsData.available.find((q: any) => 
      q.id === questInput ||
      q.title.toLowerCase().includes(questInput.toLowerCase()) ||
      questInput.toLowerCase().includes(q.title.toLowerCase())
    );
    
    if (!quest) {
      console.log(chalk.red('❌ Quest not found. Use "mycli start-quest" to see available quests.'));
      return;
    }
    
    // Start the quest via API
    const result = await executeGameAction('START_QUEST', { questId: quest.id });
    if (!result) return;
    
    console.log(chalk.green('⚡ Quest Started!'));
    console.log(chalk.cyan(`🗡️  ${quest.title}`));
    console.log(chalk.gray(quest.description));
    console.log(chalk.yellow(`🎯 Status: ${result.status}`));
    console.log(chalk.magenta(`🏆 Potential Reward: ${quest.reward.score} points`));
    
    if (quest.reward.items && quest.reward.items.length > 0) {
      console.log(chalk.blue(`🎁 Items: ${quest.reward.items.join(', ')}`));
    }
  });

// Quests command - view quest status
program
  .command('quests')
  .description('View available, active, and completed quests')
  .action(async () => {
    const questsData = await getQuests();
    if (!questsData) return;
    
    console.log(chalk.bold.blue('🗡️  Quest Status'));
    console.log(chalk.gray('─'.repeat(30)));
    
    // Active quest
    if (questsData.active) {
      console.log(chalk.green('⚔️  Active Quest:'));
      console.log(chalk.cyan(`   ${questsData.active.title}`));
      console.log(chalk.gray(`   ${questsData.active.description}`));
      console.log(chalk.yellow(`   Progress: ${questsData.active.steps.filter((s: any) => s.completed).length}/${questsData.active.steps.length} steps`));
      console.log();
    }
    
    // Available quests
    if (questsData.available.length > 0) {
      console.log(chalk.blue('📋 Available Quests:'));
      questsData.available.forEach((quest: any, index: number) => {
        console.log(chalk.yellow(`   ${index + 1}. ${quest.title}`));
        console.log(chalk.gray(`      ${quest.description}`));
      });
      console.log();
    }
    
    // Completed quests
    if (questsData.completed.length > 0) {
      console.log(chalk.green('✅ Completed Quests:'));
      questsData.completed.forEach((quest: any, index: number) => {
        console.log(chalk.green(`   ${index + 1}. ${quest.title}`));
      });
      console.log();
    }
  });

// History command - now uses API
program
  .command('history')
  .description('Show recent conversation history')
  .option('-n, --number <count>', 'number of recent messages to show', '10')
  .action(async (options) => {
    const state = await getPlayerState();
    if (!state) return;
    
    const count = parseInt(options.number, 10) || 10;
    const recent = state.session.conversationHistory.slice(-count);
    
    if (recent.length === 0) {
      console.log(chalk.gray('📜 No conversation history yet. Start chatting with "mycli chat"!'));
      return;
    }
    
    console.log(chalk.blue(`📜 Recent Conversation History (last ${recent.length} messages):`));
    console.log(chalk.gray('─'.repeat(50)));
    
    recent.forEach((msg: any) => {
      const timeStr = new Date(msg.timestamp).toLocaleTimeString();
      const icon = msg.sender === 'player' ? '🗣️ ' : '🤖';
      const color = msg.sender === 'player' ? chalk.green : chalk.cyan;
      console.log(color(`${icon} [${timeStr}] ${msg.message}`));
    });
    console.log();
  });

// Config command - manage CLI configuration
program
  .command('config')
  .description('Configure CLI settings')
  .argument('<key>', 'Configuration key (engineUrl, show, reset)')
  .argument('[value]', 'Configuration value')
  .action((key, value) => {
    if (key === 'show') {
      const config = getConfig();
      console.log(chalk.blue('🔧 Current Configuration:'));
      console.log(chalk.gray('─'.repeat(25)));
      console.log(chalk.yellow(`Engine URL: ${config.engineUrl}`));
      console.log(chalk.yellow(`Player ID: ${config.playerId}`));
      console.log(chalk.yellow(`API Timeout: ${config.apiTimeout}ms`));
      console.log(chalk.gray(`Config file: ${CONFIG_FILE}`));
      console.log(chalk.gray(`Project root: ${PROJECT_ROOT}`));
        
      // Show if legacy config exists
      if (existsSync(LEGACY_CONFIG_FILE)) {
        console.log(chalk.yellow(`⚠️  Legacy config found: ${LEGACY_CONFIG_FILE}`));
        console.log(chalk.gray('   (Will be migrated on next config access)'));
      }
      return;
    }
    
    if (key === 'reset') {
      // Delete config file to reset to defaults
      if (existsSync(CONFIG_FILE)) {
        require('fs').unlinkSync(CONFIG_FILE);
        console.log(chalk.green('✅ Configuration reset to defaults'));
      } else {
        console.log(chalk.gray('ℹ️  Configuration already at defaults'));
      }
      return;
    }
    
    if (key === 'engineUrl' && value) {
      updateConfig({ engineUrl: value });
      console.log(chalk.green(`✅ Engine URL updated to: ${value}`));
      return;
    }
    
    if (key === 'timeout' && value) {
      const timeout = parseInt(value, 10);
      if (isNaN(timeout) || timeout < 1000) {
        console.log(chalk.red('❌ Timeout must be at least 1000ms'));
        return;
      }
      updateConfig({ apiTimeout: timeout });
      console.log(chalk.green(`✅ API timeout updated to: ${timeout}ms`));
      return;
    }
    
    console.log(chalk.blue('🔧 Configuration Options:'));
    console.log(chalk.gray('  mycli config show              - Show current config'));
    console.log(chalk.gray('  mycli config engineUrl <url>   - Set engine URL'));
    console.log(chalk.gray('  mycli config timeout <ms>      - Set API timeout'));
    console.log(chalk.gray('  mycli config reset             - Reset to defaults'));
  });

// Main program setup
program
  .name('mycli')
  .description('myMCP Fantasy Chatbot CLI - API Connected!')
  .version('0.1.0')
  .hook('preAction', () => {
    // We'll only show banner for specific commands
  });

// Parse command line arguments
program.parse();

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  showBanner();
  console.log(chalk.blue('🎮 Welcome to myMCP CLI - API Connected!'));
  console.log(chalk.gray('Your command-line gateway to fantasy adventures, now powered by the myMCP Engine.'));
  console.log();
  program.outputHelp();
  console.log();
  console.log(chalk.yellow('💡 Quick Start:'));
  console.log(chalk.gray('  mycli status      - Check connection and status'));
  console.log(chalk.gray('  mycli chat -i     - Start interactive chat'));
  console.log(chalk.gray('  mycli start-quest - See available quests'));
  console.log(chalk.gray('  mycli config show - View configuration'));
  console.log();
}
