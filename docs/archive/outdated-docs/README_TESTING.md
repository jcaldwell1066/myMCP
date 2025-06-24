# MyMCP Engine Testing Framework

## Overview

The MyMCP Engine now has a comprehensive testing framework with 117 tests covering all data models, services, and functionality. This document provides a complete guide to the testing infrastructure.

## Test Statistics

- **Total Tests**: 117
- **Test Suites**: 8
- **Coverage**: All core models and services
- **Test Types**: Unit and Integration

## Quick Start

```bash
# Run all tests
cd packages/engine
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# Run specific test type
npm run test:unit
npm run test:integration
```

## Test Structure

```
packages/engine/
├── src/
│   ├── models/__tests__/
│   │   ├── Player.test.ts (24 tests)
│   │   ├── Quest.test.ts (13 tests)
│   │   ├── Inventory.test.ts (14 tests)
│   │   ├── GameSession.test.ts (19 tests)
│   │   └── GameState.test.ts (14 tests)
│   └── services/__tests__/
│       ├── RedisStateManager.test.ts (6 tests)
│       ├── RedisStateManager.integration.test.ts (9 tests)
│       └── EventBroadcaster.test.ts (18 tests)
├── test-runner.js
├── test-all-models.js
├── jest.config.js
├── jest.setup.js
└── tsconfig.test.json
```

## Data Model Tests

### Player Model (24 tests)
- Player creation and validation
- Level progression system (novice → apprentice → expert → master)
- Status transitions (idle, chatting, in-quest, completed-quest)
- Location validation and movement
- Name and score validation

### Quest Model (13 tests)
- Quest creation with steps and rewards
- Quest step management and progress tracking
- Status transitions (available → active → completed/failed)
- Quest validation and completion conditions
- Quest categorization by skill

### Inventory Model (14 tests)
- Inventory creation and status management
- Item addition/removal operations
- Capacity management and overflow handling
- Item type validation (quest/tool/treasure)
- Inventory queries and value calculation

### GameSession Model (19 tests)
- Session creation and duration tracking
- Activity monitoring and turn counting
- Conversation history management
- Message filtering and statistics
- Session serialization

### GameState Model (14 tests)
- Complete game state validation
- State transitions (quest start/complete)
- Progress tracking and calculations
- State serialization/deserialization
- Partial state merging

## Service Tests

### RedisStateManager (15 tests total)
- **Unit Tests (6)**: Mocked Redis operations
- **Integration Tests (9)**: Real Redis integration
- Player state CRUD operations
- Location tracking and movement
- Leaderboard management
- Event broadcasting
- Multiplayer coordination

### EventBroadcaster (18 tests)
- Chat message broadcasting
- Quest event broadcasting (started, completed, step completed)
- Player event broadcasting (level up, achievement, location, score)
- State update broadcasting
- Player activity tracking
- Error handling and connection management

## Test Infrastructure

### Test Runner (`test-runner.js`)
Advanced CLI with multiple options:
- Test type filtering (unit/integration/all)
- Watch mode for development
- Coverage reporting
- Debug support
- Pattern matching

### Test Commands

```bash
# Basic commands
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
npm run test:debug         # Debug mode

# Advanced usage
node test-runner.js --pattern=Player     # Test specific model
node test-runner.js --pattern=Quest      # Test quest functionality
node test-runner.js integration --pattern=Redis  # Redis integration tests
```

### Comprehensive Test Report

```bash
# Run detailed test report
node test-all-models.js

# Generates:
# - Test counts by category
# - Success/failure rates
# - Detailed JSON report
# - Performance metrics
```

## Test Helpers and Utilities

### Factory Functions
- `createTestPlayer()` - Create player with default values
- `createTestQuest()` - Create quest with steps
- `createTestInventory()` - Create inventory with items
- `createTestGameState()` - Create complete game state
- `createTestChatMessage()` - Create chat messages

### Validation Helpers
- `isValidPlayerName()` - Validate player names
- `isValidQuestTransition()` - Check quest state transitions
- `canCompleteQuest()` - Quest completion validation
- `calculateQuestProgress()` - Progress calculations
- `getSessionDuration()` - Session time tracking

## Coverage Targets

- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

## CI/CD Integration

Tests run automatically via GitHub Actions:
- On push to main/develop branches
- On pull requests
- With Redis service container
- Coverage reporting with Codecov

## Debugging Tests

### VS Code
1. Set breakpoints in test files
2. Use "Debug Engine Tests" launch configuration
3. Or run: `npm run test:debug`

### Command Line
```bash
# Debug all tests
node --inspect-brk node_modules/.bin/jest

# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand --testNamePattern="Player Creation"
```

## Best Practices

1. **Test Organization**
   - Group related tests with `describe` blocks
   - Use descriptive test names
   - One assertion per test when possible

2. **Test Data**
   - Use factory functions for test data
   - Avoid hardcoded values
   - Clean up after tests

3. **Async Testing**
   - Always await async operations
   - Use proper async test syntax
   - Handle promise rejections

4. **Performance**
   - Mock external dependencies
   - Use `beforeAll` for expensive setup
   - Run tests in parallel when possible

## Documentation

- **[TESTING_GUIDE.md](docs/TESTING_GUIDE.md)** - Complete testing documentation
- **[CLI_TESTING_REFERENCE.md](docs/CLI_TESTING_REFERENCE.md)** - CLI command reference
- **[TEST_COVERAGE_SUMMARY.md](docs/TEST_COVERAGE_SUMMARY.md)** - Coverage overview

## Summary

The MyMCP Engine testing framework provides:
- ✅ 100% model coverage
- ✅ Service layer testing
- ✅ Integration tests with Redis
- ✅ Advanced test runner
- ✅ Comprehensive documentation
- ✅ CI/CD ready
- ✅ Debug support
- ✅ Performance optimization

This ensures code quality and reliability as the engine evolves. 