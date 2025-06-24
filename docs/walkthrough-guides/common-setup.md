# 🛠️ Common Setup for All Walkthrough Guides

## 🎯 **Before Starting Any Quest Adventure**

This guide covers the technical setup needed for **Level 2** and **Level 3** participants. **Level 1** participants need zero setup - just access to Slack!

---

## 📋 **Prerequisites Check**

```ascii
┌─────────────────────────────────────────────────────────┐
│ 🥉 LEVEL 1 (Slack Participant)                         │
├─────────────────────────────────────────────────────────┤
│ ✅ Access to #payments-lunch-n-learn Slack channel     │
│ ✅ Nothing else! Ready to go!                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐  
│ 🥈 LEVEL 2 (Engine Operator)                           │
├─────────────────────────────────────────────────────────┤
│ ✅ myMCP project cloned                                 │
│ ✅ Node.js and npm installed                           │
│ ✅ Terminal/command line access                        │
│ ✅ Port 3000+ available                                │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🥇 LEVEL 3 (AI-Powered Hero)                           │  
├─────────────────────────────────────────────────────────┤
│ ✅ Everything from Level 2                             │
│ ✅ OpenAI API key OR Anthropic API key                 │
│ ✅ Environment variable setup                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 **Level 2 Setup: Engine Operator**

### Step 1: Clone and Install
```bash
git clone https://github.com/jcaldwell1066/myMCP.git
cd myMCP
npm install
```

### Step 2: Environment Setup
```bash
cp env.example .env
# Edit .env with your preferences (ports, Redis URL, etc.)
```

### Step 3: Build and Start Engine
```bash
npm run build:all
npm run start:engine
```

### Step 4: Verify Connection
```bash
curl http://localhost:3000/health
# Should return: {"status": "ok", "message": "myMCP Engine is running strong!"}
```

---

## 🧠 **Level 3 Setup: AI-Powered Hero** 

### Step 1-3: Complete Level 2 Setup First
(Follow all Level 2 steps above)

### Step 4: Add LLM API Key
```bash
# For OpenAI:
export OPENAI_API_KEY="your-openai-key-here"

# OR for Anthropic:
export ANTHROPIC_API_KEY="your-anthropic-key-here"

# Add to your .env file for persistence:
echo "OPENAI_API_KEY=your-key-here" >> .env
```

### Step 5: Start AI-Enabled Engine
```bash
npm run start:engine
# Look for: "🤖 LLM: OpenAI GPT-4 initialized ✅"
```

### Step 6: Test AI Features
```bash
curl -X POST http://localhost:3000/api/chat/test-player \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello AI!"}'
# Should return AI-generated response
```

---

## 🌐 **Multiplayer Connection Setup**

### Shared Redis (All Levels)
The system uses a shared Redis instance for multiplayer coordination:
```
Redis URL: redis://default:K2fw74hvSoiwLtyP5xeAzevBFXpXHvhU@redis-16899.c12.us-east-1-4.ec2.redns.redis-cloud.com:16899
```

This is already configured in the project - no additional setup needed!

### Port Allocation
```ascii
📡 Standard Port Layout:

├─ 3000: Primary engine (usually Level 2 participant)
├─ 3001: Secondary engine (usually Level 3 AI participant)  
├─ 3002-3010: Additional engines for more participants
├─ 5175: Player dashboard (auto-configured)
└─ Slack: Bridge connects via WebSocket to engines
```

---

## 🔧 **Troubleshooting Common Issues**

### Engine Won't Start
```bash
# Check if port is in use:
netstat -an | grep 3000

# Kill existing process:
pkill -f "myMCP"

# Check Node.js version:
node --version  # Should be 18+ 
```

### Redis Connection Issues
```bash
# Test Redis connection:
curl http://localhost:3000/api/status
# Look for Redis connection status in response
```

### AI Features Not Working
```bash
# Verify API key is set:
echo $OPENAI_API_KEY

# Check LLM status:
curl http://localhost:3000/api/llm/status
```

---

## 🎮 **Verification: Ready for Adventure**

**Level 2 Ready Check:**
```bash
curl http://localhost:3000/health && echo "✅ Engine ready!"
curl http://localhost:3000/api/players && echo "✅ Multiplayer ready!"
```

**Level 3 Ready Check:**  
```bash
curl http://localhost:3000/api/llm/status && echo "✅ AI ready!"
curl -X POST http://localhost:3000/api/chat/test \
  -H "Content-Type: application/json" \
  -d '{"message": "Test"}' && echo "✅ Chat ready!"
```

---

## 🎭 **Character Assignment**

The system automatically assigns you a character based on your setup:

```ascii
🎭 CHARACTER ROSTER:

🥈 Level 2 Engine Operators:
├─ Bob the Code-Smith (Mountain Kingdom - GMT-7)
├─ David the Bug-Hunter (Forest Territory - GMT+0)
└─ Eve the API-Weaver (Desert Outpost - GMT+5:30)

🥇 Level 3 AI-Powered Heroes:  
├─ Carol the Interface-Weaver (Coastal Realm - GMT-5)
├─ Frank the Logic-Mage (Cloud Kingdom - GMT+1)
└─ Grace the Pattern-Seer (Island Sanctuary - GMT+9)

🥉 Level 1 Slack Participants:
└─ Alice the Coordinator (Royal Court - Timeless)
```

Your character is automatically selected based on:
- Your timezone
- Your engine port  
- Your participation level
- Available character slots

---

## 🎯 **Next Steps**

Once setup is complete, choose your adventure:

### 🤝 Council of Three Realms
- [Level 1: Slack Guide](council-level1-slack.md)
- [Level 2: Engine Guide](council-level2-engine.md)  
- [Level 3: AI Guide](council-level3-ai.md)

### 🏔️ Dungeon Keeper's Vigil
- [Level 1: Slack Guide](dungeon-level1-slack.md)
- [Level 2: Engine Guide](dungeon-level2-engine.md)
- [Level 3: AI Guide](dungeon-level3-ai.md)

### 🔮 Cryptomancer's Seal
- [Level 1: Slack Guide](crypto-level1-slack.md)
- [Level 2: Engine Guide](crypto-level2-engine.md)
- [Level 3: AI Guide](crypto-level3-ai.md)

---

*Setup complete! Ready to experience the interconnected magic of multiplayer quest coordination!* ✨🎮 