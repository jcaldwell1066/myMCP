# 🧪 myMCP Testing Guide

> **Comprehensive testing documentation for developers and QA**

## 📋 **Testing Overview**

myMCP uses a multi-layered testing approach:
- **Unit Tests** - Individual component testing
- **Integration Tests** - API endpoint workflows  
- **System Tests** - Full system validation
- **Manual Testing** - Interactive CLI and UI testing

## 🚀 **Quick Start**

### Prerequisites
```bash
# Ensure engine is running
npm run start:engine

# Verify health
curl http://localhost:3000/health
```

### Run All Tests
```bash
# From project root
npm test

# Or run specific test suites
npm run test:unit           # Fast unit tests
npm run test:integration    # API integration tests  
npm run test:system        # Full system tests
```

---

## 🏗️ **Test Architecture**

### Test Organization
```
tests/
├── api/                    # API integration tests
│   ├── framework/         # Reusable test framework
│   ├── specs/            # Test specifications
│   ├── fixtures/         # Test data
│   └── runners/          # Execution scripts
├── unit/                  # Unit tests (in package directories)
└── system/               # End-to-end system tests
```

### Test Types

| Test Type | Purpose | Speed | Coverage |
|-----------|---------|-------|----------|
| **Unit** | Individual functions/components | Fast (ms) | High |
| **Integration** | API endpoints and workflows | Medium (seconds) | Medium |
| **System** | Full application workflows | Slow (minutes) | Complete |

---

## 🔧 **API Testing Framework**

### Features
- **Automatic retries** with exponential backoff
- **WebSocket testing** support
- **Test data isolation** - no cross-test pollution
- **Custom assertions** for game domain
- **Parallel execution** for performance

### Running API Tests
```bash
cd tests/api

# Run all API tests
npm test

# Run specific categories
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:smoke         # Quick smoke tests

# Advanced options
npm run test:verbose       # Detailed output
npm run test:continue      # Continue on failures
npm run test:report        # Generate HTML report
```

### Test Coverage
✅ **Endpoints Tested:**
- `GET /health` - Health check
- `GET /api/state/:playerId` - Player state retrieval
- `POST /api/actions/:playerId` - All game actions
- `GET /api/quests/:playerId` - Quest management
- WebSocket connections and messaging

✅ **Actions Tested:**
- `SET_SCORE` - Score updates and leveling
- `CHAT` - Message processing and responses
- `START_QUEST` - Quest initiation
- `COMPLETE_QUEST_STEP` - Step completion
- `COMPLETE_QUEST` - Full quest completion

---

## 🗄️ **Redis Testing & Management**

### Redis Reset Scripts
Essential for clean testing environments:

```bash
# Reset all Redis data (with confirmation)
node tools/testing/reset-redis.js

# Reset without confirmation (for CI/CD)
node tools/testing/reset-redis.js --force

# Keep leaderboard data
node tools/testing/reset-redis.js --keep-leaderboard

# Dry run - see what would be deleted
node tools/testing/reset-redis.js --dry-run
```

### Interactive Redis Management
```bash
# Run interactive menu
./tools/testing/quick-reset-redis.sh

# Menu options:
# 1. Reset all data (with confirmation)
# 2. Reset all data (force, no confirmation)  
# 3. Reset all except leaderboard
# 4. Dry run (show what would be deleted)
# 5. Reset specific player data
# 6. Clear all sessions only
```

### Key Patterns Managed
- `player:*` - Player profiles and data
- `session:*` - Active game sessions
- `quest:*` - Quest states and progress
- `inventory:*` - Player inventories
- `chat:*` - Chat history
- `leaderboard:*` - Score rankings

---

## 🎮 **Manual Testing Workflows**

### CLI Testing
```bash
# 1. Basic functionality
npm run dev:cli -- status
npm run dev:cli -- health
npm run dev:cli -- chat "hello"

# 2. Quest workflow
npm run dev:cli -- quests
npm run dev:cli -- start-quest "Council of Three Realms"
npm run dev:cli -- quest-steps
npm run dev:cli -- complete-step find-allies

# 3. Interactive mode
npm run dev:cli -- chat -i
```

### Web Interface Testing
```bash
# Start dashboard
cd packages/player-dashboard && npm run dev

# Manual test checklist:
# - [ ] Dashboard loads at http://localhost:5173
# - [ ] Player status displays correctly
# - [ ] Real-time updates work
# - [ ] Quest interface functional
# - [ ] No console errors
```

