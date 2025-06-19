// Test script to check TypeScript compilation
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 Testing TypeScript compilation...');

// Check if TypeScript is available
try {
  const tscVersion = execSync('npx tsc --version', { encoding: 'utf8' });
  console.log('✅ TypeScript version:', tscVersion.trim());
} catch (error) {
  console.error('❌ TypeScript not found:', error.message);
  process.exit(1);
}

// Check current directory and files
console.log('\n📁 Current directory:', process.cwd());
console.log('📄 Source files:');
const srcDir = path.join(process.cwd(), 'src');
if (fs.existsSync(srcDir)) {
  const files = fs.readdirSync(srcDir);
  files.forEach(file => console.log(`  - ${file}`));
} else {
  console.log('❌ src directory not found');
  process.exit(1);
}

// Check if dist directory exists
const distDir = path.join(process.cwd(), 'dist');
console.log('\n📁 Dist directory exists:', fs.existsSync(distDir));

// Try compiling with verbose output
console.log('\n🔧 Running TypeScript compilation with verbose output...');
try {
  const output = execSync('npx tsc --verbose', { encoding: 'utf8', stdio: 'pipe' });
  console.log('✅ Compilation output:', output);
} catch (error) {
  console.error('❌ Compilation failed:', error.message);
  if (error.stdout) console.log('stdout:', error.stdout);
  if (error.stderr) console.log('stderr:', error.stderr);
}

// Check dist directory after compilation
console.log('\n📁 Checking dist directory after compilation...');
if (fs.existsSync(distDir)) {
  const distFiles = fs.readdirSync(distDir);
  console.log('📄 Dist files:', distFiles);
  if (distFiles.length === 0) {
    console.log('⚠️  Dist directory is empty!');
  }
} else {
  console.log('❌ Dist directory not found after compilation');
}
