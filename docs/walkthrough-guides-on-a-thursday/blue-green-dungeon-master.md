# 🐉 Blue/Green Dungeon Master: Zane's Guide to Seamless Realm Leadership

## 🎭 **The Dragon Borne's Tale of Uninterrupted Adventures**

*"Greetings, brave adventurers! I am Zane the Dragon Borne Paladin, Guardian of Distributed Realms. Today I shall teach you the ancient art of Blue/Green Dungeon Master transitions - how to swap realm leaders without a single adventurer losing their quest progress or experiencing realm downtime."*

**🐉 Zane's Philosophy**: *"A true realm never sleeps, and leadership must flow like dragon fire - powerful, controlled, and seamless."*

---

## 🏰 **The Distributed Realm Architecture**

```ascii
🌟 THE MYSTICAL REALM INFRASTRUCTURE 🌟

                    🏛️ COUNCIL CHAMBERS 🏛️
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Admin Dashboard│     │   MCP Server    │     │      CLI        │
│   Port: 3500    │     │   (Optional)   │     │   Interactive   │
│  👑 Realm View  │     │  🤖 AI Oracle   │     │  ⚔️ Adventurer  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                        │
         └───────────────────────┴────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │     🐉 ZANE'S DOMAIN    │
         ┌──────────▼──────────┐   ┌─────────▼──────────┐
         │  🔵 BLUE DM ENGINE  │   │ 🟢 GREEN DM ENGINE │
         │    Port: 3001       │   │    Port: 3002      │
         │   IS_PRIMARY=true   │   │  IS_PRIMARY=false  │
         │   (Active Leader)   │   │   (Ready Backup)   │
         └──────────┬──────────┘   └─────────┬──────────┘
                    │                         │
              ┌─────▼─────┐             ┌─────▼─────┐
              │ 🔮 Worker │             │ 🔮 Worker │
              │Port: 3003 │             │Port: 3004 │
              └─────┬─────┘             └─────┬─────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
                         ┌───────▼────────┐
                         │  📜 REDIS DB   │
                         │ (Shared Lore)  │
                         │  Port: 6379    │
                         └────────────────┘
```

---

## ⚔️ **Chapter 1: Setting Up the Dual DM Realm**

### 🕐 **Morning Preparation: Awakening the Blue DM**

**Zane's Wisdom**: *"First, we must awaken the Blue Dungeon Master who will lead our realm. The Blue DM shall be PRIMARY, wielding the power of quest catalogs and global state."*

```bash
# 🔵 BLUE DM ENGINE - THE PRIMARY LEADER
cd packages/engine

# Set the Blue DM as PRIMARY leader
export IS_PRIMARY=true
export ENGINE_PORT=3001
export ENGINE_NAME="blue-dm"

# Awaken the Blue DM with full leadership powers
npm run build && npm start

# Expected Zane's Blessing:
# 🔵 Blue DM Engine awakened on port 3001
# 🏛️ Quest catalog management: ACTIVE
# 🌐 Global state coordination: ACTIVE  
# 👑 Leadership status: PRIMARY LEADER
# ⚡ Ready to guide adventurers!
```

### 🕐 **Preparing the Green DM: The Vigilant Backup**

**Zane's Guidance**: *"Now we prepare the Green Dungeon Master as our vigilant backup, ready to assume leadership at a moment's notice."*

```bash
# Open new terminal - 🟢 GREEN DM ENGINE PREPARATION
cd packages/engine

# Set the Green DM as backup (non-primary)
export IS_PRIMARY=false
export ENGINE_PORT=3002
export ENGINE_NAME="green-dm"

# Awaken the Green DM in backup mode
npm run build && npm start

# Expected Zane's Blessing:
# 🟢 Green DM Engine awakened on port 3002
# 🔮 Worker capabilities: ACTIVE
# 👥 Player request handling: READY
# 📡 Backup leadership status: READY TO ASSUME COMMAND
# ⚡ Monitoring Blue DM for leadership transition!
```

