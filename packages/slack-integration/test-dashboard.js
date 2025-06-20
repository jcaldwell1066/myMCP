#!/usr/bin/env node

const { SlackIntegration } = require('./dist/SlackIntegration.js');
const chalk = require('chalk');
require('dotenv').config();

async function testDashboard() {
  console.log(chalk.blue('🎮 Testing Slack Dashboard Status Message...'));
  console.log(chalk.gray('─'.repeat(50)));
  
  // Check environment variables
  const requiredVars = ['SLACK_BOT_TOKEN', 'SLACK_APP_TOKEN', 'SLACK_SIGNING_SECRET'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    console.log(chalk.red('❌ Missing environment variables:'));
    missing.forEach(v => console.log(chalk.red(`   - ${v}`)));
    console.log(chalk.yellow('\nMake sure you have a .env file with all required variables'));
    process.exit(1);
  }
  
  console.log(chalk.green('✅ Environment variables found'));
  
  const dashboardChannel = process.env.SLACK_DASHBOARD_CHANNEL || '#payments-lunch-n-learn';
  console.log(chalk.gray(`   Dashboard Channel: ${dashboardChannel}`));
  
  try {
    console.log(chalk.blue('\n🚀 Starting Slack integration...'));
    
    const slack = new SlackIntegration({
      botToken: process.env.SLACK_BOT_TOKEN,
      appToken: process.env.SLACK_APP_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      defaultChannel: dashboardChannel,
      dashboardChannel: dashboardChannel,
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      engineUrl: process.env.ENGINE_URL || 'http://localhost:3000'
    });
    
    await slack.start();
    
    console.log(chalk.green('✅ Slack integration started successfully!'));
    console.log(chalk.blue('\n📊 Triggering dashboard update...'));
    
    // Manually trigger a dashboard update
    await slack.updateDashboard();
    
    console.log(chalk.green('✅ Dashboard status message posted!'));
    console.log(chalk.yellow(`\n👀 Check ${dashboardChannel} for the comprehensive status message`));
    
    console.log(chalk.blue('\n📋 Dashboard includes:'));
    console.log(chalk.gray('   • System Health (Engine, Slack, Redis, LLM)'));
    console.log(chalk.gray('   • Current Activity (Players, Quests, Messages)'));
    console.log(chalk.gray('   • Top Players Leaderboard'));
    console.log(chalk.gray('   • Performance Metrics (Uptime, Memory, Response Time)'));
    console.log(chalk.gray('   • Auto-updates every 5 minutes'));
    
    console.log(chalk.green('\n✨ Dashboard is active! Press Ctrl+C to stop.'));
    
    // Keep the bot running
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n\n👋 Shutting down...'));
      await slack.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.log(chalk.red('\n❌ Error:'));
    console.log(chalk.red(error.stack || error.message));
    
    if (error.message.includes('invalid_auth')) {
      console.log(chalk.yellow('\n💡 Check your SLACK_BOT_TOKEN - it should start with xoxb-'));
    } else if (error.message.includes('not_in_channel')) {
      console.log(chalk.yellow(`\n💡 Make sure the bot is invited to ${dashboardChannel}`));
      console.log(chalk.yellow(`   In Slack, go to ${dashboardChannel} and type: /invite @myMCP`));
    }
    
    process.exit(1);
  }
}

testDashboard(); 