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
  engineUrl: process.env.ENGINE_URL || 'http://localhost:3001',
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

// Quests command
program
  .command('quests')
  .description('List all quests')
  .action(async () => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.get(`/quests/${config.playerId}`);
      const quests = response.data.data;
      
      console.log(chalk.blue('📜 Available Quests'));
      console.log(chalk.gray('─'.repeat(30)));
      
      if (quests && quests.length > 0) {
        quests.forEach((quest, index) => {
          console.log(chalk.yellow(`${index + 1}. ${quest.name}`));
          console.log(chalk.gray(`   ID: ${quest.id}`));
          console.log(chalk.gray(`   ${quest.description}`));
          console.log();
        });
      } else {
        console.log(chalk.gray('No quests available'));
      }
    } catch (error) {
      handleApiError(error, 'Failed to get quests');
    }
  });

// Get score command
program
  .command('get-score')
  .description('Get current score')
  .action(async () => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.get(`/state/${config.playerId}`);
      const state = response.data.data;
      
      console.log(chalk.yellow(`⭐ Current Score: ${state.player.score} points`));
    } catch (error) {
      handleApiError(error, 'Failed to get score');
    }
  });

// Start quest command
program
  .command('start-quest')
  .description('Start a quest')
  .argument('<questId>', 'Quest ID to start')
  .action(async (questId) => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.post(`/actions/${config.playerId}`, {
        type: 'START_QUEST',
        payload: { questId },
        playerId: config.playerId,
      });
      
      const result = response.data.data;
      console.log(chalk.green(`✅ Quest started: ${result.quest?.name || questId}`));
      
      if (result.botResponse) {
        console.log(chalk.cyan(`🤖 ${result.botResponse.message}`));
      }
    } catch (error) {
      handleApiError(error, 'Failed to start quest');
    }
  });

// Quest steps command
program
  .command('quest-steps')
  .description('View active quest steps')
  .action(async () => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.get(`/state/${config.playerId}`);
      const state = response.data.data;
      
      if (state.quests.active) {
        console.log(chalk.blue(`📜 ${state.quests.active.name}`));
        console.log(chalk.gray('─'.repeat(30)));
        
        if (state.quests.active.steps) {
          state.quests.active.steps.forEach((step, index) => {
            const icon = step.completed ? '✅' : '⬜';
            console.log(`${icon} ${index + 1}. ${step.name}`);
            if (!step.completed) {
              console.log(chalk.gray(`   ${step.description}`));
            }
          });
        }
      } else {
        console.log(chalk.gray('No active quest'));
      }
    } catch (error) {
      handleApiError(error, 'Failed to get quest steps');
    }
  });

// Complete step command
program
  .command('complete-step')
  .description('Complete a quest step')
  .argument('<stepId>', 'Step ID to complete')
  .action(async (stepId) => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.post(`/actions/${config.playerId}`, {
        type: 'COMPLETE_QUEST_STEP',
        payload: { stepId },
        playerId: config.playerId,
      });
      
      const result = response.data.data;
      console.log(chalk.green(`✅ Step completed: ${stepId}`));
      
      if (result.botResponse) {
        console.log(chalk.cyan(`🤖 ${result.botResponse.message}`));
      }
    } catch (error) {
      handleApiError(error, 'Failed to complete step');
    }
  });

// Complete quest command
program
  .command('complete-quest')
  .description('Complete active quest')
  .action(async () => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.post(`/actions/${config.playerId}`, {
        type: 'COMPLETE_QUEST',
        payload: {},
        playerId: config.playerId,
      });
      
      const result = response.data.data;
      console.log(chalk.green('✅ Quest completed!'));
      
      if (result.botResponse) {
        console.log(chalk.cyan(`🤖 ${result.botResponse.message}`));
      }
    } catch (error) {
      handleApiError(error, 'Failed to complete quest');
    }
  });

// Progress command
program
  .command('progress')
  .description('Show quest progress')
  .action(async () => {
    try {
      const apiClient = createApiClient();
      const response = await apiClient.get(`/state/${config.playerId}`);
      const state = response.data.data;
      
      console.log(chalk.blue('📊 Quest Progress'));
      console.log(chalk.gray('─'.repeat(30)));
      
      if (state.quests.active) {
        const completedSteps = state.quests.active.steps?.filter(s => s.completed).length || 0;
        const totalSteps = state.quests.active.steps?.length || 0;
        const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
        
        console.log(chalk.yellow(`Active Quest: ${state.quests.active.name}`));
        console.log(chalk.green(`Progress: ${completedSteps}/${totalSteps} steps (${percentage}%)`));
        
        // Progress bar
        const barLength = 20;
        const filled = Math.round((percentage / 100) * barLength);
        const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
        console.log(chalk.green(`[${bar}]`));
      } else {
        console.log(chalk.gray('No active quest'));
      }
      
      console.log();
      console.log(chalk.blue(`Completed Quests: ${state.quests.completed?.length || 0}`));
    } catch (error) {
      handleApiError(error, 'Failed to get progress');
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
  console.log(chalk.gray('  mycli health              - Check engine connection'));
  console.log(chalk.gray('  mycli status              - View player status'));
  console.log(chalk.gray('  mycli chat "hi"           - Chat with AI guide'));
  console.log(chalk.gray('  mycli quests              - List all available quests'));
  console.log(chalk.gray('  mycli start-quest <id>    - Start a quest'));
  console.log(chalk.gray('  mycli progress            - Show quest progress'));
}