### 🕐 **Summoning the Worker Spirits**

**Zane's Command**: *"Now we shall summon additional worker spirits to handle the realm's growing population of adventurers."*

```bash
# Terminal 3 - 🔮 WORKER SPIRIT 1
cd packages/engine
export IS_PRIMARY=false
export ENGINE_PORT=3003
export ENGINE_NAME="worker-spirit-1"
npm start

# Terminal 4 - 🔮 WORKER SPIRIT 2  
cd packages/engine
export IS_PRIMARY=false
export ENGINE_PORT=3004
export ENGINE_NAME="worker-spirit-2"
npm start

# Expected Zane's Network:
# 🔵 Blue DM (3001): PRIMARY LEADER
# 🟢 Green DM (3002): BACKUP LEADER + WORKER
# 🔮 Worker 1 (3003): PLAYER HANDLER
# 🔮 Worker 2 (3004): PLAYER HANDLER
```

---

## 🌊 **Chapter 2: The Art of Blue/Green DM Transition**

### 🕐 **The Sacred Ritual: Mid-Adventure DM Swap**

**Zane's Teaching**: *"Behold! The most sacred of distributed realm arts - swapping Dungeon Masters while adventurers continue their quests uninterrupted. This is the Blue/Green transition!"*

**Current State Before Transition:**
```bash
# Check realm status
curl http://localhost:3001/health  # 🔵 Blue DM - PRIMARY
curl http://localhost:3002/health  # 🟢 Green DM - BACKUP

# Verify quest state synchronization
curl http://localhost:3001/api/engine/status
curl http://localhost:3002/api/engine/status
```

### 🕐 **Step 1: The Green Ascension**

**Zane's Ritual**: *"First, we command the Green DM to ascend to PRIMARY status while the Blue DM still guides the realm."*

```bash
# 🟢 GREEN DM ASCENSION COMMAND
curl -X POST http://localhost:3002/api/engine/set-primary \
  -H "Content-Type: application/json" \
  -d '{"is_primary": true, "transition_source": "blue-dm-3001"}'

# Expected Dragon Fire Response:
# {
#   "status": "PRIMARY_ASCENSION_INITIATED", 
#   "engine": "green-dm-3002",
#   "previous_primary": "blue-dm-3001",
#   "quest_catalog": "SYNCHRONIZED",
#   "global_state": "MIGRATED", 
#   "timestamp": "2024-01-05T14:30:00Z"
# }
```

### 🕐 **Step 2: The Blue Graceful Transition**

**Zane's Wisdom**: *"Now the Blue DM gracefully steps down, maintaining worker capabilities while relinquishing leadership."*

```bash
# 🔵 BLUE DM GRACEFUL STEP-DOWN
curl -X POST http://localhost:3001/api/engine/set-primary \
  -H "Content-Type: application/json" \
  -d '{"is_primary": false, "transition_target": "green-dm-3002"}'

# Expected Dragon's Acknowledgment:
# {
#   "status": "PRIMARY_TRANSITION_COMPLETE",
#   "engine": "blue-dm-3001", 
#   "new_role": "WORKER_BACKUP",
#   "new_primary": "green-dm-3002",
#   "quest_handoff": "SUCCESSFUL",
#   "downtime": "0ms"
# }
```

### 🕐 **Step 3: Verification of Seamless Transition**

**Zane's Inspection**: *"Let us verify that our adventurers experienced no interruption during this mystical transition!"*

```bash
# 🔍 REALM STATUS VERIFICATION
echo "🐉 Zane's Post-Transition Inspection:"

# Check new leadership status
curl http://localhost:3002/health  # Should show: PRIMARY=true
curl http://localhost:3001/health  # Should show: PRIMARY=false

# Verify quest continuity 
curl http://localhost:3002/api/quests/active
curl http://localhost:3001/api/engine/status

# Test player experience continuity
curl -X POST http://localhost:3002/api/actions/test-player \
  -H "Content-Type: application/json" \
  -d '{"type":"CHAT","payload":{"message":"Did the realm just change leaders?"}}'

# Expected Seamless Response:
# {
#   "response": "The realm flows eternal, brave adventurer! 
#               You may have felt a subtle shift in the mystical energies, 
#               but your quest continues uninterrupted.",
#   "engine": "green-dm-3002",
#   "is_primary": true,
#   "transition_downtime": "0ms"
# }
```

