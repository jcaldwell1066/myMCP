#!/usr/bin/env node

const axios = require('axios');
const chalk = require('chalk');

const engineUrl = 'http://localhost:3000';

async function getMultiplayerStatus() {
  try {
    // Get all players
    const playersResponse = await axios.get(`${engineUrl}/api/players`);
    const players = playersResponse.data.data;
    
    // Get health to check active connections
    const healthResponse = await axios.get(`${engineUrl}/health`);
    const health = healthResponse.data;
    
    console.log(chalk.bold.blue('\n🎮 Multiplayer Status Dashboard'));
    console.log(chalk.gray('═'.repeat(80)));
    
    // Show active connections
    console.log(chalk.green(`\n🔌 Active Connections: ${health.wsConnections || 0}`));
    console.log(chalk.green(`📊 Active Game States: ${health.activeStates || players.length}`));
    console.log();
    
    // Group players by status
    const activePlayers = players.filter(p => p.status === 'in-quest' || p.score > 0);
    const idlePlayers = players.filter(p => p.status === 'idle' && p.score === 0);
    
    // Show active players
    if (activePlayers.length > 0) {
      console.log(chalk.bold.green('🟢 ACTIVE PLAYERS'));
      console.log(chalk.gray('─'.repeat(80)));
      console.log(chalk.gray('Player ID                     Score    Level      Status      Quest'));
      console.log(chalk.gray('─'.repeat(80)));
      
      activePlayers.sort((a, b) => b.score - a.score).forEach((player, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
        const scoreColor = player.score >= 1000 ? chalk.yellow : player.score >= 500 ? chalk.green : chalk.white;
        
        console.log(
          `${medal} ${chalk.cyan(player.id.padEnd(25))} ` +
          `${scoreColor(player.score.toString().padStart(6))} ` +
          `${chalk.magenta(player.level.padEnd(10))} ` +
          `${player.status === 'in-quest' ? chalk.yellow(player.status.padEnd(10)) : chalk.gray(player.status.padEnd(10))} ` +
          `${player.currentQuest ? chalk.blue(player.currentQuest) : chalk.gray('none')}`
        );
      });
    }
    
    // Show idle players
    if (idlePlayers.length > 0) {
      console.log(chalk.bold.gray('\n⚪ IDLE PLAYERS (Never played)'));
      console.log(chalk.gray('─'.repeat(80)));
      
      idlePlayers.forEach(player => {
        console.log(chalk.gray(`   ${player.id}`));
      });
    }
    
    // Show summary
    console.log(chalk.gray('\n═'.repeat(80)));
    console.log(chalk.blue('📊 Summary:'));
    console.log(chalk.green(`   Active Players: ${activePlayers.length}`));
    console.log(chalk.gray(`   Idle Players: ${idlePlayers.length}`));
    console.log(chalk.cyan(`   Total Players: ${players.length}`));
    
    // Show recent activity (players with high turn counts)
    const recentlyActive = [];
    for (const player of activePlayers) {
      try {
        const stateResponse = await axios.get(`${engineUrl}/api/state/${player.id}`);
        const state = stateResponse.data.data;
        if (state.session.turnCount > 0) {
          recentlyActive.push({
            id: player.id,
            turnCount: state.session.turnCount,
            lastMessage: state.session.conversationHistory.slice(-1)[0],
            sessionStart: state.session.startTime
          });
        }
      } catch (e) {
        // Skip if can't get state
      }
    }
    
    if (recentlyActive.length > 0) {
      console.log(chalk.bold.yellow('\n⏰ Recent Activity:'));
      console.log(chalk.gray('─'.repeat(80)));
      
      recentlyActive.sort((a, b) => b.turnCount - a.turnCount).forEach(activity => {
        const sessionTime = new Date(activity.sessionStart);
        const timeAgo = Math.floor((Date.now() - sessionTime) / 1000 / 60); // minutes
        
        console.log(chalk.cyan(`\n   ${activity.id}:`));
        console.log(chalk.gray(`   Turns: ${activity.turnCount} | Started: ${timeAgo} minutes ago`));
        
        if (activity.lastMessage) {
          const msg = activity.lastMessage;
          const icon = msg.sender === 'player' ? '🗣️' : '🤖';
          console.log(chalk.gray(`   Last: ${icon} "${msg.message.substring(0, 50)}${msg.message.length > 50 ? '...' : ''}"`));
        }
      });
    }
    
    console.log();
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(chalk.red('\n❌ Cannot connect to engine'));
      console.log(chalk.gray('Make sure the engine is running: cd packages/engine && npm start'));
    } else {
      console.log(chalk.red('\n❌ Error:', error.message));
    }
  }
}

// Add auto-refresh option
const refreshInterval = process.argv[2];
if (refreshInterval && !isNaN(parseInt(refreshInterval))) {
  console.log(chalk.yellow(`🔄 Auto-refreshing every ${refreshInterval} seconds...`));
  setInterval(getMultiplayerStatus, parseInt(refreshInterval) * 1000);
}

getMultiplayerStatus(); 