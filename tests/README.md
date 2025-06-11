# Test Scripts

This directory contains API and integration tests for the myMCP system.

## 🧪 API Tests (`/api/`)

Test scripts for the myMCP Engine API:

- **test-api.js** - Complete API endpoint testing
- **test-websocket.js** - WebSocket connection testing  
- **debug-test.js** - Debug and troubleshooting tests
- **full-test.js** - Comprehensive system testing

## 🚀 Running Tests

### Prerequisites
```bash
# Ensure the engine is running
npm run dev:engine
```

### Execute Tests
```bash
cd tests/api

# Run all API tests
node test-api.js

# Test WebSocket functionality
node test-websocket.js

# Debug connection issues
node debug-test.js

# Full system test
node full-test.js
```

## 📋 Test Coverage

### API Endpoints Tested
- ✅ Health check (`/health`)
- ✅ Game state management (`/api/state/:playerId`)
- ✅ Game actions (`/api/actions/:playerId`)
- ✅ Quest system (`/api/quests/:playerId`)
- ✅ Tab completion context (`/api/context/completions/:playerId`)

### Real-time Features
- ✅ WebSocket connection establishment
- ✅ State update broadcasting
- ✅ Message handling and responses

## 🔧 Troubleshooting

### Common Issues
- **Connection refused**: Engine not running on port 3000
- **Timeout errors**: Check engine health at `http://localhost:3000/health`
- **WebSocket failures**: Verify WebSocket server is enabled in engine

### Debug Commands
```bash
# Check engine health
curl http://localhost:3000/health

# Verify API availability
curl http://localhost:3000/api/debug
```

## 📈 Adding New Tests

1. Create test file in appropriate subdirectory
2. Follow existing test patterns and structure
3. Include proper error handling and cleanup
4. Update this README with new test descriptions
