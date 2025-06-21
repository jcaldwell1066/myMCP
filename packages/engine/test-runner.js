#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  watch: args.includes('--watch') || args.includes('-w'),
  coverage: args.includes('--coverage') || args.includes('-c'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  pattern: args.find(arg => arg.startsWith('--pattern='))?.split('=')[1],
  testType: args.find(arg => ['unit', 'integration', 'all'].includes(arg)) || 'all',
  bail: args.includes('--bail'),
  updateSnapshots: args.includes('--update-snapshots') || args.includes('-u'),
  debug: args.includes('--debug'),
  help: args.includes('--help') || args.includes('-h')
};

// Display help
if (options.help) {
  console.log(`
${colors.bright}MyMCP Engine Test Runner${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node test-runner.js [test-type] [options]

${colors.cyan}Test Types:${colors.reset}
  unit          Run unit tests only
  integration   Run integration tests only  
  all           Run all tests (default)

${colors.cyan}Options:${colors.reset}
  -w, --watch              Watch mode - rerun tests on file changes
  -c, --coverage           Generate code coverage report
  -v, --verbose            Verbose output
  --pattern=<pattern>      Run only tests matching pattern
  --bail                   Stop on first test failure
  -u, --update-snapshots   Update test snapshots
  --debug                  Enable Node.js debugging
  -h, --help              Show this help message

${colors.cyan}Examples:${colors.reset}
  ${colors.dim}# Run all tests with coverage${colors.reset}
  node test-runner.js all --coverage

  ${colors.dim}# Run unit tests in watch mode${colors.reset}
  node test-runner.js unit --watch

  ${colors.dim}# Run tests matching pattern${colors.reset}
  node test-runner.js --pattern=Player

  ${colors.dim}# Debug tests${colors.reset}
  node test-runner.js --debug
`);
  process.exit(0);
}

// Build Jest arguments
const jestArgs = ['--config', 'jest.config.js'];

// Add test type specific paths
if (options.testType === 'unit') {
  jestArgs.push('--testPathPattern=__tests__/[^/]+\\.test\\.ts$');
} else if (options.testType === 'integration') {
  jestArgs.push('--testPathPattern=__tests__/.*\\.integration\\.test\\.ts$');
}

// Add options
if (options.watch) jestArgs.push('--watch');
if (options.coverage) jestArgs.push('--coverage');
if (options.verbose) jestArgs.push('--verbose');
if (options.pattern) jestArgs.push('--testNamePattern', options.pattern);
if (options.bail) jestArgs.push('--bail');
if (options.updateSnapshots) jestArgs.push('--updateSnapshot');
if (!options.watch) jestArgs.push('--runInBand'); // Run tests sequentially when not in watch mode

// Node options for debugging
const nodeArgs = [];
if (options.debug) {
  nodeArgs.push('--inspect-brk');
}

// Display test configuration
console.log(`${colors.bright}${colors.blue}🧪 MyMCP Engine Test Runner${colors.reset}\n`);
console.log(`${colors.cyan}Configuration:${colors.reset}`);
console.log(`  Test Type: ${colors.yellow}${options.testType}${colors.reset}`);
console.log(`  Watch Mode: ${options.watch ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
console.log(`  Coverage: ${options.coverage ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
console.log(`  Verbose: ${options.verbose ? colors.green + '✓' : colors.red + '✗'}${colors.reset}`);
if (options.pattern) {
  console.log(`  Pattern: ${colors.yellow}${options.pattern}${colors.reset}`);
}
console.log('');

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// Check if Redis is available for integration tests
if (options.testType === 'integration' || options.testType === 'all') {
  const redis = require('ioredis');
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  console.log(`  Redis URL: ${colors.dim}${redisUrl.replace(/:[^:@]+@/, ':****@')}${colors.reset}\n`);
  
  const client = new redis(redisUrl, {
    retryStrategy: () => null
  });

  client.ping((err) => {
    if (err) {
      console.log(`${colors.yellow}⚠️  Warning: Redis is not available${colors.reset}`);
      console.log(`   Integration tests will be skipped\n`);
    } else {
      console.log(`${colors.green}✓ Redis connection verified${colors.reset}\n`);
    }
    client.disconnect();
    runTests();
  });
} else {
  runTests();
}

function runTests() {
  // Run Jest
  const jest = spawn('npx', ['jest', ...jestArgs], {
    stdio: 'inherit',
    cwd: __dirname,
    env: { ...process.env, NODE_OPTIONS: nodeArgs.join(' ') }
  });

  jest.on('close', (code) => {
    if (code === 0) {
      console.log(`\n${colors.green}✓ All tests passed!${colors.reset}`);
      
      // Display coverage summary if enabled
      if (options.coverage) {
        const coveragePath = path.join(__dirname, 'coverage', 'lcov-report', 'index.html');
        if (fs.existsSync(coveragePath)) {
          console.log(`\n${colors.cyan}Coverage report generated:${colors.reset}`);
          console.log(`  file://${coveragePath}`);
        }
      }
    } else {
      console.log(`\n${colors.red}✗ Tests failed with code ${code}${colors.reset}`);
    }
    
    process.exit(code);
  });

  // Handle interruption
  process.on('SIGINT', () => {
    jest.kill('SIGINT');
  });
} 