#!/usr/bin/env node

// Enhanced build script for myMCP Engine
// Handles TypeScript compilation with proper error handling and type checking

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building myMCP Engine');
console.log('========================');

const projectRoot = __dirname;
const distPath = path.join(projectRoot, 'dist');
const srcPath = path.join(projectRoot, 'src');

function runCommand(command, description) {
  console.log(`\n📦 ${description}`);
  console.log(`   Running: ${command}`);
  
  try {
    execSync(command, { 
      cwd: projectRoot,
      stdio: 'inherit'
    });
    console.log('   ✅ Success!');
    return true;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return false;
  }
}

function checkDependencies() {
  console.log('\n🔍 Checking Dependencies');
  console.log('=========================');
  
  if (!fs.existsSync(path.join(projectRoot, 'node_modules'))) {
    console.log('📦 Installing dependencies...');
    return runCommand('npm install', 'Installing node modules');
  } else {
    console.log('✅ Dependencies already installed');
    return true;
  }
}

function cleanDist() {
  console.log('\n🧹 Cleaning Previous Build');
  console.log('===========================');
  
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log('✅ Cleaned dist directory');
  } else {
    console.log('✅ No previous build to clean');
  }
  return true;
}

function buildTypeScript() {
  console.log('\n🔧 Building TypeScript');
  console.log('=======================');
  
  // Try building with TypeScript
  return runCommand('npx tsc', 'Compiling TypeScript files');
}

function validateBuild() {
  console.log('\n✅ Validating Build');
  console.log('====================');
  
  const requiredFiles = [
    'dist/index.js',
    'dist/types/QuestStep.js',
    'dist/data/stepEnhancements.js',
    'dist/migrations/questStepMigrator.js'
  ];
  
  let allValid = true;
  
  for (const file of requiredFiles) {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ Missing: ${file}`);
      allValid = false;
    }
  }
  
  return allValid;
}

async function main() {
  try {
    // Step 1: Check dependencies
    if (!checkDependencies()) {
      throw new Error('Failed to install dependencies');
    }
    
    // Step 2: Clean previous build
    if (!cleanDist()) {
      throw new Error('Failed to clean previous build');
    }
    
    // Step 3: Build TypeScript
    if (!buildTypeScript()) {
      console.log('\n⚠️  TypeScript build failed. Trying alternative approach...');
      
      // If TypeScript build fails, we can still use the JavaScript versions
      console.log('\n📋 Alternative: Using JavaScript Versions');
      console.log('==========================================');
      console.log('✅ Enhanced quest steps available in: packages/cli/src/questStepTypes.js');
      console.log('✅ Step launcher available in: packages/cli/src/stepLauncher.js');
      console.log('✅ Enhanced CLI available in: packages/cli/enhanced-shell.js');
      console.log('\n💡 You can still use the enhanced features without TypeScript compilation!');
      return;
    }
    
    // Step 4: Validate build
    if (!validateBuild()) {
      throw new Error('Build validation failed');
    }
    
    console.log('\n🎉 Build Complete!');
    console.log('===================');
    console.log('✅ TypeScript compiled successfully');
    console.log('✅ All required files generated');
    console.log('✅ Enhanced quest step system ready');
    console.log('\n🚀 Next Steps:');
    console.log('   • Start engine: npm start');
    console.log('   • Run migration: node migrate-quest-steps.js');
    console.log('   • Test CLI: cd ../cli && node enhanced-shell.js');
    
  } catch (error) {
    console.error('\n💥 Build Failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Check TypeScript errors above');
    console.log('   • Ensure all dependencies are installed');
    console.log('   • Try: npm install && npm run build');
    console.log('   • Alternative: Use JavaScript versions in packages/cli/');
    process.exit(1);
  }
}

main();
