#!/usr/bin/env node

/**
 * Trunk-Based Development Helper Script
 * Automates common trunk-based development workflows
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const commands = {
  branch: {
    description: 'Create new feature branch from latest main',
    action: async () => {
      const branchName = process.argv[3];
      if (!branchName) {
        console.error('❌ Please provide a branch name');
        console.log('Usage: node tools/trunk-dev.js branch feature/player-dashboard-fixes');
        process.exit(1);
      }
      
      console.log('🌱 Creating new feature branch...');
      
      // Ensure we're on main and up to date
      console.log('📥 Switching to main and pulling latest...');
      execSync('git checkout main', { stdio: 'inherit' });
      execSync('git pull origin main', { stdio: 'inherit' });
      
      // Create and switch to new branch
      console.log(`🚀 Creating branch: ${branchName}`);
      execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
      
      // Quick setup
      console.log('📦 Installing dependencies and building...');
      execSync('npm install', { stdio: 'inherit' });
      execSync('npm run build', { stdio: 'inherit' });
      
      console.log(`✅ Feature branch '${branchName}' created and ready for development!`);
      console.log('\n📋 Next steps:');
      console.log('1. Make your changes');
      console.log('2. Test thoroughly: npm test');
      console.log(`3. Push: git push origin ${branchName}`);
      console.log('4. Create PR via GitHub UI');
    }
  },
  
  sync: {
    description: 'Morning sync - pull latest, install deps, build, test',
    action: async () => {
      console.log('🌅 Starting morning sync...');
      
      // Pull latest changes
      console.log('📥 Pulling latest changes...');
      execSync('git pull origin main', { stdio: 'inherit' });
      
      // Install dependencies
      console.log('📦 Installing dependencies...');
      execSync('npm install', { stdio: 'inherit' });
      
      // Build everything
      console.log('🔨 Building packages...');
      execSync('npm run build', { stdio: 'inherit' });
      
      // Run smoke tests
      console.log('🧪 Running smoke tests...');
      execSync('npm test', { stdio: 'inherit' });
      
      console.log('✅ Morning sync complete! Ready to code.');
    }
  },
  
  commit: {
    description: 'Smart commit - test, add, commit with conventional message',
    action: async () => {
      const message = process.argv[3];
      if (!message) {
        console.error('❌ Please provide a commit message');
        console.log('Usage: node tools/trunk-dev.js commit "feat: add new feature"');
        process.exit(1);
      }
      
      console.log('🧪 Running pre-commit tests...');
      
      try {
        // Run lint
        console.log('🔍 Linting code...');
        execSync('npm run lint', { stdio: 'inherit' });
        
        // Run unit tests
        console.log('⚡ Running unit tests...');
        execSync('npm run test:unit', { stdio: 'inherit' });
        
        // Add changes
        console.log('📝 Adding changes...');
        execSync('git add .', { stdio: 'inherit' });
        
        // Commit
        console.log(`📤 Committing: "${message}"`);
        execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
        
        // Push
        console.log('🚀 Pushing to main...');
        execSync('git push origin main', { stdio: 'inherit' });
        
        console.log('✅ Successfully committed and pushed!');
        
      } catch (error) {
        console.error('❌ Pre-commit checks failed. Please fix issues before committing.');
        process.exit(1);
      }
    }
  },
  
  feature: {
    description: 'Add feature toggle for new functionality',
    action: async () => {
      const featureName = process.argv[3];
      if (!featureName) {
        console.error('❌ Please provide a feature name');
        console.log('Usage: node tools/trunk-dev.js feature NEW_DASHBOARD');
        process.exit(1);
      }
      
      const envFile = '.env';
      const flagName = `FEATURE_${featureName.toUpperCase()}`;
      
      // Add to .env if it exists
      if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf8');
        if (!envContent.includes(flagName)) {
          fs.appendFileSync(envFile, `\n# Feature flag for ${featureName}\n${flagName}=false\n`);
          console.log(`✅ Added feature flag ${flagName} to .env`);
        } else {
          console.log(`⚠️  Feature flag ${flagName} already exists in .env`);
        }
      }
      
      // Create sample usage
      const sampleCode = `
// Usage example for ${featureName}
const ENABLE_${featureName.toUpperCase()} = process.env.${flagName} === 'true';

if (ENABLE_${featureName.toUpperCase()}) {
  // New feature implementation
  console.log('${featureName} feature is enabled');
} else {
  // Legacy implementation
  console.log('${featureName} feature is disabled');
}
`;
      
      console.log('📋 Sample code for feature toggle:');
      console.log(sampleCode);
    }
  },
  
  rollback: {
    description: 'Emergency rollback to previous commit',
    action: async () => {
      console.log('🚨 Emergency rollback initiated...');
      
      // Show recent commits
      console.log('📋 Recent commits:');
      execSync('git log --oneline -5', { stdio: 'inherit' });
      
      console.log('\n⚠️  This will revert the last commit. Continue? (y/N)');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('', (answer) => {
        if (answer.toLowerCase() === 'y') {
          console.log('🔄 Reverting last commit...');
          execSync('git revert HEAD --no-edit', { stdio: 'inherit' });
          execSync('git push origin main', { stdio: 'inherit' });
          console.log('✅ Rollback complete!');
        } else {
          console.log('❌ Rollback cancelled.');
        }
        readline.close();
      });
    }
  },
  
  status: {
    description: 'Check trunk development status',
    action: async () => {
      console.log('📊 Trunk Development Status\n');
      
      // Git status
      console.log('🔄 Git Status:');
      execSync('git status --short', { stdio: 'inherit' });
      
      // Check if on main branch
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      if (currentBranch === 'main') {
        console.log('✅ On main branch');
      } else {
        console.log(`⚠️  On branch: ${currentBranch} (should be main)`);
      }
      
      // Check for uncommitted changes
      const hasChanges = execSync('git diff --quiet; echo $?', { encoding: 'utf8' }).trim();
      if (hasChanges === '0') {
        console.log('✅ No uncommitted changes');
      } else {
        console.log('⚠️  Uncommitted changes detected');
      }
      
      // Last few commits
      console.log('\n📝 Recent commits:');
      execSync('git log --oneline -3', { stdio: 'inherit' });
      
      // Check CI status (if GitHub CLI is available)
      try {
        console.log('\n🤖 CI Status:');
        execSync('gh run list --limit 3', { stdio: 'inherit' });
      } catch (error) {
        console.log('\n⚠️  GitHub CLI not available for CI status');
      }
    }
  }
};

function showHelp() {
  console.log('🚀 Development Workflow Helper\n');
  console.log('Available commands:');
  Object.entries(commands).forEach(([cmd, info]) => {
    console.log(`  ${cmd.padEnd(10)} - ${info.description}`);
  });
  console.log('\nExamples:');
  console.log('  npm run dev:branch feature/dashboard-fixes    # Create feature branch');
  console.log('  npm run dev:sync                             # Morning sync');
  console.log('  npm run dev:commit "feat: add improvements"  # Direct commit to main');
  console.log('  npm run dev:feature NEW_QUEST_SYSTEM         # Add feature toggle');
  console.log('  npm run dev:status                           # Check status');
  console.log('  npm run dev:rollback                         # Emergency rollback');
}

async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help' || command === '--help') {
    showHelp();
    return;
  }
  
  if (commands[command]) {
    try {
      await commands[command].action();
    } catch (error) {
      console.error(`❌ Command failed: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.error(`❌ Unknown command: ${command}`);
    showHelp();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { commands }; 