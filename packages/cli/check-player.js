#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');

const playerId = process.argv[2] || 'claude-player';
const engineUrl = 'http://localhost:3000';

async function checkPlayer() {
  try {
    const response = await axios.get(`${engineUrl}/api/state/${playerId}`);
    const state = response.data.data;
    
    console.log(chalk.bold.blue(`\n📊 Status for ${playerId}`));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(chalk.green(`👤 Player: ${state.player.name}`));
    console.log(chalk.yellow(`⭐ Score: ${state.player.score} points`));
    console.log(chalk.magenta(`🎯 Level: ${state.player.level}`));
    console.log(chalk.blue(`📍 Location: ${state.player.location}`));
    console.log(chalk.cyan(`💭 Status: ${state.player.status}`));
    
    if (state.quests.active) {
      console.log(chalk.cyan(`⚔️  Current Quest: ${state.quests.active.title}`));
      console.log(chalk.gray(`   Progress: ${state.quests.active.steps.filter(s => s.completed).length}/${state.quests.active.steps.length} steps`));
    } else {
      console.log(chalk.gray('⚔️  Current Quest: None'));
    }
    
    console.log(chalk.gray(`\n💬 Conversations: ${state.session.conversationHistory.length}`));
    console.log(chalk.gray(`🎲 Turn Count: ${state.session.turnCount}`));
    console.log();
    
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log(chalk.red(`\n❌ Player '${playerId}' not found`));
      console.log(chalk.gray('Available players can be listed with: node list-players.js'));
    } else if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('\n❌ Cannot connect to engine'));
      console.log(chalk.gray('Make sure the engine is running: node ../../tools/startup/start-engine.js'));
    } else {
      console.log(chalk.red('\n❌ Error:', error.message));
    }
  }
}

// Show usage if help requested
if (process.argv[2] === '--help' || process.argv[2] === '-h') {
  console.log(chalk.blue('\nUsage: node check-player.js [playerId]'));
  console.log(chalk.gray('\nExamples:'));
  console.log(chalk.gray('  node check-player.js                # Check claude-player (default)'));
  console.log(chalk.gray('  node check-player.js claude-player  # Check claude-player explicitly'));
  console.log(chalk.gray('  node check-player.js default-player # Check default-player'));
  console.log(chalk.gray('  node check-player.js shell-player-123456789'));
  process.exit(0);
}

checkPlayer(); 