import { SlackIntegration } from './SlackIntegration';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Slack integration configuration
const config = {
  botToken: process.env.SLACK_BOT_TOKEN!,
  appToken: process.env.SLACK_APP_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || '#mymcp-game',
  dashboardChannel: process.env.SLACK_DASHBOARD_CHANNEL || '#mymcp-dashboard',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  engineUrl: process.env.ENGINE_URL || 'http://localhost:3000'
};

// Validate required configuration
if (!config.botToken || !config.appToken || !config.signingSecret) {
  console.error('❌ Missing required Slack configuration!');
  console.error('Please set the following environment variables:');
  console.error('- SLACK_BOT_TOKEN');
  console.error('- SLACK_APP_TOKEN');
  console.error('- SLACK_SIGNING_SECRET');
  process.exit(1);
}

// Create and start Slack integration
const slackIntegration = new SlackIntegration(config);

async function start() {
  try {
    await slackIntegration.start();
    console.log('🎮 myMCP Slack Integration Started!');
    console.log(`📢 Default channel: ${config.defaultChannel}`);
    console.log(`📊 Dashboard channel: ${config.dashboardChannel}`);
    console.log(`🎯 Engine URL: ${config.engineUrl}`);
  } catch (error) {
    console.error('Failed to start Slack integration:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️ Shutting down Slack integration...');
  await slackIntegration.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️ Shutting down Slack integration...');
  await slackIntegration.stop();
  process.exit(0);
});

// Start the integration
start(); 