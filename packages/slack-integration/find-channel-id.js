console.log(`
To fix the channel_not_found error, you need to use the channel ID instead of the channel name.

In Slack:
1. Right-click on #payments-lunch-n-learn
2. Select "View channel details" 
3. At the bottom, you'll see "Channel ID: C0XXXXXX"
4. Copy that ID (starts with C)

Then update your .env file:
SLACK_DEFAULT_CHANNEL=C0XXXXXX
SLACK_DASHBOARD_CHANNEL=C0XXXXXX

(Replace C0XXXXXX with your actual channel ID)

Note: Channel IDs start with:
- C for public channels
- G for private channels
- D for direct messages
`);
