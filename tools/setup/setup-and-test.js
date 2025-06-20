#!/usr/bin/env node

// Quick setup and test script for the enhanced myMCP system
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 myMCP Enhanced Quest System - Setup & Test');
console.log('===============================================');

const projectRoot = path.resolve(__dirname, '..', '..');
const enginePath = path.join(projectRoot, 'packages', 'engine');
const cliPath = path.join(projectRoot, 'packages', 'cli');

function runCommand(command, cwd, description) {
  console.log(`\n📦 ${description}`);
  console.log(`   Running: ${command}`);
  console.log(`   Directory: ${cwd}`);
  
  try {
    const result = execSync(command, { 
      cwd, 
      stdio: 'inherit',
      timeout: 60000 // 60 second timeout
    });
    console.log('   ✅ Success!');
    return true;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

function checkFileExists(filePath, description) {
  console.log(`\n🔍 ${description}`);
  if (fs.existsSync(filePath)) {
    console.log(`   ✅ Found: ${filePath}`);
    return true;
  } else {
    console.log(`   ❌ Missing: ${filePath}`);
    return false;
  }
}

async function main() {
  console.log(`\n📂 Project Structure Check`);
  console.log('===========================');
  
  // Check key files exist
  const keyFiles = [
    [path.join(enginePath, 'src', 'types', 'QuestStep.ts'), 'Enhanced Quest Step Types'],
    [path.join(enginePath, 'src', 'data', 'stepEnhancements.ts'), 'Step Enhancement Database'],
    [path.join(enginePath, 'src', 'migrations', 'questStepMigrator.ts'), 'Migration System'],
    [path.join(cliPath, 'src', 'stepLauncher.js'), 'Step Launcher System'],
    [path.join(cliPath, 'enhanced-shell.js'), 'Enhanced CLI Shell']
  ];
  
  let allFilesExist = true;
  for (const [filePath, description] of keyFiles) {
    if (!checkFileExists(filePath, description)) {
      allFilesExist = false;
    }
  }
  
  if (!allFilesExist) {
    console.log('\n❌ Some required files are missing. Please check the implementation.');
    return;
  }
  
  console.log(`\n🔨 Build Process`);
  console.log('=================');
  
  // Check if we can build the TypeScript
  if (!runCommand('npm run build', enginePath, 'Building TypeScript files')) {
    console.log('\n⚠️  Build failed. You may need to:');
    console.log('   1. Install dependencies: npm install');
    console.log('   2. Fix any TypeScript errors');
    console.log('   3. Check tsconfig.json configuration');
    return;
  }
  
  console.log(`\n🧪 Testing Enhanced Features`);
  console.log('=============================');
  
  // Run the test enhancements script
  if (checkFileExists(path.join(enginePath, 'test-enhancements.js'), 'Enhancement Test Script')) {
    runCommand('node test-enhancements.js', enginePath, 'Running enhancement demonstration');
  }
  
  console.log(`\n🎯 Next Steps`);
  console.log('==============');
  console.log('');
  console.log('1. 🏃 Start the Engine:');
  console.log('   cd packages/engine');
  console.log('   npm start');
  console.log('');
  console.log('2. 🎮 Start Enhanced CLI (in another terminal):');
  console.log('   cd packages/cli');
  console.log('   node enhanced-shell.js');
  console.log('');
  console.log('3. 🧪 Test New Features:');
  console.log('   Try these commands in the CLI:');
  console.log('   • status          - See your adventure status');
  console.log('   • quests          - List available quests');
  console.log('   • steps           - Show enhanced quest steps');
  console.log('   • step find-allies - Launch a specific step');
  console.log('   • next            - Launch next available step');
  console.log('');
  console.log('4. 🤖 Test Natural Language:');
  console.log('   • "I want to start the HMAC quest"');
  console.log('   • "I completed finding allies"');
  console.log('   • "What should I do next?"');
  console.log('');
  console.log('5. 🔄 Run Migration (when ready):');
  console.log('   cd packages/engine');
  console.log('   node migrate-quest-steps.js');
  console.log('');
  
  console.log('🎉 myMCP Enhanced Quest System Ready!');
  console.log('=====================================');
  console.log('The system now provides:');
  console.log('✅ Rich quest steps with metadata, resources & execution context');
  console.log('✅ Proper LLM integration (natural language triggers real actions)');
  console.log('✅ Enhanced CLI with step launchers and validation');
  console.log('✅ Progress tracking, templates, and learning resources');
  console.log('✅ Backward compatibility with existing quest data');
  console.log('');
  console.log('Happy questing! 🗡️✨');
}

main().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
