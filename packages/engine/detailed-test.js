// detailed-test.js - More detailed TypeScript compilation test
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Detailed TypeScript compilation test...\n');

// Clean setup
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });
console.log('✓ Clean dist directory created');

// Check what TypeScript actually sees
console.log('\n1. What files does TypeScript see?');
try {
  const output = execSync('npx tsc --listFiles --noEmit', {
    cwd: __dirname,
    encoding: 'utf8'
  });
  const lines = output.split('\n');
  const sourceFiles = lines.filter(line => line.includes('src/index.ts') || line.includes('packages/engine'));
  console.log('Source files TypeScript found:');
  sourceFiles.forEach(file => console.log('  ', file));
  
  if (sourceFiles.length === 0) {
    console.log('❌ TypeScript is not finding our source files!');
  }
} catch (error) {
  console.log('Error listing files:', error.message);
}

// Try explicit file compilation
console.log('\n2. Trying explicit file compilation...');
try {
  execSync('npx tsc src/index.ts --outDir dist --declaration --sourceMap --skipLibCheck', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log('✓ Explicit compilation completed');
} catch (error) {
  console.log('❌ Explicit compilation failed');
}

// Check results
console.log('\n3. Checking what was created...');
if (fs.existsSync(distPath)) {
  const files = fs.readdirSync(distPath);
  console.log('Files in dist:', files);
  
  files.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    console.log(`  ${file}: ${stats.size} bytes`);
  });
} else {
  console.log('❌ Dist directory still empty');
}

// Check tsconfig
console.log('\n4. Checking tsconfig...');
const tsconfigPath = path.join(__dirname, 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  console.log('tsconfig outDir:', tsconfig.compilerOptions?.outDir);
  console.log('tsconfig rootDir:', tsconfig.compilerOptions?.rootDir);
  console.log('tsconfig include:', tsconfig.include);
} else {
  console.log('❌ No tsconfig.json found');
}
