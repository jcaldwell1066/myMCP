#!/usr/bin/env node

/**
 * myMCP CLI - Simplified version for testing
 */

const { Command } = require('commander');
const chalk = require('chalk');
const axios = require('axios');

const program = new Command();

// Simple configuration
const config = {
  engineUrl: 'http://localhost:3000',
  playerId: `cli-player-${Date.now()}`,
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

// Status command
program
  .command('status')
  .description('Show current game status')
  .action(async () => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.get(`/state/${config.playerId}`);
      const state = response.data.data;
      
      console.log(chalk.blue('📊 Current Status'));
      console.log(chalk.gray('─'.repeat(30)));
      console.log(chalk.green(`👤 Player: ${state.player.name}`));
      console.log(chalk.yellow(`⭐ Score: ${state.player.score} points`));
      console.log(chalk.magenta(`🎯 Level: ${state.player.level}`));
      console.log(chalk.blue(`📍 Location: ${state.player.location}`));
    } catch (error) {
      handleApiError(error, 'Failed to get status');
    }
  });

// Chat command
program
  .command('chat')
  .description('Chat with the AI guide')
  .argument('[message]', 'Message to send')
  .action(async (message) => {
    if (!message) {
      console.log(chalk.yellow('Please provide a message: mycli chat "Hello!"'));
      return;
    }
    
    try {
      const apiClient = createApiClient();
      const response = await apiClient.post(`/actions/${config.playerId}`, {
        type: 'CHAT',
        payload: { message },
        playerId: config.playerId,
      });
      
      const result = response.data.data;
      console.log(chalk.green(`🗣️  You: ${message}`));
      console.log(chalk.cyan(`🤖 Bot: ${result.botResponse.message}`));
      
      if (result.llmMetadata && result.llmMetadata.provider !== 'fallback') {
        console.log(chalk.gray(`   (via ${result.llmMetadata.provider})`));
      }
    } catch (error) {
      handleApiError(error, 'Failed to send chat message');
    }
  });

// Health check
program
  .command('health')
  .description('Check engine connection')
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
      
      if (response.data.llm) {
        console.log(chalk.blue(`🤖 LLM enabled: ${response.data.llm.enabled}`));
        console.log(chalk.blue(`📡 Providers: ${response.data.llm.availableProviders.join(', ')}`));
      }
    } catch (error) {
      handleApiError(error, 'Failed to check engine health');
    }
  });

// Set program info
program
  .name('mycli')
  .description('myMCP Fantasy Chatbot CLI')
  .version('0.1.0');

// Parse command line arguments
program.parse();

// Show help if no arguments provided
if (!process.argv.slice(2).length) {
  console.log(chalk.cyan('🗡️  myMCP CLI - Fantasy Chatbot Interface'));
  console.log(chalk.gray('─'.repeat(50)));
  program.outputHelp();
  console.log();
  console.log(chalk.yellow('💡 Quick Start:'));
  console.log(chalk.gray('  mycli health      - Check engine connection'));
  console.log(chalk.gray('  mycli status      - View player status'));
  console.log(chalk.gray('  mycli chat "hi"   - Chat with AI guide'));
}
