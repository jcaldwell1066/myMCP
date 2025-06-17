// debug-build.js - Diagnostic script for TypeScript build issues
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command, description) {
  console.log(`\n🔍 ${description}`);
  console.log(`Command: ${command}`);
  try {
    const output = execSync(command, { cwd: __dirname, encoding: 'utf8' });
    console.log('Output:', output);
    return output;
  } catch (error) {
    console.error('Error:', error.message);
    if (error.stdout) console.log('Stdout:', error.stdout);
    if (error.stderr) console.log('Stderr:', error.stderr);
    return null;
  }
}

function checkFileSystem() {
  console.log('\n📁 File System Check');
  const currentDir = __dirname;
  console.log('Current directory:', currentDir);
  
  // Check if src exists and has content
  const srcPath = path.join(currentDir, 'src');
  if (fs.existsSync(srcPath)) {
    console.log('✓ src directory exists');
    const srcFiles = fs.readdirSync(srcPath);
    console.log('src files:', srcFiles);
  } else {
    console.log('❌ src directory missing');
  }
  
  // Check if dist exists
  const distPath = path.join(currentDir, 'dist');
  if (fs.existsSync(distPath)) {
    console.log('✓ dist directory exists');
    const distFiles = fs.readdirSync(distPath);
    console.log('dist files:', distFiles);
  } else {
    console.log('❌ dist directory missing');
  }
  
  // Check tsconfig
  const tsconfigPath = path.join(currentDir, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    console.log('✓ tsconfig.json exists');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    console.log('tsconfig outDir:', tsconfig.compilerOptions?.outDir);
    console.log('tsconfig rootDir:', tsconfig.compilerOptions?.rootDir);
  } else {
    console.log('❌ tsconfig.json missing');
  }
}

// Run diagnostics
console.log('🔧 TypeScript Build Diagnostics');
checkFileSystem();

runCommand('npx tsc --version', 'TypeScript Version');
runCommand('npx tsc --showConfig', 'Show Effective TypeScript Config');
runCommand('npx tsc --listFiles --noEmit', 'List Files Being Processed');
runCommand('npx tsc --build --dry', 'Dry Run Build');
runCommand('npx tsc --build --verbose', 'Verbose Build');

console.log('\n🔍 Post-build file system check');
checkFileSystem();
