#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');

const engineUrl = 'http://localhost:3000';

async function listPlayers() {
  try {
    const response = await axios.get(`${engineUrl}/api/players`);
    const players = response.data.data;
    
    console.log(chalk.bold.blue('\n🎮 All Players'));
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
      
      console.log(`${medal} ${chalk.cyan(player.id.padEnd(25))} ${scoreColor(player.score.toString().padStart(6) + ' pts')} ${chalk.magenta(player.level.padEnd(10))} ${chalk.gray(player.status)}`);
    });
    
    console.log(chalk.gray('\n─'.repeat(60)));
    console.log(chalk.gray(`Total players: ${players.length}`));
    console.log();
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('\n❌ Cannot connect to engine'));
      console.log(chalk.gray('Make sure the engine is running: node ../../tools/startup/start-engine.js'));
    } else {
      console.log(chalk.red('\n❌ Error:', error.message));
    }
  }
}

listPlayers(); 