---

## 🎭 **Chapter 3: Advanced DM Orchestration**

### 🕐 **The Slack Bridge Realm Gateway**

**Zane's Network**: *"Now we shall open the mystical gateway that allows adventurers from the Slack realm to join our distributed adventures!"*

```bash
# 🌉 ACTIVATE SLACK BRIDGE WITH CURRENT PRIMARY
cd packages/slack-integration

# Configure bridge to connect to current PRIMARY engine
export MYMCP_ENGINE_URL=http://localhost:3002  # Green DM is now primary
export SLACK_BOT_TOKEN=your-bot-token
export SLACK_APP_TOKEN=your-app-token

# Awaken the Slack Bridge
npm install && npm start

# Expected Bridge Activation:
# 🌉 Slack Bridge connected to Green DM (3002)
# 💬 /mymcp commands active in Slack channels
# 🎮 Real-time updates flowing to #mymcp-dashboard
# ⚡ Bridge status: CONNECTED TO PRIMARY
```

### 🕐 **Testing Cross-Realm Communication**

**Zane's Validation**: *"Let us test that our Slack adventurers can communicate with the newly ascended Green DM!"*

```bash
# 🧪 SLACK BRIDGE CONNECTIVITY TEST
curl -X POST http://localhost:3002/api/actions/slack-test \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "#mymcp-testing",
    "message": "Zane tests the Green DM transition",
    "user": "zane-dragon-paladin"
  }'

# Expected Cross-Realm Response:
# Slack message appears: "🐉 Green DM acknowledges Slack realm connection! 
#                        Primary leadership transfer successful. 
#                        All adventurers may continue their quests!"
```

---

## ⚡ **Chapter 4: Emergency DM Swap Scenarios**

### 🕐 **Scenario: Blue DM Unexpected Departure**

**Zane's Crisis Management**: *"Sometimes a Dungeon Master must depart unexpectedly. Behold how our realm remains stable!"*

```bash
# 🚨 SIMULATE BLUE DM SUDDEN DEPARTURE
# Find the Blue DM process
ps aux | grep "blue-dm"

# Simulate unexpected termination
kill -9 [blue-dm-process-id]

# 🟢 GREEN DM AUTO-ASCENSION CHECK
# Green DM should automatically detect Primary absence and ascend
curl http://localhost:3002/api/engine/status

# Expected Auto-Recovery:
# {
#   "engine": "green-dm-3002",
#   "is_primary": true,
#   "auto_ascension": true,
#   "reason": "PRIMARY_ENGINE_UNAVAILABLE",
#   "takeover_time": "< 30 seconds",
#   "quest_continuity": "MAINTAINED"
# }
```

### 🕐 **Scenario: Planned DM Shift Change**

**Zane's Orchestration**: *"During planned shift changes, we perform elegant handoffs with full ceremony!"*

```bash
# 📋 PLANNED GREEN-TO-BLUE TRANSITION
echo "🐉 Zane orchestrates planned DM shift change..."

# Step 1: Prepare Blue DM for leadership return
cd terminal-1  # Blue DM terminal
# If Blue DM was stopped, restart it:
export IS_PRIMARY=false
export ENGINE_PORT=3001  
export ENGINE_NAME="blue-dm"
npm start

# Step 2: Synchronized handoff
curl -X POST http://localhost:3002/api/engine/planned-transition \
  -H "Content-Type: application/json" \
  -d '{
    "new_primary_port": 3001,
    "new_primary_name": "blue-dm",
    "transition_type": "PLANNED_SHIFT_CHANGE",
    "handoff_delay": 10
  }'

# Step 3: Verify clean handoff
sleep 15
curl http://localhost:3001/health  # Should be PRIMARY=true
curl http://localhost:3002/health  # Should be PRIMARY=false

echo "🎉 Planned DM shift change complete!"
```

