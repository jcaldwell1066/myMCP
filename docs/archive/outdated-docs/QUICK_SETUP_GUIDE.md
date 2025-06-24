# ⚡ Quick Setup Guide - Team Demo Participation

## 🥉 **Level 1: Slack Participant** 
### No setup required! Just show up at demo time.

---

## 🥈 **Level 2: Engine Operator** 

### Prerequisites:
- Node.js 18+ installed
- Git access
- 15 minutes

### 🚀 **Automated Setup (Recommended):**
```bash
# 1. Clone the repository
git clone https://github.com/yourusername/myMCP.git
cd myMCP

# 2. Run automated setup (replace 'your-name' with your actual name)
node tools/demo-setup.js 2 your-name

# 3. Start your engine when prompted
npm run start:engine
```

### 📋 **Manual Setup (Alternative):**
```bash
# 1. Clone the repository
git clone https://github.com/yourusername/myMCP.git
cd myMCP

# 2. Set up environment (Redis URL will be provided)
echo "REDIS_URL=redis://default:K2fw74hvSoiwLtyP5xeAzevBFXpXHvhU@redis-12991.c281.us-east-1-2.ec2.redns.redis-cloud.com:12991" > .env

# 3. Install and build
npm install
npm run build

# 4. Start your engine
npm run start:engine
```

### Success Check:
You should see:
```
🚀 myMCP Engine [your-name]-engine running on port 3000
📡 Redis: Connected to shared instance
⚡ Ready for multiplayer action!
```

### Demo Commands to Try:
```bash
# Check your player status
curl http://localhost:3000/api/players | jq

# Join the Council quest
curl -X POST http://localhost:3000/api/quests/start \
  -H "Content-Type: application/json" \
  -d '{"questId": "council-of-three-realms", "playerId": "your-player-id"}'
```

---

## 🥇 **Level 3: AI-Powered Player**

### Additional Prerequisites:
- Anthropic API key OR OpenAI API key
- 5 extra minutes

### 🚀 **Automated Setup (Recommended):**
```bash
# 1. Clone the repository
git clone https://github.com/yourusername/myMCP.git
cd myMCP

# 2. Run automated setup (replace 'your-name' with your actual name)  
node tools/demo-setup.js 3 your-name

# 3. Add your API key when prompted
echo "ANTHROPIC_API_KEY=your-key-here" >> .env
# OR
echo "OPENAI_API_KEY=your-key-here" >> .env

# 4. Start your engine
npm run start:engine
```

### 📋 **Manual Setup (Alternative):**
```bash
# Complete Level 2 setup first, then:

# Add to your .env file (choose one):
echo "ANTHROPIC_API_KEY=your-anthropic-key-here" >> .env
# OR
echo "OPENAI_API_KEY=your-openai-key-here" >> .env

# Restart your engine
npm run start:engine
```

### Success Check:
You should see:
```
🤖 Initialized 1 LLM provider(s): anthropic
# OR
🤖 Initialized 1 LLM provider(s): openai
```

### AI Demo Commands to Try:
```bash
# Natural language interaction
curl -X POST http://localhost:3000/api/actions/your-player-id \
  -H "Content-Type: application/json" \
  -d '{"type": "CHAT", "payload": {"message": "I want to join the Council quest and help coordinate the kingdoms"}}'
```

---

## 🚨 **Troubleshooting**

### Common Issues:

**"Port 3000 already in use"**
```bash
# Find what's using the port
lsof -i :3000
# Kill it or use different port
PORT=3001 npm run start:engine
```

**"Cannot connect to Redis"**
- Check the Redis URL in your `.env` file
- Verify network connectivity
- Try the health check: `curl http://localhost:3000/health`

**"NPM install fails"**
```bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**"TypeScript build errors"**
```bash
# Build dependencies first
npm run build --workspace=shared/types
npm run build
```

---

## 🆘 **Get Help**

### Before Demo Day:
- **Slack**: `#mymcp-demo` channel for questions
- **Screen share**: DM for quick 5-minute setup help
- **Documentation**: [Full setup guide](STARTUP_GUIDE.md)

### During Demo:
- **Backup plan**: If your engine crashes, you can still participate via Slack
- **Support**: Someone will be monitoring to help with live issues
- **No pressure**: The demo works with any number of participants

---

## 🎯 **Demo Day Checklist**

### 30 minutes before:
- [ ] Start your engine: `npm run start:engine`
- [ ] Verify health: `curl http://localhost:3000/health`
- [ ] Join Slack channel: `#mymcp-demo`

### During demo:
- [ ] Follow along with quest progression
- [ ] Try the commands shown in the demo
- [ ] Share observations in Slack
- [ ] Have fun! 🎮

### Your engine logs will show:
```
📡 Quest update: council-of-three-realms
🎮 Player [other-participants] joined the alliance
⚡ Multiplayer coordination in progress...
```

---

## 📋 **What to Expect**

### The Demo Flow:
1. **Introduction** (5 min) - What we're demonstrating
2. **Quest Launch** (10 min) - Everyone joins "Council of Three Realms"
3. **Collaboration** (15 min) - Use the system to coordinate real demo logistics
4. **AI Showcase** (5 min) - Natural language interactions (Level 3 participants)
5. **Debrief** (10 min) - How this applies to our real work

### Your Role:
- **Be authentic** - Real reactions, not performance
- **Share insights** - How could this help your area?
- **Ask questions** - What would you want to see added?
- **Have fun** - This is supposed to be engaging!

---

**Ready? The kingdoms await your participation!** 🏰✨

**Questions? Just ask in `#mymcp-demo` - we're here to help!** 