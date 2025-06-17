// debug-typescript.js - Deep diagnostic of TypeScript behavior
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Deep TypeScript diagnostic...\n');

// Clean setup
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });
console.log('✓ Clean dist directory created');

// Check current working directory and paths
console.log('\n📍 Environment check:');
console.log('Current directory:', __dirname);
console.log('Dist path:', distPath);
console.log('Source file exists:', fs.existsSync(path.join(__dirname, 'src', 'index.ts')));
console.log('tsconfig exists:', fs.existsSync(path.join(__dirname, 'tsconfig.json')));

// Check TypeScript version and config resolution
console.log('\n🔧 TypeScript info:');
try {
  const tscVersion = execSync('npx tsc --version', { encoding: 'utf8', cwd: __dirname });
  console.log('TypeScript version:', tscVersion.trim());
} catch (error) {
  console.log('Failed to get TypeScript version:', error.message);
}

// Try to see what TypeScript thinks it's doing
console.log('\n📋 TypeScript compilation with maximum verbosity:');
try {
  const output = execSync('npx tsc --listFiles --explainFiles', {
    cwd: __dirname,
    encoding: 'utf8',
    timeout: 30000
  });
  
  const lines = output.split('\n');
  const relevantLines = lines.filter(line => 
    line.includes('index.ts') || 
    line.includes('dist') || 
    line.includes('Compiling') ||
    line.includes('Found') ||
    line.includes('error')
  );
  
  console.log('Relevant TypeScript output:');
  relevantLines.forEach(line => console.log('  ', line));
  
} catch (error) {
  console.log('Error getting TypeScript info:', error.message);
  if (error.stdout) console.log('Stdout:', error.stdout);
  if (error.stderr) console.log('Stderr:', error.stderr);
}

// Check what happens with a minimal test file
console.log('\n🧪 Testing with minimal file:');
const testFile = path.join(__dirname, 'src', 'test.ts');
fs.writeFileSync(testFile, 'console.log("Hello TypeScript");');

try {
  execSync('npx tsc src/test.ts --outDir dist', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  const testJs = path.join(distPath, 'test.js');
  if (fs.existsSync(testJs)) {
    console.log('✓ Minimal test file compiled successfully');
    const content = fs.readFileSync(testJs, 'utf8');
    console.log('Test file content:', content.trim());
  } else {
    console.log('❌ Minimal test file did not compile');
  }
} catch (error) {
  console.log('❌ Minimal test failed:', error.message);
} finally {
  // Clean up test file
  if (fs.existsSync(testFile)) {
    fs.unlinkSync(testFile);
  }
}

// Final check of directory contents
console.log('\n📁 Final directory check:');
if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  console.log('Files in dist:', files);
  
  if (files.length === 0) {
    console.log('❌ Dist directory is empty after all tests');
  }
} else {
  console.log('❌ Dist directory does not exist');
}

// Check if there are any TypeScript-related files that might interfere
console.log('\n🔍 Checking for interference files:');
const potentialFiles = [
  'tsconfig.tsbuildinfo',
  'tsconfig.json.backup',
  '.tsbuildinfo'
];

potentialFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`Found: ${file}`);
    const stats = fs.statSync(filePath);
    console.log(`  Size: ${stats.size} bytes, Modified: ${stats.mtime}`);
  }
});

console.log('\n🎉 Deep diagnostic complete!');