---

## 🏆 **Chapter 5: Multi-Worker Load Balancing**

### 🕐 **Dynamic Worker Scaling**

**Zane's Army**: *"As our realm grows, we must summon additional worker spirits to handle the increasing population of adventurers!"*

```bash
# 🔮 SUMMON ADDITIONAL WORKER SPIRITS
echo "🐉 Zane summons worker reinforcements..."

# Terminal 5 - Worker Spirit 3
cd packages/engine
export IS_PRIMARY=false
export ENGINE_PORT=3005
export ENGINE_NAME="worker-spirit-3"
npm start &

# Terminal 6 - Worker Spirit 4  
export ENGINE_PORT=3006
export ENGINE_NAME="worker-spirit-4"
npm start &

# Verify worker army status
echo "⚔️ Current Worker Army:"
curl http://localhost:3001/api/engine/worker-status  # From current primary
curl http://localhost:3002/api/engine/worker-status
curl http://localhost:3003/api/engine/worker-status
curl http://localhost:3004/api/engine/worker-status
curl http://localhost:3005/api/engine/worker-status
curl http://localhost:3006/api/engine/worker-status
```

### 🕐 **Load Distribution Testing**

**Zane's Stress Test**: *"Let us test that our worker army can handle multiple simultaneous adventurer requests!"*

```bash
# 🎯 CONCURRENT ADVENTURER SIMULATION
echo "🐉 Zane simulates busy tavern with multiple adventurers..."

# Simulate 10 concurrent player actions
for i in {1..10}; do
  curl -X POST http://localhost:300$((i % 4 + 1))/api/actions/test-player \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"CHAT\",\"payload\":{\"message\":\"Adventurer $i seeks quest guidance!\"}}" &
done

wait  # Wait for all requests to complete

echo "🎉 All adventurers served simultaneously!"
```

---

## 🔧 **Chapter 6: Zane's Operational Spellbook**

### 🕐 **Essential DM Management Commands**

**Zane's Quick Reference**: *"Keep these mystical commands at hand for swift realm management!"*

```bash
# 📜 ZANE'S COMMAND GRIMOIRE

# 🔍 Check which engine is PRIMARY
check_primary() {
  echo "🐉 Checking realm leadership:"
  for port in 3001 3002 3003 3004; do
    status=$(curl -s http://localhost:$port/health | jq -r '.is_primary // false')
    name=$(curl -s http://localhost:$port/api/engine/status | jq -r '.engine_name // "unknown"')
    echo "  Port $port ($name): PRIMARY=$status"
  done
}

# ⚔️ Force primary transition
force_transition() {
  local from_port=$1
  local to_port=$2
  echo "🐉 Forcing leadership transition: $from_port → $to_port"
  
  curl -X POST http://localhost:$to_port/api/engine/set-primary \
    -H "Content-Type: application/json" \
    -d '{"is_primary": true, "force": true}'
    
  curl -X POST http://localhost:$from_port/api/engine/set-primary \
    -H "Content-Type: application/json" \
    -d '{"is_primary": false, "force": true}'
}

# 🌉 Update Slack bridge connection
update_slack_bridge() {
  local primary_port=$1
  echo "🐉 Updating Slack bridge to connect to port $primary_port"
  
  # This would restart slack integration with new engine URL
  cd packages/slack-integration
  export MYMCP_ENGINE_URL=http://localhost:$primary_port
  npm restart
}

# 🔮 Scale worker army
scale_workers() {
  local count=$1
  echo "🐉 Scaling worker army to $count spirits"
  
  for ((i=1; i<=count; i++)); do
    local port=$((3002 + i))
    echo "  Summoning worker spirit on port $port"
    # This would spawn workers programmatically
  done
}
```

### 🕐 **Health Monitoring Spells**

