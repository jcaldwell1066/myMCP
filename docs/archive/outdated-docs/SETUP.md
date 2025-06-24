# myMCP Slack Integration Setup Guide

This guide will help you set up the Slack integration for myMCP to enable smart dashboards and shared chat functionality.

## Features

- **Real-time Game Updates**: Get notifications for quests, achievements, and player activities
- **Interactive Commands**: Use slash commands to interact with the game
- **Smart Dashboard**: Auto-updating dashboard with player statistics and activity charts
- **Bidirectional Chat**: Chat directly with the game AI through Slack
- **Leaderboards**: View and share game leaderboards
- **Quest Management**: Start and track quests directly from Slack

## Prerequisites

1. A Slack workspace where you have admin permissions
2. myMCP engine running (default: http://localhost:3000)
3. Redis running (default: redis://localhost:6379)
4. Node.js 18+ installed

## Step 1: Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name your app "myMCP Game" and select your workspace
4. Click "Create App" 

https://api.slack.com/apps/A091SUKA2H5?created=1

## Step 2: Configure Bot Token Scopes

1. Go to "OAuth & Permissions" in the sidebar
2. Scroll to "Scopes" → "Bot Token Scopes"
3. Add these OAuth scopes:
   - `chat:write` - Send messages
   - `chat:write.public` - Send messages to public channels
   - `commands` - Add slash commands
   - `im:history` - View DM history
   - `im:read` - View DMs
   - `im:write` - Send DMs
   - `channels:history` - View channel history
   - `channels:read` - View channels
   - `groups:history` - View private channel history
   - `groups:read` - View private channels

## Step 3: Enable Socket Mode

1. Go to "Socket Mode" in the sidebar
2. Toggle "Enable Socket Mode" to On
3. Give it a name like "myMCP Socket" and click "Generate"
4. Copy the App-Level Token (starts with `xapp-`)

## Step 4: Install App to Workspace

1. Go back to "OAuth & Permissions"
2. Click "Install to Workspace"
3. Review permissions and click "Allow"
4. Copy the Bot User OAuth Token (starts with `xoxb-`)

## Step 5: Get Signing Secret

1. Go to "Basic Information"
2. Under "App Credentials", find "Signing Secret"
3. Click "Show" and copy the signing secret

## Step 6: Create Slash Command

1. Go to "Slash Commands" in the sidebar
2. Click "Create New Command"
3. Set:
   - Command: `/mymcp`
   - Request URL: `https://your-domain.com/slack/commands` (or use ngrok for local dev)
   - Short Description: `Interact with myMCP game`
   - Usage Hint: `help | status | leaderboard | quest | chat <message>`

## Step 7: Configure Environment

Create a `.env` file in the slack-integration package:

```bash
# Slack App Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-1-your-app-token
SLACK_SIGNING_SECRET=your-signing-secret

# Slack Channels
SLACK_DEFAULT_CHANNEL=#mymcp-game
SLACK_DASHBOARD_CHANNEL=#mymcp-dashboard

# Service URLs
REDIS_URL=redis://localhost:6379
ENGINE_URL=http://localhost:3000
```

## Step 8: Create Slack Channels

In your Slack workspace, create these channels:
- `#mymcp-game` - Main game channel for updates and chat
- `#mymcp-dashboard` - Dashboard channel for statistics

Invite the bot to both channels:
1. Go to each channel
2. Type `/invite @myMCP Game` (or your bot name)

## Step 9: Install Dependencies & Run

```bash
# From the myMCP root directory
cd packages/slack-integration
npm install

# For development
npm run dev

# For production
npm run build
npm start
```

## Usage

### Slash Commands

- `/mymcp help` - Show available commands
- `/mymcp status [player]` - View player status
- `/mymcp leaderboard` - View top 10 players
- `/mymcp quest list` - View available quests
- `/mymcp chat <message>` - Send a message to the game

### Direct Chat

Simply type messages in the game channel to chat with the game AI!

### Dashboard

The dashboard in `#mymcp-dashboard` updates every 5 minutes with:
- Total players count
- Currently active players
- 24-hour activity chart
- Last update timestamp

### Daily Summary

Every day at 9 AM, get a summary with:
- Active players in the last 24 hours
- Total combined score
- Top player and score

## Troubleshooting

### Bot not responding
- Check that the bot is invited to the channels
- Verify all tokens are correct in `.env`
- Check console logs for errors

### Socket Mode errors
- Ensure Socket Mode is enabled in your Slack app
- Regenerate the app token if needed

### Redis connection errors
- Verify Redis is running: `redis-cli ping`
- Check Redis URL in `.env`

### Game engine connection errors
- Verify the game engine is running
- Check ENGINE_URL in `.env`

## Advanced Configuration

### Custom Notification Channels

You can configure different channels for different event types:

```javascript
// In SlackIntegration.ts constructor
this.eventChannels = {
  'game:quest:completed': '#mymcp-achievements',
  'game:player:levelup': '#mymcp-achievements',
  'game:chat': '#mymcp-chat'
};
```

### Rate Limiting

The integration respects Slack's rate limits automatically, but you can configure additional limits:

```javascript
this.rateLimiter = {
  messages: 1, // messages per second
  dashboard: 300 // dashboard update interval in seconds
};
```

## Security Best Practices

1. **Never commit `.env` files** - Add to `.gitignore`
2. **Use environment variables** in production
3. **Rotate tokens regularly**
4. **Limit bot permissions** to only what's needed
5. **Use HTTPS** for all webhook URLs

## Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Verify all configuration steps above
3. Check Slack API status at [status.slack.com](https://status.slack.com)
4. Review Slack API documentation at [api.slack.com](https://api.slack.com) 