# MyMCP Engine Testing Guide

## Overview

The MyMCP Engine has comprehensive test coverage for all data models, services, and functionality. This guide provides a complete reference for running and understanding the engine tests.

## Table of Contents

1. [Test Structure](#test-structure)
2. [Running Tests](#running-tests)
3. [Test Categories](#test-categories)
4. [CLI Reference](#cli-reference)
5. [Writing Tests](#writing-tests)
6. [Debugging Tests](#debugging-tests)
7. [Coverage Reports](#coverage-reports)

## Test Structure

```
packages/engine/
├── src/
│   ├── models/
│   │   └── __tests__/
│   │       ├── Player.test.ts
│   │       ├── Quest.test.ts
│   │       ├── Inventory.test.ts
│   │       ├── GameSession.test.ts
│   │       └── GameState.test.ts
│   └── services/
│       └── __tests__/
│           ├── RedisStateManager.test.ts
│           ├── RedisStateManager.integration.test.ts
│           ├── EventBroadcaster.test.ts
│           ├── LLMService.test.ts
│           ├── MultiplayerService.test.ts
│           └── UnifiedChatService.test.ts
├── test-runner.js
├── jest.config.js
├── jest.setup.js
└── tsconfig.test.json
```

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test type
npm run test:unit
npm run test:integration
```

### Using the Test Runner

The test runner provides advanced options:

```bash
# Run with test runner
node test-runner.js [test-type] [options]

# Examples
node test-runner.js unit --watch
node test-runner.js integration --coverage
node test-runner.js all --pattern=Player
```

## Test Categories

### 1. Model Tests

Tests for all data models and their validation logic:

- **Player.test.ts**: Player creation, validation, level progression, status transitions
- **Quest.test.ts**: Quest lifecycle, step management, status transitions
- **Inventory.test.ts**: Item management, capacity handling, inventory operations
- **GameSession.test.ts**: Session tracking, message history, duration calculations
- **GameState.test.ts**: State validation, transitions, serialization

### 2. Service Tests

#### Unit Tests
- **RedisStateManager.test.ts**: State CRUD operations, leaderboard, events
- **EventBroadcaster.test.ts**: Event publishing and subscription
- **LLMService.test.ts**: LLM provider integration, response handling
- **MultiplayerService.test.ts**: Player connections, real-time updates
- **UnifiedChatService.test.ts**: Chat message processing, command handling

#### Integration Tests
- **RedisStateManager.integration.test.ts**: Full Redis integration testing

## CLI Reference

### Test Runner Options

```bash
node test-runner.js [test-type] [options]
```

#### Test Types
- `unit` - Run unit tests only
- `integration` - Run integration tests only
- `all` - Run all tests (default)

#### Options
- `-w, --watch` - Watch mode, rerun on file changes
- `-c, --coverage` - Generate code coverage report
- `-v, --verbose` - Verbose output
- `--pattern=<pattern>` - Run only tests matching pattern
- `--bail` - Stop on first test failure
- `-u, --update-snapshots` - Update test snapshots
- `--debug` - Enable Node.js debugging
- `-h, --help` - Show help message

### NPM Scripts

```json
{
  "test": "node test-runner.js all",
  "test:unit": "node test-runner.js unit",
  "test:integration": "node test-runner.js integration",
  "test:watch": "node test-runner.js all --watch",
  "test:coverage": "node test-runner.js all --coverage",
  "test:debug": "node test-runner.js --debug"
}
```

### Environment Variables

```bash
# Redis configuration for integration tests
export REDIS_HOST=localhost
export REDIS_PORT=6379

# Test environment
export NODE_ENV=test

# Debug output
export DEBUG=myMCP:*
```

## Writing Tests

### Test Structure Example

```typescript
import { Player, PlayerLevel } from '@mymcp/types';

describe('Player Model Tests', () => {
  describe('Player Creation', () => {
    test('should create a valid player', () => {
      const player: Player = {
        id: 'test-id',
        name: 'Test Hero',
        score: 0,
        level: 'novice',
        status: 'idle',
        location: 'town'
      };

      expect(player).toMatchObject({
        name: 'Test Hero',
        score: 0,
        level: 'novice'
      });
    });
  });
});
```

### Custom Matchers

```typescript
// Available custom matchers
expect(gameState).toBeValidGameState();
expect(player).toHaveLevel('expert');
expect(quest).toBeCompleted();
```

### Test Helpers

```typescript
// Create test data
const player = createTestPlayer({ score: 100 });
const quest = createTestQuest({ status: 'active' });
const gameState = createTestGameState({ player });

// Validation helpers
expect(isValidPlayerName('Hero123')).toBe(true);
expect(canStartNewQuest(gameState)).toBe(true);
```

## Debugging Tests

### VS Code Debugging

1. Set breakpoints in test files
2. Run debug configuration:
   ```bash
   npm run test:debug
   ```
3. Or use VS Code's "Debug Engine Tests" launch configuration

### Console Debugging

```typescript
test('debug example', () => {
  const player = createTestPlayer();
  
  // Add debug output
  console.log('Player state:', player);
  
  // Use debugger statement
  debugger;
  
  expect(player.level).toBe('novice');
});
```

### Troubleshooting

Common issues and solutions:

1. **Redis Connection Failed**
   ```bash
   # Start Redis
   docker-compose up -d redis
   ```

2. **TypeScript Errors**
   ```bash
   # Rebuild types
   npm run build:types
   ```

3. **Module Resolution Issues**
   ```bash
   # Clean and reinstall
   npm run clean
   npm install
   ```

## Coverage Reports

### Viewing Coverage

After running tests with coverage:

```bash
# Generate coverage
npm run test:coverage

# View HTML report
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Current thresholds (configured in jest.config.js):
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

### Improving Coverage

1. Check uncovered lines in coverage report
2. Add tests for edge cases
3. Test error conditions
4. Cover all code branches

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

## Continuous Integration

Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Scheduled daily runs

CI configuration in `.github/workflows/test-engine.yml`

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing TypeScript](https://www.typescriptlang.org/docs/handbook/testing.html)
- [Redis Mock for Testing](https://github.com/yeahoffline/redis-mock) 