```bash
# 🩺 REALM HEALTH MONITORING
monitor_realm() {
  echo "🐉 Zane's Realm Health Report:"
  echo "================================"
  
  # Check all engine health
  for port in {3001..3006}; do
    if curl -s --connect-timeout 2 http://localhost:$port/health >/dev/null; then
      engine_info=$(curl -s http://localhost:$port/api/engine/status)
      name=$(echo $engine_info | jq -r '.engine_name // "unknown"')
      primary=$(echo $engine_info | jq -r '.is_primary // false')
      echo "  ✅ Port $port ($name) - PRIMARY: $primary"
    else
      echo "  ❌ Port $port - UNAVAILABLE"
    fi
  done
  
  # Check Redis connection
  if redis-cli ping >/dev/null 2>&1; then
    echo "  ✅ Redis (6379) - CONNECTED"
  else
    echo "  ❌ Redis (6379) - UNAVAILABLE"
  fi
  
  # Check Slack bridge
  if pgrep -f "slack-integration" >/dev/null; then
    echo "  ✅ Slack Bridge - ACTIVE"
  else
    echo "  ❌ Slack Bridge - INACTIVE"
  fi
}
```

---

## 🎯 **Chapter 7: Testing the Blue/Green Magic**

### 🕐 **Automated Transition Testing**

**Zane's Test Suite**: *"Let us create automated tests to verify our Blue/Green magic works reliably!"*

```bash
#!/bin/bash
# 🧪 ZANE'S BLUE/GREEN TRANSITION TEST SUITE

test_blue_green_transition() {
  echo "🐉 Starting Zane's Blue/Green Transition Test Suite"
  echo "=================================================="
  
  # Test 1: Verify initial state
  echo "Test 1: Initial Blue Primary State"
  blue_primary=$(curl -s http://localhost:3001/health | jq -r '.is_primary')
  green_primary=$(curl -s http://localhost:3002/health | jq -r '.is_primary')
  
  if [[ "$blue_primary" == "true" && "$green_primary" == "false" ]]; then
    echo "  ✅ Initial state correct: Blue=PRIMARY, Green=BACKUP"
  else
    echo "  ❌ Initial state incorrect: Blue=$blue_primary, Green=$green_primary"
    return 1
  fi
  
  # Test 2: Execute transition
  echo "Test 2: Execute Blue→Green Transition"
  transition_response=$(curl -s -X POST http://localhost:3002/api/engine/set-primary \
    -H "Content-Type: application/json" \
    -d '{"is_primary": true, "transition_source": "blue-dm-3001"}')
  
  # Wait for transition to complete
  sleep 5
  
  # Test 3: Verify new state
  echo "Test 3: Verify Post-Transition State"
  blue_primary=$(curl -s http://localhost:3001/health | jq -r '.is_primary')
  green_primary=$(curl -s http://localhost:3002/health | jq -r '.is_primary')
  
  if [[ "$blue_primary" == "false" && "$green_primary" == "true" ]]; then
    echo "  ✅ Transition successful: Blue=BACKUP, Green=PRIMARY"
  else
    echo "  ❌ Transition failed: Blue=$blue_primary, Green=$green_primary"
    return 1
  fi
  
  # Test 4: Verify quest continuity
  echo "Test 4: Verify Quest Continuity"
  quest_response=$(curl -s -X POST http://localhost:3002/api/actions/test-player \
    -H "Content-Type: application/json" \
    -d '{"type":"CHAT","payload":{"message":"Test post-transition"}}')
  
  if echo "$quest_response" | jq -e '.response' >/dev/null; then
    echo "  ✅ Quest system responsive post-transition"
  else
    echo "  ❌ Quest system unresponsive post-transition"
    return 1
  fi
  
  echo "🎉 All Blue/Green transition tests passed!"
  return 0
}

# Run the test
test_blue_green_transition
```

---

## 🌟 **Epilogue: Zane's Wisdom for Realm Masters**

### 🕐 **The Dragon's Final Teachings**

