# 🎯 Friday Lunch & Learn: myMCP Interactive Demo
## Participant Self-Audit Packet

### Welcome to the Multi-Tier Participation Experience!

This demo showcases the myMCP (Multi-Modal Collaborative Platform) system through 9 levels of engagement. You can participate at any level that matches your comfort and available setup.

---

## 📋 Self-Check-In System

**Your Mission**: Experience as many participation tiers as you're comfortable with during our 45-minute journey through the myMCP ecosystem.

### 🎮 How the Game Works

- **Real-time Leaderboard**: Your participation is tracked live
- **Rotating DMs**: Green DM and Blue DM alternate every 15 minutes
- **Multiple Personas**: Choose a role that matches your interests
- **Flexible Participation**: Jump between tiers as you like

---

## 🏆 Participation Tiers & Self-Audit Checklist

### **Tier 1: Teams Attendance** (10 points)
**Description**: Present and visible in Microsoft Teams
- [ ] I am logged into the Teams meeting
- [ ] My camera/presence is visible to others
- [ ] I can see the presenter's screen
- **Self-Validation**: Check your name appears in the participant list

### **Tier 2: Teams Screen Sharing** (15 points)
**Description**: Actively sharing screen or viewing shared screens
- [ ] I am actively viewing shared content
- [ ] I can see demonstrations clearly
- [ ] I'm following along with screen shares
- **Self-Validation**: Confirm you're following the visual demonstrations

### **Tier 3: Teams Speaking/Presenting** (25 points)
**Description**: Verbally participating in discussions or presenting
- [ ] I have spoken or asked a question
- [ ] I've participated in Q&A sessions
- [ ] I've contributed to discussions
- **Self-Validation**: You've unmuted and actively spoken

### **Tier 4: Teams Q&A Participation** (30 points)
**Description**: Asking questions or providing answers during demo
- [ ] I've asked at least one question
- [ ] I've answered a question posed to the group
- [ ] I've engaged in back-and-forth discussion
- **Self-Validation**: You've had a meaningful exchange with DMs

### **Tier 5: Slack Channel Engagement** (35 points)
**Description**: Posting messages, reactions, or using `/mymcp` commands
- [ ] I've joined the demo Slack channel
- [ ] I've posted at least one message
- [ ] I've used a `/mymcp` command
- [ ] I've reacted to others' messages
- **Self-Validation**: Your messages appear in the Slack channel

**Quick Setup**: 
```
1. Join #mymcp-lunch-learn channel
2. Try: /mymcp help
3. Try: /mymcp status
4. Post: "I'm participating from Tier 5!"
```

### **Tier 6: Redis State Inspection** (50 points)
**Description**: Viewing live game state through Redis commands
- [ ] I have access to Redis CLI or Redis client
- [ ] I can connect to the demo Redis instance
- [ ] I've executed at least one Redis command
- [ ] I can see live game state changes
- **Self-Validation**: You've successfully run Redis commands and seen data

**Quick Setup**:
```bash
# Option 1: Redis CLI (if installed locally)
redis-cli -h demo-redis.mymcp.dev -p 6379

# Option 2: Web-based Redis client
# URL: https://redis-commander.mymcp.dev

# Try these commands:
KEYS game:*
GET game:state:current
HGETALL game:players:*
```

### **Tier 7: GitHub Repository Interaction** (60 points)
**Description**: Browsing code, issues, or contributing to the repo
- [ ] I've visited the myMCP GitHub repository
- [ ] I've browsed the codebase structure
- [ ] I've looked at recent issues or discussions
- [ ] I've starred or watched the repository
- **Self-Validation**: You've explored the repository beyond just opening it

**Quick Actions**:
```
1. Visit: https://github.com/your-org/myMCP
2. Browse: packages/engine/src/
3. Check: Recent Issues and Pull Requests
4. Explore: docs/ directory
5. Optional: Star the repository
```

### **Tier 8: Local Environment Setup** (100 points)
**Description**: Running engine/cli/web/mcp components locally
- [ ] I've cloned the repository locally
- [ ] I've installed dependencies (`npm install`)
- [ ] I've started at least one component locally
- [ ] I can connect to the local instance
- **Self-Validation**: You have a local service running and accessible

**Quick Setup**:
```bash
# Clone the repository
git clone https://github.com/your-org/myMCP.git
cd myMCP

# Install dependencies
npm install

# Start engine (easiest to begin with)
cd packages/engine
npm run dev

# Verify it's running
curl http://localhost:3000/api/health
```

### **Tier 9: Active Development/Contribution** (150 points)
**Description**: Making real-time code changes or submitting PRs
- [ ] I've made a code change locally
- [ ] I've tested my change
- [ ] I've committed my change to a branch
- [ ] I've pushed to GitHub or created a PR
- **Self-Validation**: You have active code contributions visible

**Contribution Ideas**:
```
- Fix a typo in documentation
- Add a console.log for debugging
- Modify a configuration value
- Add a new slash command
- Update README with your setup notes
```

---

## 🎭 Choose Your Persona

