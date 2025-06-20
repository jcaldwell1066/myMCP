# MyMCP Engine Testing CLI Reference

## Quick Start Commands

```bash
# Navigate to engine directory
cd packages/engine

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test type
npm run test:unit
npm run test:integration

# Watch mode for development
npm run test:watch
```

## Complete CLI Reference

### Test Runner Commands

#### Basic Usage
```bash
node test-runner.js [test-type] [options]
```

#### Test Types
- `unit` - Unit tests only (mocked dependencies)
- `integration` - Integration tests (requires Redis)
- `all` - All tests (default)

#### Options
| Option | Short | Description |
|--------|-------|-------------|
| `--watch` | `-w` | Watch mode - rerun on changes |
| `--coverage` | `-c` | Generate coverage report |
| `--verbose` | `-v` | Verbose output |
| `--pattern=<pattern>` | | Run tests matching pattern |
| `--bail` | | Stop on first failure |
| `--update-snapshots` | `-u` | Update test snapshots |
| `--debug` | | Enable Node.js debugging |
| `--help` | `-h` | Show help |

### NPM Scripts

```bash
# Core test commands
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
npm run test:debug         # Debug mode
npm run test:pattern       # Pattern matching
npm run test:ci           # CI environment

# Additional test commands
npm run test:models        # Test all data models
npm run test:services      # Test all services
npm run test:redis         # Redis-specific tests
```

### Examples

#### Development Workflow
```bash
# Start watch mode for TDD
npm run test:watch

# Run specific test file in watch mode
npx jest src/models/__tests__/Player.test.ts --watch

# Debug a specific test
node --inspect-brk node_modules/.bin/jest src/services/__tests__/RedisStateManager.test.ts
```

#### Testing Specific Components
```bash
# Test Player model
node test-runner.js --pattern=Player

# Test all Quest-related functionality
node test-runner.js --pattern=Quest

# Test Redis integration
node test-runner.js integration --pattern=Redis
```

#### CI/CD Commands
```bash
# Full test suite with coverage for CI
npm run test:ci

# Generate coverage report
npm run test:coverage
open coverage/lcov-report/index.html

# Run tests with specific Node version
nvm use 18 && npm test
```

### Environment Variables

```bash
# Redis configuration
export REDIS_HOST=localhost
export REDIS_PORT=6379

# Test environment
export NODE_ENV=test

# Debug output
export DEBUG=myMCP:*

# Jest options
export JEST_MAX_WORKERS=4
export JEST_TIMEOUT=10000
```

### Docker Testing

```bash
# Run tests in Docker
docker-compose run --rm engine npm test

# With specific test type
docker-compose run --rm engine npm run test:unit

# Interactive debugging in Docker
docker-compose run --rm -p 9229:9229 engine npm run test:debug
```

### Test Data Model Coverage

#### Player Model Tests
```bash
# All player tests
node test-runner.js --pattern="Player Model"

# Specific player features
node test-runner.js --pattern="Player Creation"
node test-runner.js --pattern="Player Level"
node test-runner.js --pattern="Player Status"
```

#### Quest Model Tests
```bash
# Quest lifecycle
node test-runner.js --pattern="Quest Creation"
node test-runner.js --pattern="Quest Status"
node test-runner.js --pattern="Quest Steps"
```

#### Inventory Model Tests
```bash
# Inventory management
node test-runner.js --pattern="Inventory"
node test-runner.js --pattern="Item"
```

#### GameState Model Tests
```bash
# Complete game state
node test-runner.js --pattern="GameState"
node test-runner.js --pattern="State Transitions"
```

### Service Layer Testing

#### RedisStateManager
```bash
# Unit tests (mocked)
node test-runner.js unit --pattern=RedisStateManager

# Integration tests (real Redis)
node test-runner.js integration --pattern=RedisStateManager

# Specific features
node test-runner.js --pattern="player state"
node test-runner.js --pattern="leaderboard"
```

#### EventBroadcaster
```bash
node test-runner.js --pattern=EventBroadcaster
node test-runner.js --pattern="Publishing Events"
node test-runner.js --pattern="Subscribing"
```

#### MultiplayerService
```bash
node test-runner.js --pattern=MultiplayerService
node test-runner.js --pattern="player connections"
```

### Debugging Tests

#### VS Code
1. Set breakpoints in test files
2. Use "Debug Engine Tests" launch configuration
3. Or run: `npm run test:debug`

#### Command Line
```bash
# Debug all tests
node --inspect-brk node_modules/.bin/jest

# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand --testNamePattern="Player Creation"

# With Chrome DevTools
# 1. Run debug command
# 2. Open chrome://inspect
# 3. Click "inspect" on the Node process
```

### Performance Testing

```bash
# Run with performance metrics
npm test -- --logHeapUsage

# Profile test execution
node --prof node_modules/.bin/jest
node --prof-process isolate-*.log > profile.txt

# Memory leak detection
npm test -- --detectLeaks
```

### Continuous Integration

```bash
# GitHub Actions (automatic on push)
# See .github/workflows/test-engine.yml

# Local CI simulation
npm run test:ci

# With Docker
docker-compose -f docker-compose.ci.yml up --abort-on-container-exit
```

### Troubleshooting

#### Redis Connection Issues
```bash
# Check Redis
redis-cli ping

# Start Redis in Docker
docker run -d -p 6379:6379 redis:alpine

# Test with custom Redis URL
REDIS_HOST=192.168.1.100 npm test
```

#### TypeScript Issues
```bash
# Rebuild types
npm run build:types

# Clear cache
npm run clean
rm -rf node_modules/.cache

# Reinstall
npm ci
```

#### Test Timeouts
```bash
# Increase timeout
npm test -- --testTimeout=20000

# Or in test file
jest.setTimeout(20000);
```

### Advanced Usage

#### Custom Test Reporter
```bash
# Use different reporter
npm test -- --reporters=default --reporters=jest-junit

# JSON output
npm test -- --json --outputFile=test-results.json
```

#### Test Filtering
```bash
# Skip integration tests
npm test -- --testPathIgnorePatterns=integration

# Run only changed files
npm test -- -o

# Run tests related to changed files
npm test -- --findRelatedTests src/models/Player.ts
```

#### Parallel Execution
```bash
# Max workers
npm test -- --maxWorkers=4

# Or percentage of CPUs
npm test -- --maxWorkers=50%

# Sequential (for debugging)
npm test -- --runInBand
```

## Summary Report Generation

```bash
# Run comprehensive test report
node test-all-models.js

# Output includes:
# - Test counts by category
# - Success/failure rates
# - Detailed JSON report
# - Performance metrics
```

## Best Practices

1. **Always run tests before committing**
   ```bash
   npm test && git commit
   ```

2. **Use watch mode during development**
   ```bash
   npm run test:watch
   ```

3. **Check coverage regularly**
   ```bash
   npm run test:coverage
   ```

4. **Run integration tests with real services**
   ```bash
   docker-compose up -d
   npm run test:integration
   ```

5. **Debug failing tests immediately**
   ```bash
   npm run test:debug
   ``` 