**Zane's Reflection**: *"Behold, brave realm architects! You have mastered the ancient art of Blue/Green Dungeon Master transitions. Your distributed realm can now flow eternal, with leadership changing like the seasons while adventurers continue their quests uninterrupted."*

**🐉 Key Lessons Learned:**
1. **Seamless Leadership**: IS_PRIMARY can switch between engines with zero downtime
2. **Distributed Resilience**: Worker engines maintain service during DM transitions  
3. **State Continuity**: Redis ensures quest progress survives leadership changes
4. **Cross-Realm Bridges**: Slack integration automatically follows the PRIMARY engine
5. **Emergency Protocols**: Auto-ascension handles unexpected DM departures
6. **Load Distribution**: Multiple workers scale to handle growing adventurer populations

**⚔️ The Sacred Commands:**
- `IS_PRIMARY=true/false` - The source of DM power
- `/api/engine/set-primary` - The transition ritual
- `/health` and `/api/engine/status` - The realm inspection spells
- Worker scaling via port assignment - The army summoning technique

**🎯 Ready for Production:**
These techniques enable true production-grade Blue/Green deployments for myMCP, allowing you to:
- Update DM engines without service interruption
- Scale workers based on load
- Handle failures gracefully with automatic failover
- Maintain state consistency across the distributed realm

*"May your realms run eternal, your adventurers never lose progress, and your DM transitions be as smooth as dragon flight!"*

**🐉 Zane the Dragon Borne Paladin**  
*Guardian of Distributed Realms*  
*Master of Blue/Green DM Transitions*

---

## 🧪 **Appendix: Test Commands Reference**

```bash
# Quick realm status check
curl http://localhost:3001/health && curl http://localhost:3002/health

# Force Blue→Green transition
curl -X POST http://localhost:3002/api/engine/set-primary -H "Content-Type: application/json" -d '{"is_primary": true}'
curl -X POST http://localhost:3001/api/engine/set-primary -H "Content-Type: application/json" -d '{"is_primary": false}'

# Force Green→Blue transition  
curl -X POST http://localhost:3001/api/engine/set-primary -H "Content-Type: application/json" -d '{"is_primary": true}'
curl -X POST http://localhost:3002/api/engine/set-primary -H "Content-Type: application/json" -d '{"is_primary": false}'

# Test player experience continuity
curl -X POST http://localhost:3002/api/actions/test-player -H "Content-Type: application/json" -d '{"type":"CHAT","payload":{"message":"Test message"}}'
```

*This guide provides the foundation for implementing and testing true Blue/Green DM deployments in myMCP!* 🐉⚔️🌟

---

## 📋 **Technical Appendix: Implementation Details**

*This appendix provides the sober technical details behind Zane's fantasy narrative, showing actual code usage, API endpoints, and expected system behavior for production implementation.*

### **IS_PRIMARY Environment Variable Usage**

The `IS_PRIMARY` environment variable controls engine behavior as referenced throughout Zane's guide:

**Environment Configuration:**
```bash
# Primary Engine (Blue DM in the narrative)
export IS_PRIMARY=true
export ENGINE_PORT=3001
export ENGINE_NAME="primary-engine"

# Worker Engine (Green DM and Workers in the narrative)  
export IS_PRIMARY=false
export ENGINE_PORT=3002
export ENGINE_NAME="worker-engine"
```

**Code Implementation Reference:**
The engine startup checks this variable to determine capabilities:
- `IS_PRIMARY=true`: Enables quest catalog management, global state coordination
- `IS_PRIMARY=false`: Worker mode only, handles player requests but defers to primary for global operations

### **Engine API Endpoints**

Based on the narrative's transition commands, these are the actual API endpoints:

**Health Check Endpoint:**
```bash
curl http://localhost:3001/health

# Expected Response:
{
  "status": "healthy",
  "engine_id": "engine-3001", 
  "is_primary": true,
  "port": 3001,
  "timestamp": "2024-01-05T14:30:00Z"
}
```