Select the role that best matches your interests and skills:

### **Technology-Focused Personas**
- **DevOps Engineer**: Focus on Tiers 6, 8, 9 (Infrastructure & Deployment)
- **Backend Developer**: Focus on Tiers 6, 7, 8, 9 (APIs & Architecture)
- **AI/ML Engineer**: Focus on Tiers 7, 8, 9 (Integration & Algorithms)
- **Platform Engineer**: Focus on Tiers 6, 8, 9 (Developer Experience)
- **Site Reliability Engineer**: Focus on Tiers 6, 8, 9 (Monitoring & Performance)

### **Collaboration-Focused Personas**
- **Product Manager**: Focus on Tiers 1, 2, 3, 4, 5 (Strategy & Communication)
- **Engineering Manager**: Focus on Tiers 2, 3, 4, 5 (Leadership & Direction)
- **Technical Writer**: Focus on Tiers 1, 2, 3, 4, 5 (Documentation & Process)
- **Business Analyst**: Focus on Tiers 1, 2, 3, 4 (Requirements & Analysis)

### **Quality & Design Personas**
- **QA Specialist**: Focus on Tiers 4, 5, 6 (Testing & Quality)
- **UI/UX Developer**: Focus on Tiers 2, 3, 5 (Design & User Experience)
- **Security Engineer**: Focus on Tiers 6, 7, 8 (Security & Compliance)
- **Data Analyst**: Focus on Tiers 5, 6, 7 (Metrics & Insights)

### **Explorer Personas**
- **Solutions Architect**: Focus on Tiers 4, 5, 6, 7, 8 (Integration & Strategy)
- **Mobile Developer**: Focus on Tiers 3, 5, 7, 8 (App Development)
- **Curious Observer**: Focus on Tiers 1, 2, 3 (Learning & Questions)

---

## ⏱️ Demo Timeline & Phases

### **Phase 1: Welcome & System Overview** (10 minutes)
- **DM**: Green DM
- **Focus**: Understanding the architecture
- **Your Goal**: Achieve Tiers 1-2, ask questions

### **Phase 2: Interactive Participation Demo** (20 minutes)
- **DM**: Blue DM (rotation happens here!)
- **Focus**: Hands-on engagement
- **Your Goal**: Push into Tiers 3-7, try different features

### **Phase 3: Advanced Features & Development** (10 minutes)
- **DM**: Green DM (rotation back)
- **Focus**: Live coding and advanced features
- **Your Goal**: Attempt Tiers 8-9 if possible

### **Phase 4: Q&A and Next Steps** (5 minutes)
- **DM**: Both DMs
- **Focus**: Questions and resources
- **Your Goal**: Understand next steps and resources

---

## 🎯 Quick Start Checklist

**Before the Demo Starts**:
- [ ] Teams meeting joined and audio/video working
- [ ] Slack workspace access confirmed
- [ ] Choose your persona from the list above
- [ ] Decide your target tier range
- [ ] Have GitHub account ready (if aiming for Tier 7+)

**During the Demo**:
- [ ] Follow the DM transitions and announcements
- [ ] Self-report your tier achievements in Slack
- [ ] Ask questions that match your persona
- [ ] Help others if you're in higher tiers
- [ ] Watch the real-time leaderboard

**Quick Slack Commands to Try**:
```
/mymcp help                    # See all available commands
/mymcp status                  # Check your current status
/mymcp leaderboard            # View current standings
/demo-join [persona-name]      # Join with your chosen persona
/demo-status                   # Check demo progress
/demo-tier [number]            # Report tier completion
```

---

## 🔧 Troubleshooting & Support

### **Common Issues**

**Can't connect to Slack?**
- Verify you're in the correct workspace
- Try refreshing or rejoining the channel

**Redis connection failing?**
- Try the web-based Redis Commander instead
- Check firewall settings if using CLI

**Local setup not working?**
- Ensure Node.js 18+ is installed
- Try `npm ci` instead of `npm install`
- Check port availability (3000, 6379, etc.)

**GitHub access issues?**
- Ensure you're logged into GitHub
- Try accessing in incognito/private mode
- Verify repository permissions

### **Getting Help**

During the demo:
- **Slack**: Post in #mymcp-lunch-learn with your issue
- **Voice**: Ask questions during Q&A segments
- **Peer Support**: Higher-tier participants often help others

### **Post-Demo Support**

- **Documentation**: Check `/docs` in the repository
- **Issues**: Create GitHub issues for bugs or questions
- **Slack**: Continue conversations in dedicated channels
- **Follow-up**: Schedule 1:1s with DMs if needed

---

## 🏅 Success Metrics

You're successful if you:
- **Engage at your comfort level** without stress
- **Learn something new** about system architecture
- **Connect with colleagues** through shared experience
- **Have fun** while exploring technology
- **Know your next steps** for continued learning

**Remember**: This is about learning and collaboration, not competition. Help others, ask questions, and enjoy the journey through the myMCP ecosystem!

---

*Live leaderboard and real-time updates available at: [https://demo.mymcp.dev/dashboard]*