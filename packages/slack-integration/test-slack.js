#!/usr/bin/env node

const { SlackIntegration } = require('./dist/SlackIntegration.js');
const chalk = require('chalk');
require('dotenv').config();

async function testSlackIntegration() {
  console.log(chalk.blue('🧪 Testing Slack Integration...'));
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
  console.log(chalk.gray(`   Dashboard Channel: ${process.env.SLACK_DASHBOARD_CHANNEL || 'Not set'}`));
  console.log(chalk.gray(`   Default Channel: ${process.env.SLACK_DEFAULT_CHANNEL || 'Not set'}`));
  
  // Use dashboard channel as both default and dashboard since that's what works
  const dashboardChannel = process.env.SLACK_DASHBOARD_CHANNEL || '#payments-lunch-n-learn';
  
  try {
    console.log(chalk.blue('\n🚀 Starting Slack integration...'));
    
    const slack = new SlackIntegration({
      botToken: process.env.SLACK_BOT_TOKEN,
      appToken: process.env.SLACK_APP_TOKEN,
      signingSecret: process.env.SLACK_SIGNING_SECRET,
      defaultChannel: dashboardChannel, // Use dashboard channel for both
      dashboardChannel: dashboardChannel,
      redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
      engineUrl: process.env.ENGINE_URL || 'http://localhost:3000'
    });
    
    await slack.start();
    
    console.log(chalk.green('✅ Slack integration started successfully!'));
    console.log(chalk.blue('\n📝 Testing dashboard update...'));
    
    // Manually trigger a dashboard update
    await slack.updateDashboard();
    
    console.log(chalk.green('✅ Dashboard update sent!'));
    console.log(chalk.yellow(`\n👀 Check ${dashboardChannel} for the dashboard message`));
    
    console.log(chalk.blue('\n🎯 Available slash commands:'));
    console.log(chalk.gray('   /mymcp help - Show available commands'));
    console.log(chalk.gray('   /mymcp status - View player status'));
    console.log(chalk.gray('   /mymcp leaderboard - View top players'));
    console.log(chalk.gray('   /mymcp quest list - View available quests'));
    
    console.log(chalk.green('\n✨ Bot is running! Press Ctrl+C to stop.'));
    
    // Keep the bot running
    process.on('SIGINT', async () => {
      console.log(chalk.yellow('\n\n👋 Shutting down...'));
      await slack.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.log(chalk.red('\n❌ Error starting Slack integration:'));
    console.log(chalk.red(error.message));
    
    if (error.message.includes('invalid_auth')) {
      console.log(chalk.yellow('\n💡 Check your SLACK_BOT_TOKEN - it should start with xoxb-'));
    } else if (error.message.includes('not_in_channel')) {
      console.log(chalk.yellow(`\n💡 Make sure the bot is invited to ${dashboardChannel}`));
      console.log(chalk.yellow(`   In Slack, go to ${dashboardChannel} and type: /invite @myMCP`));
    }
    
    process.exit(1);
  }
}

testSlackIntegration(); 