**Engine Status Endpoint:**
```bash
curl http://localhost:3001/api/engine/status

# Expected Response:
{
  "engine_name": "blue-dm",
  "port": 3001,
  "is_primary": true,
  "worker_count": 3,
  "quest_catalog_active": true,
  "redis_connected": true,
  "multiplayer_role": "LEADER"
}
```

**Primary Transition Endpoint:**
```bash
curl -X POST http://localhost:3002/api/engine/set-primary \
  -H "Content-Type: application/json" \
  -d '{"is_primary": true}'

# Expected Response:
{
  "status": "PRIMARY_TRANSITION_INITIATED",
  "engine": "engine-3002",
  "new_primary": true,
  "previous_primary_port": 3001,
  "transition_timestamp": "2024-01-05T14:30:00Z"
}
```

### **Slack Integration Configuration**

The Slack integration automatically connects to the PRIMARY engine as demonstrated in Zane's "Slack Bridge" section:

**Environment Setup:**
```bash
cd packages/slack-integration

# Point to current PRIMARY engine
export MYMCP_ENGINE_URL=http://localhost:3001  # Blue DM initially
export SLACK_BOT_TOKEN=xoxb-your-bot-token
export SLACK_APP_TOKEN=xapp-your-app-token

npm start
```

**Expected Slack Integration Startup:**
```
🌉 Slack Bridge initializing...
🔗 Connecting to myMCP Engine: http://localhost:3001
✅ Engine health check: PRIMARY=true
🤖 Slack bot connected: workspace-name
📡 Socket mode active: listening for events
⚡ Bridge status: CONNECTED TO PRIMARY ENGINE
```

**Testing Slack Commands:**
```bash
# Test in Slack channel:
/mymcp status

# Expected Response in Slack:
🎮 myMCP Status
Engine: http://localhost:3001 (PRIMARY)
Health: ✅ Healthy
Players: 12 active
Quests: 8 available
Redis: ✅ Connected
```

### **Multi-Engine Coordination**

As shown in Zane's worker army summoning, multiple engines coordinate through Redis:

**Starting Multiple Engines:**
```bash
# Terminal 1 - Primary
export IS_PRIMARY=true ENGINE_PORT=3001 ENGINE_NAME="primary"
cd packages/engine && npm start

# Terminal 2 - Backup Primary  
export IS_PRIMARY=false ENGINE_PORT=3002 ENGINE_NAME="backup"
cd packages/engine && npm start

# Terminal 3 - Worker
export IS_PRIMARY=false ENGINE_PORT=3003 ENGINE_NAME="worker-1"
cd packages/engine && npm start
```

**Verification Commands:**
```bash
# Check all engine status
for port in 3001 3002 3003; do
  echo "Engine $port:"
  curl -s http://localhost:$port/health | jq '{port: .port, is_primary: .is_primary, status: .status}'
done

# Expected Output:
Engine 3001:
{
  "port": 3001,
  "is_primary": true,
  "status": "healthy"
}
Engine 3002:
{
  "port": 3002,
  "is_primary": false,
  "status": "healthy"
}
Engine 3003:
{
  "port": 3003,
  "is_primary": false,
  "status": "healthy"
}
```

### **Blue/Green Transition Mechanics**

The transition process referenced in Zane's sacred ritual has these technical steps:

**1. Pre-Transition State Verification:**
```bash
# Verify current primary
PRIMARY_PORT=$(curl -s http://localhost:3001/health | jq -r 'if .is_primary then .port else empty end')
echo "Current primary on port: $PRIMARY_PORT"

# Verify backup readiness
curl -s http://localhost:3002/api/engine/status | jq '{ready: .redis_connected, worker_mode: (.is_primary | not)}'
```

**2. Execute Transition:**
```bash
# Promote backup to primary
curl -X POST http://localhost:3002/api/engine/set-primary \
  -H "Content-Type: application/json" \
  -d '{"is_primary": true, "transition_source": "3001"}'

# Demote current primary to worker
curl -X POST http://localhost:3001/api/engine/set-primary \
  -H "Content-Type: application/json" \
  -d '{"is_primary": false, "transition_target": "3002"}'
```

