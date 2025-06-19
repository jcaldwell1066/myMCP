# myMCP Engine Test Automation Suite

A comprehensive, modular test automation framework for the myMCP Engine API, designed for flexibility, maintainability, and easy expansion.

## 🏗️ Architecture Overview

```
tests/api/
├── framework/          # Reusable test framework
│   ├── api-client.js   # HTTP/WebSocket client with retry logic
│   ├── test-runner.js  # Core test execution engine
│   ├── test-data.js    # Test data management and cleanup
│   └── assertions.js   # Custom domain-specific assertions
│
├── specs/             # Test specifications
│   ├── unit/          # Unit tests for individual endpoints
│   └── integration/   # Integration tests for workflows
│
├── fixtures/          # Test data and scenarios
├── config/           # Environment and test configurations
├── runners/          # Test execution scripts
└── results/          # Test results and reports
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 16.0.0
- myMCP Engine running on localhost:3000

### Installation
```bash
cd tests/api
npm install
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:smoke         # Quick smoke tests

# Advanced options
npm run test:verbose       # Detailed output
npm run test:continue      # Continue on failures
npm run test:report        # Generate HTML report
npm run test:export        # Export JSON results
```

## 📊 Test Categories

### Unit Tests
Fast, isolated tests for individual API endpoints:
- **Health Endpoint** - `/health` functionality
- **State Management** - Player state CRUD operations
- **Game Actions** - All POST `/api/actions` types
- **Quest System** - Quest retrieval and management
- **Completions** - Tab completion suggestions

### Integration Tests
Multi-endpoint workflows and business logic:
- **Player Journey** - Complete new player onboarding
- **Quest Workflow** - Start to completion scenarios
- **Chat Flow** - Conversation and context management
- **WebSocket** - Real-time communication testing

### Smoke Tests
Critical path validation (runs in ~10 seconds):
- Engine health check
- Basic state creation
- Core action execution
- Quest data retrieval
- WebSocket connectivity

## 🔧 Framework Features

### Robust API Client
- **Automatic retries** with exponential backoff
- **Comprehensive error handling** 
- **WebSocket testing** support
- **Configurable timeouts** per environment
- **Request/response logging** in verbose mode

### Smart Test Data Management
- **Isolated test environments** - no cross-test pollution
- **Automatic cleanup** between tests
- **Fixture-based data** for consistent scenarios
- **Player state backup/restore** capabilities

### Custom Assertions
Domain-specific assertions for game concepts:
```javascript
expect(response).toHaveStatus(200);
expect(gameState).toBeValidGameState();
expect(player).toBeValidPlayer();
expect(quest).toHaveQuestStatus('active');
expect(player).toHavePlayerLevel('expert');
```

### Flexible Test Execution
- **Parallel execution** for unit tests
- **Sequential execution** for integration tests
- **Stop on failure** for critical tests
- **Environment configuration** (dev/staging/prod)
- **Multiple output formats** (console/JSON/HTML)

## 📈 Reporting and Results

### Console Output
- ✅ Real-time test status
- 📊 Summary statistics
- ⏱️ Performance timings
- 💡 Actionable recommendations

### Export Formats
- **JSON** - Machine-readable results for CI/CD
- **HTML** - Rich visual reports with metrics
- **Console** - Developer-friendly real-time feedback

### Example Output
```
🎯 myMCP Engine - Complete Test Suite
======================================

📋 Phase 1: Unit Tests
──────────────────────────────────────
✅ Health Endpoint > should return 200 status code (45ms)
✅ Health Endpoint > should return valid health information (32ms)
✅ State Endpoints > should create default state for new player (67ms)

📋 Phase 2: Integration Tests  
──────────────────────────────────────
✅ Player Journey > should complete full onboarding flow (234ms)
✅ Quest Workflow > should handle start to completion (189ms)

🏆 Complete Test Suite Summary
==================================================
📋 Unit Tests: 15/15 passed (100%)
🔗 Integration Tests: 8/8 passed (100%)
──────────────────────────────────────
📊 Total Tests: 23
✅ Passed: 23
❌ Failed: 0
📈 Overall Pass Rate: 100%
⏱️ Total Duration: 12s

