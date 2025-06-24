# Host Preparation Checklist

Use this checklist to ensure a smooth team training session.

## 1 Week Before

- [ ] Schedule training session (1.5 hours recommended)
- [ ] Send calendar invites with prep instructions
- [ ] Create/verify Slack workspace access
- [ ] Test the full setup yourself
- [ ] Prepare training materials/slides

## 1 Day Before

### Redis Setup
- [ ] Create free Redis Cloud account at [redis.com/try-free](https://redis.com/try-free)
- [ ] Create new database (30MB free tier)
- [ ] Copy Redis connection URL
- [ ] Test connection: `redis-cli -u "redis://..." ping`

### Slack App Setup
- [ ] Create Slack app following [Slack Integration Guide](../integrations/slack/README.md)
- [ ] Get all required tokens:
  - [ ] Bot User OAuth Token (xoxb-...)
  - [ ] App-Level Token (xapp-...)
  - [ ] Signing Secret
- [ ] Create channels:
  - [ ] `#mymcp-training`
  - [ ] `#mymcp-dashboard`
- [ ] Invite bot to both channels

### Repository Preparation
- [ ] Fork/clone myMCP repository
- [ ] Test complete setup locally
- [ ] Create `.env.team` template file
- [ ] Make `team-setup.sh` executable: `chmod +x team-setup.sh`

### Communication
- [ ] Send team prep email with:
  - [ ] Node.js installation instructions
  - [ ] Git repository URL
  - [ ] Time to join (30 min early for setup)
  - [ ] Slack channel links

## Day of Training (30 min before)

### Final Setup
- [ ] Start Slack integration:
  ```bash
  cd packages/slack-integration
  npm run dev
  ```
- [ ] Verify bot online in Slack
- [ ] Post welcome message in `#mymcp-training`
- [ ] Share Redis URL securely with team

### Team Member Support
- [ ] Help team members with setup issues
- [ ] Verify everyone can:
  - [ ] Clone repository
  - [ ] Run setup script
  - [ ] Start engine
  - [ ] See health check

## During Training

### Introduction (10 min)
- [ ] Explain architecture diagram
- [ ] Show how events flow through Redis
- [ ] Demo Slack commands
- [ ] Show dashboard channel

### Guided Activities
- [ ] Everyone starts same quest together
- [ ] Use breakout rooms for pair debugging
- [ ] Monitor `#mymcp-dashboard` for activity
- [ ] Encourage Slack interactions

### Troubleshooting Ready
- [ ] Have Redis CLI ready for debugging
- [ ] Monitor Slack integration logs
- [ ] Keep backup Redis instance ready
- [ ] Have ngrok installed as backup

## After Training

- [ ] Export Slack conversation
- [ ] Save dashboard screenshots
- [ ] Collect feedback
- [ ] Share recording/materials
- [ ] Clean up Redis (if desired)

## Emergency Contacts

During training, have ready:
- Redis Cloud status page
- Slack API status
- Your backup Redis URL
- Tech support contact

## Quick Commands Reference

```bash
# Check Redis
redis-cli -u $REDIS_URL ping

# Check who's connected
redis-cli -u $REDIS_URL smembers game:players

# Monitor events
redis-cli -u $REDIS_URL monitor

# Restart Slack integration
cd packages/slack-integration
npm run dev

# Emergency reset player
curl -X POST http://localhost:3000/api/actions/player-name \
  -H "Content-Type: application/json" \
  -d '{"type":"RESET","payload":{},"playerId":"player-name"}'
```

## Backup Plans

### If Redis Cloud is down:
1. Switch to local Redis + ngrok
2. Have Docker ready: `docker run -d -p 6379:6379 redis:7-alpine`
3. Use ngrok: `ngrok tcp 6379`

### If Slack is down:
1. Use terminal-only mode
2. Share screens for coordination
3. Use Discord as backup

### If someone can't connect:
1. Pair them with working teammate
2. Use screen share
3. Have them watch and participate via Slack

## Success Metrics

Training is successful when:
- [ ] All 6 members connected to shared Redis
- [ ] Everyone completed at least one quest
- [ ] Slack dashboard shows real-time updates
- [ ] Team successfully coordinated via Slack
- [ ] Technical concepts understood

Good luck with your training! 🎮✨ 