### Admin Dashboard Testing
```bash
# Start admin interface
cd packages/admin && npm start

# Test checklist:
# - [ ] System health shows all green
# - [ ] Player management works
# - [ ] Redis queries execute safely
# - [ ] Real-time metrics update
# - [ ] Export functions work
```

---

## 🔍 **Engine-Specific Testing**

### Health Checks
```bash
# Basic health
curl http://localhost:3000/health

# Extended health with details
curl http://localhost:3000/api/debug

# Test specific player
curl http://localhost:3000/api/state/test-player
```

### Game Action Testing
```bash
# Set player score
curl -X POST http://localhost:3000/api/actions/test-player \
  -H "Content-Type: application/json" \
  -d '{"type":"SET_SCORE","payload":{"score":150}}'

# Start quest
curl -X POST http://localhost:3000/api/actions/test-player \
  -H "Content-Type: application/json" \
  -d '{"type":"START_QUEST","payload":{"questId":"council-of-three-realms"}}'

# Send chat message
curl -X POST http://localhost:3000/api/actions/test-player \
  -H "Content-Type: application/json" \
  -d '{"type":"CHAT","payload":{"message":"What should I do next?"}}'
```

---

## 🤝 **Multiplayer Testing**

### Multi-Engine Setup
```bash
# Terminal 1: Primary engine
PORT=3001 IS_PRIMARY=true npm run start:engine

# Terminal 2: Worker engine
PORT=3002 npm run start:engine

# Terminal 3: Another worker
PORT=3003 npm run start:engine

# Test coordination
curl http://localhost:3001/api/health/cluster
```

### Slack Integration Testing
```bash
# Start Slack integration
cd packages/slack-integration && npm start

# Test in Slack:
# /mymcp status
# /mymcp leaderboard
# /mymcp quest list
```

---

## 📊 **Performance Testing**

### Load Testing Scripts
```bash
# Basic load test
node tools/testing/load-test.js --players 10 --duration 60

# Stress test specific endpoint
node tools/testing/stress-test.js --endpoint /api/state --requests 1000

# Memory leak detection
node --inspect tools/testing/memory-test.js
```

### Metrics to Monitor
- **Response times** - Should be <200ms for most endpoints
- **Memory usage** - Should not grow continuously
- **Redis connections** - Should be stable
- **WebSocket connections** - Should handle reconnection

---

## 🚨 **Troubleshooting Tests**

### Common Issues

**"Connection refused"**
```bash
# Check if engine is running
curl http://localhost:3000/health
# Start if needed: npm run start:engine
```

**"Redis connection failed"**
```bash
# Check Redis URL in .env
grep REDIS_URL .env
# Test Redis connection
redis-cli -u "$REDIS_URL" ping
```

**"Test timeouts"**
```bash
# Increase timeout in test config
export TEST_TIMEOUT=30000
npm test
```

**"WebSocket failures"**
```bash
# Check WebSocket is enabled
curl -H "Upgrade: websocket" http://localhost:3000/
```

### Debug Mode
```bash
# Enable verbose logging
DEBUG=* npm test

# API test debugging
cd tests/api && npm run test:verbose

# Engine debugging
DEBUG=engine:* npm run start:engine
```

---

## 📋 **Testing Checklists**

### Pre-Release Testing
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Manual CLI testing complete
- [ ] Web interface functional
- [ ] Admin dashboard working
- [ ] Multiplayer coordination tested
- [ ] Redis data integrity verified
- [ ] Performance benchmarks met

### CI/CD Pipeline
```yaml
# Example GitHub Actions
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run build
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:system
```

### Developer Testing
```bash
# Daily developer workflow
npm run dev:test-cycle
# Runs: build → unit tests → start engine → integration tests → cleanup
```

---

## 📚 **References**

- **Engine Testing**: See `packages/engine/docs/TESTING_GUIDE.md`
- **API Testing**: See `tests/api/README.md` for detailed framework docs
- **Redis Management**: See `tools/testing/REDIS_RESET_GUIDE.md`
- **Performance**: See `docs/performance/BENCHMARKS.md`

---

**Ready to test like a pro?** Start with `npm test` and ensure your changes don't break the realm! ⚔️✨ 