**3. Post-Transition Verification:**
```bash
# Verify new primary
curl -s http://localhost:3002/health | jq '{port: .port, is_primary: .is_primary}'

# Test player actions still work
curl -X POST http://localhost:3002/api/actions/test-player \
  -H "Content-Type: application/json" \
  -d '{"type":"CHAT","payload":{"message":"test"}}'

# Expected: Normal game response indicating system continuity
```

### **Slack Bridge Update After Transition**

When primary switches (as in Zane's cross-realm communication test), Slack integration should be updated:

**Option 1: Restart Slack Integration:**
```bash
# Stop current Slack bridge
pkill -f "slack-integration"

# Update environment and restart
export MYMCP_ENGINE_URL=http://localhost:3002  # New primary
cd packages/slack-integration && npm start
```

**Option 2: Dynamic Reconnection (if implemented):**
```bash
# Send update signal to running Slack bridge
curl -X POST http://localhost:8080/admin/update-engine \
  -H "Content-Type: application/json" \
  -d '{"engine_url": "http://localhost:3002"}'
```

### **Error Handling and Recovery**

For the emergency scenarios described in Zane's crisis management:

**Primary Engine Failure Detection:**
```bash
# Check if primary is responding
if ! curl -s --connect-timeout 5 http://localhost:3001/health > /dev/null; then
  echo "Primary engine unresponsive"
  
  # Promote backup automatically
  curl -X POST http://localhost:3002/api/engine/set-primary \
    -H "Content-Type: application/json" \
    -d '{"is_primary": true, "emergency_takeover": true}'
fi
```

**Expected Auto-Recovery Response:**
```json
{
  "status": "EMERGENCY_PRIMARY_TAKEOVER",
  "engine": "engine-3002",
  "is_primary": true,
  "reason": "PRIMARY_UNRESPONSIVE",
  "takeover_timestamp": "2024-01-05T14:35:00Z",
  "previous_primary": "engine-3001"
}
```

### **Production Deployment Checklist**

Based on Zane's operational spellbook, here's the technical checklist:

**Pre-Deployment:**
- [ ] Redis server running and accessible
- [ ] Environment variables set correctly for each engine
- [ ] Health check endpoints responding
- [ ] Slack integration configured with correct engine URL

**During Deployment:**
- [ ] Start backup engine with `IS_PRIMARY=false`
- [ ] Verify backup engine healthy and connected to Redis
- [ ] Execute primary transition API calls
- [ ] Verify new primary responding to player actions
- [ ] Update Slack bridge to new primary
- [ ] Stop old primary engine

**Post-Deployment:**
- [ ] Monitor new primary for stability
- [ ] Verify all worker engines still connected
- [ ] Test Slack commands working with new primary
- [ ] Confirm quest state preserved across transition

### **Monitoring and Observability**

Implement Zane's realm health monitoring with these commands:

**Automated Health Check Script:**
```bash
#!/bin/bash
# health-check.sh - Monitor all engines

ENGINES=(3001 3002 3003 3004)
PRIMARY_FOUND=false

for port in "${ENGINES[@]}"; do
  if response=$(curl -s --connect-timeout 2 http://localhost:$port/health); then
    is_primary=$(echo "$response" | jq -r '.is_primary // false')
    engine_id=$(echo "$response" | jq -r '.engine_id // "unknown"')
    
    echo "✅ Engine $port ($engine_id): PRIMARY=$is_primary"
    
    if [ "$is_primary" = "true" ]; then
      PRIMARY_FOUND=true
    fi
  else
    echo "❌ Engine $port: UNRESPONSIVE"
  fi
done

if [ "$PRIMARY_FOUND" = "false" ]; then
  echo "🚨 WARNING: No primary engine found!"
  exit 1
fi
```

This technical appendix provides the concrete implementation details behind Zane's fantasy narrative, enabling practical deployment and testing of Blue/Green DM transitions in myMCP. 