🎉 ALL TESTS PASSED!
```

## 🛠️ Configuration

### Environment Settings
```javascript
// config/test-config.js
const environments = {
  development: {
    baseUrl: 'http://localhost:3000',
    timeout: 10000,
    retries: 3,
    verbose: true
  },
  staging: {
    baseUrl: 'http://staging.mymcp.com',
    timeout: 15000,
    retries: 5,
    verbose: false
  }
};
```

### Test Categories
```javascript
const testCategories = {
  unit: {
    timeout: 5000,
    parallel: true,
    stopOnFailure: false
  },
  integration: {
    timeout: 15000,
    parallel: false,
    stopOnFailure: false
  }
};
```

## 📝 Writing Tests

### Basic Test Structure
```javascript
module.exports = function(runner) {
  runner.describe('My Test Suite', () => {
    
    runner.beforeEach(async function() {
      // Setup before each test
      this.testPlayer = this.data.createPlayer();
    });

    runner.it('should do something', async function() {
      const response = await this.client.get('/api/endpoint');
      this.expect(response).toHaveStatus(200);
    });

  });
};
```

### Using Test Data
```javascript
// Create test players
const player = this.data.createPlayer('test-player-1', {
  score: 100,
  level: 'apprentice'
});

// Create test quests
const quest = this.data.createQuest('test-quest-1', {
  title: 'My Test Quest',
  steps: [{ id: 'step-1', description: 'Test step' }]
});

// Access test scenarios
const scenarios = this.data.getTestScenarios();
```

### API Client Usage
```javascript
// HTTP requests with automatic retry
const response = await this.client.get('/api/state/player-1');
const postResponse = await this.client.post('/api/actions/player-1', data);

// WebSocket testing
const wsResult = await this.client.testWebSocket();

// Health checks
const health = await this.client.healthCheck();
const isReady = await this.client.waitForService(30, 1000);
```

## 🔄 Continuous Integration

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
- name: Run API Tests
  run: |
    cd tests/api
    npm install
    npm run test:smoke    # Quick validation
    npm run test         # Full suite
    npm run test:export  # Export results
```

### Test Results
- Exit code 0 = all tests passed
- Exit code 1 = some tests failed
- JSON results exported for analysis
- HTML reports for stakeholder review

## 🔍 Debugging and Development

### Verbose Mode
```bash
npm run test:verbose
```
Shows detailed request/response logs, timing information, and internal framework operations.

### Individual Test Execution
```bash
node runners/run-unit.js --verbose --stop-on-failure
```

### Test Data Inspection
```bash
# View current game states
cat ../../packages/engine/data/game-states.json

# Clean test data
npm run clean
```

## 📋 Test Coverage

### Endpoint Coverage
- ✅ `GET /health` - Health check
- ✅ `GET /api/state/:playerId` - Player state retrieval
- ✅ `PUT /api/state/:playerId/player` - Player updates
- ✅ `POST /api/actions/:playerId` - All game actions
- ✅ `GET /api/quests/:playerId` - Quest management
- ✅ `GET /api/context/completions/:playerId` - Tab completions
- ✅ WebSocket connections and messaging

### Action Coverage
- ✅ `SET_SCORE` - Score updates and leveling
- ✅ `CHAT` - Message processing and responses
- ✅ `START_QUEST` - Quest initiation
- ✅ `COMPLETE_QUEST_STEP` - Step completion
- ✅ `COMPLETE_QUEST` - Full quest completion

### Scenario Coverage
- ✅ New player onboarding flow
- ✅ Score progression and leveling
- ✅ Complete quest workflows
- ✅ Conversation history management
- ✅ Error handling and recovery
- ✅ State persistence and consistency

## 🔮 Future Enhancements

### Planned Features
- **Performance testing** with load scenarios
- **Contract testing** with API schema validation
- **End-to-end testing** with CLI integration
- **Mock data generation** for complex scenarios
- **Parallel test execution** optimization
- **Visual regression testing** for UI components

### Extensibility
The framework is designed for easy extension:
- Add new test categories in `specs/`
- Create custom assertions in `framework/assertions.js`
- Define new test data in `fixtures/`
- Configure environments in `config/`

---

**Ready to test your API like a pro? Run `npm test` and let the automation magic begin! 🎭✨**
