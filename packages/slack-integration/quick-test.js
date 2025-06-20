#!/usr/bin/env node

const chalk = require('chalk');

console.log(chalk.blue('🎯 Slack Integration Test Guide'));
console.log(chalk.gray('═'.repeat(60)));

console.log(chalk.yellow('\n📋 Since you only have access to #payments-lunch-n-learn:'));
console.log();

console.log(chalk.green('1. First, create a .env file in packages/slack-integration/'));
console.log(chalk.gray('   Copy the values from your Slack app configuration:'));
console.log(chalk.gray('   - Bot User OAuth Token (starts with xoxb-)'));
console.log(chalk.gray('   - App-Level Token (starts with xapp-)'));
console.log(chalk.gray('   - Signing Secret'));
console.log();

console.log(chalk.green('2. Set both channels to #payments-lunch-n-learn:'));
console.log(chalk.cyan('   SLACK_DEFAULT_CHANNEL=#payments-lunch-n-learn'));
console.log(chalk.cyan('   SLACK_DASHBOARD_CHANNEL=#payments-lunch-n-learn'));
console.log();

console.log(chalk.green('3. Once the bot is running, test these in Slack:'));
console.log();

console.log(chalk.yellow('📊 Dashboard Features (auto-posted):'));
console.log(chalk.gray('   - Player count and activity chart'));
console.log(chalk.gray('   - Updates every 5 minutes'));
console.log(chalk.gray('   - Shows currently active players'));
console.log();

console.log(chalk.yellow('💬 Slash Commands to try:'));
console.log(chalk.cyan('   /mymcp help') + chalk.gray(' - Shows all available commands'));
console.log(chalk.cyan('   /mymcp status') + chalk.gray(' - Shows default player status'));
console.log(chalk.cyan('   /mymcp status claude-player') + chalk.gray(' - Shows specific player'));
console.log(chalk.cyan('   /mymcp leaderboard') + chalk.gray(' - Shows top 10 players'));
console.log(chalk.cyan('   /mymcp quest list') + chalk.gray(' - Shows available quests'));
console.log(chalk.cyan('   /mymcp chat Hello world!') + chalk.gray(' - Send message to game'));
console.log();

console.log(chalk.yellow('🗣️ Direct Chat (if enabled):'));
console.log(chalk.gray('   Just type messages directly in the channel'));
console.log(chalk.gray('   The bot will forward them to the game engine'));
console.log();

console.log(chalk.yellow('🔍 What to look for:'));
console.log(chalk.gray('   - Dashboard message with player statistics'));
console.log(chalk.gray('   - Response to slash commands'));
console.log(chalk.gray('   - Game notifications (quests, achievements, etc.)'));
console.log();

console.log(chalk.blue('💡 Troubleshooting:'));
console.log(chalk.gray('   - If bot doesn\'t respond: Check it\'s invited to channel'));
console.log(chalk.gray('   - If "not_in_channel" error: Type /invite @myMCP in Slack'));
console.log(chalk.gray('   - If no dashboard: Wait 5 minutes or restart the bot'));
console.log();

console.log(chalk.green('🚀 To start the bot after setting up .env:'));
console.log(chalk.cyan('   cd packages/slack-integration'));
console.log(chalk.cyan('   npm run dev'));
console.log();

console.log(chalk.gray('═'.repeat(60))); 