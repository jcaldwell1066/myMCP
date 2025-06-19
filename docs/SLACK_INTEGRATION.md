# myMCP Slack Integration

## Overview

The myMCP Slack integration enables seamless communication between your game world and Slack workspace, providing:

- **Real-time game notifications** in Slack channels
- **Interactive slash commands** for game control
- **Smart dashboards** with player statistics and activity charts
- **Bidirectional chat** between Slack and the game AI
- **Team collaboration** features for multiplayer gaming

## Architecture

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────┐
│   Slack Users   │◄─────►│ Slack Integration│◄─────►│ Game Engine │
└─────────────────┘       └──────────────────┘       └─────────────┘
                                   │                         │
                                   ▼                         ▼
                            ┌─────────────┐          ┌─────────────┐
                            │    Redis    │          │ EventBroadcaster│
                            │  Pub/Sub    │◄─────────│   Service    │
                            └─────────────┘          └─────────────┘
```

## Features

### 1. Real-time Notifications

The integration broadcasts these game events to Slack:

- **Chat Messages**: Player and AI conversations
- **Quest Updates**: Quest starts, completions, and step progress
- **Achievements**: Level ups and special accomplishments
- **Player Movement**: Location changes (when broadcast-enabled)
- **Score Changes**: Points earned or lost

### 2. Slash Commands

Available commands via `/mymcp`:

- `/mymcp help` - Display available commands
- `/mymcp status [player]` - View player status
- `/mymcp leaderboard` - Show top 10 players
- `/mymcp quest list` - List available quests
- `/mymcp chat <message>` - Send message to game

### 3. Smart Dashboard

Auto-updating dashboard includes:

- Total and active player counts
- 24-hour activity chart
- Real-time updates every 5 minutes
- Visual player engagement metrics

### 4. Daily Summaries

Automated daily reports at 9 AM featuring:

- 24-hour active player count
- Total combined score
- Top player highlights
- Engagement metrics

## Technical Implementation

### Event Broadcasting System

The `EventBroadcaster` service publishes game events to Redis channels:

```typescript
// Event channels
- game:chat
- game:quest:started
- game:quest:completed
- game:player:levelup
- game:player:achievement
- game:player:location
- game:state:update
```

### Slack App Architecture

The integration uses:

- **Slack Bolt SDK** for app framework
- **Socket Mode** for real-time events
- **Web API** for message posting
- **Block Kit** for rich formatting

### Player Identification

Slack users are mapped to game players using:
- Format: `slack-{userId}`
- Automatic player creation on first interaction
- Persistent player state across sessions

## Setup Instructions

### 1. Install Dependencies

```bash
cd packages/slack-integration
npm install
```

### 2. Configure Slack App

Create a new Slack app at [api.slack.com/apps](https://api.slack.com/apps) with:

**OAuth Scopes:**
- `chat:write`
- `chat:write.public`
- `commands`
- `im:history`
- `im:read`
- `im:write`
- `channels:history`
- `channels:read`

**Features:**
- Socket Mode enabled
- Slash commands configured
- Event subscriptions active

### 3. Environment Configuration

Create `.env` file:

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_DEFAULT_CHANNEL=#mymcp-game
SLACK_DASHBOARD_CHANNEL=#mymcp-dashboard
REDIS_URL=redis://localhost:6379
ENGINE_URL=http://localhost:3000
```

### 4. Run the Integration

```bash
# Development
npm run dev

# Production
npm run build && npm start
```

## Usage Examples

### Team Quest Coordination

```
Team Lead: /mymcp quest list
Bot: 📜 Available Quests:
     - Council of Three Realms
     - Dungeon Keeper's Vigil
     - Cryptomancer's Seal

Team Lead: /mymcp chat Let's tackle the Council quest together!
Bot: Excellent choice! The Council of Three Realms requires coordination...

Team Member: /mymcp status
Bot: Level: Apprentice | Score: 150 | Location: Town
```

### Dashboard Monitoring

The dashboard channel shows:

```
📊 myMCP Live Dashboard
Total Players: 25
Active Now: 12
[Activity Chart]
Last updated: Dec 28 at 3:45 PM
```

### Achievement Notifications

```
🏆 Alice earned a new achievement!
Realm Uniter
Successfully coordinated the Council of Three Realms

🎉 Bob leveled up!
Previous Level: Novice
New Level: Apprentice
```

## Advanced Features

### Custom Event Channels

Configure different Slack channels for different events:

```typescript
this.eventChannels = {
  'game:quest:completed': '#achievements',
  'game:player:levelup': '#achievements',
  'game:chat': '#game-chat'
};
```

### Rate Limiting

Built-in rate limiting prevents spam:
- 1 message per second per event type
- Dashboard updates every 5 minutes
- Respects Slack API limits

### Multi-Engine Support

Works seamlessly with multiplayer setup:
- Receives events from all game engines
- Consolidates player data across instances
- Maintains consistent state

## Troubleshooting

### Common Issues

1. **Bot not responding**
   - Verify bot is invited to channels
   - Check Socket Mode is enabled
   - Confirm tokens are correct

2. **Missing events**
   - Ensure Redis is running
   - Check engine EventBroadcaster is active
   - Verify Redis connection string

3. **Dashboard not updating**
   - Check dashboard channel permissions
   - Verify scheduled tasks are running
   - Look for errors in console logs

### Debug Mode

Enable debug logging:

```env
DEBUG=slack:*
```

## Best Practices

1. **Channel Organization**
   - Use dedicated channels for different purposes
   - Set appropriate notification levels
   - Archive old game channels

2. **Security**
   - Rotate tokens regularly
   - Use environment variables
   - Limit bot permissions

3. **Performance**
   - Monitor Redis memory usage
   - Implement event filtering if needed
   - Use channel-specific broadcasting

## Future Enhancements

Planned features include:

- Discord integration
- Microsoft Teams support
- Custom notification rules
- Advanced analytics dashboards
- Voice command support
- Mobile app notifications

## API Reference

### SlackIntegration Class

```typescript
class SlackIntegration {
  constructor(config: SlackConfig)
  async start(): Promise<void>
  async stop(): Promise<void>
}
```

### Configuration Options

```typescript
interface SlackConfig {
  botToken: string
  appToken: string
  signingSecret: string
  defaultChannel: string
  dashboardChannel?: string
  redisUrl?: string
  engineUrl?: string
}
```

## Contributing

To add new features:

1. Add event types to EventBroadcaster
2. Subscribe to events in SlackIntegration
3. Create handler methods
4. Update documentation

## Support

For issues or questions:
- Check setup guide in `SETUP.md`
- Review console logs
- Verify Slack app configuration
- Test Redis connectivity 