// Updated test script for composite TypeScript projects
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔍 Testing TypeScript compilation for composite project...');

// Check current directory and files
console.log('\n📁 Current directory:', process.cwd());
console.log('📄 Source files:');
const srcDir = path.join(process.cwd(), 'src');
const files = fs.readdirSync(srcDir);
files.forEach(file => console.log(`  - ${file}`));

// Check if dist directory exists
const distDir = path.join(process.cwd(), 'dist');
console.log('\n📁 Dist directory exists:', fs.existsSync(distDir));

// Try building with the --build flag (for composite projects)
console.log('\n🔧 Running TypeScript build for composite project...');
try {
  const output = execSync('npx tsc --build --verbose', { encoding: 'utf8' });
  console.log('✅ Build output:', output);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  if (error.stdout) console.log('stdout:', error.stdout);
  if (error.stderr) console.log('stderr:', error.stderr);
}

// Check dist directory after compilation
console.log('\n📁 Checking dist directory after build...');
if (fs.existsSync(distDir)) {
  const distFiles = fs.readdirSync(distDir);
  console.log('📄 Dist files:', distFiles);
  if (distFiles.length === 0) {
    console.log('⚠️  Dist directory is still empty!');
  } else {
    console.log('✅ Files successfully generated!');
    distFiles.forEach(file => {
      const filePath = path.join(distDir, file);
      const stats = fs.statSync(filePath);
      console.log(`  - ${file} (${stats.size} bytes)`);
    });
  }
} else {
  console.log('❌ Dist directory not found after build');
}
