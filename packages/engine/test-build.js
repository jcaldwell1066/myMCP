// test-build.js - Diagnostic script for engine build
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosing engine build issues...\n');

// Step 1: Check if shared/types is built
console.log('1. Checking shared/types dependency...');
const typesPath = path.join(__dirname, '../../shared/types/dist/index.d.ts');
if (fs.existsSync(typesPath)) {
  console.log('✓ @mymcp/types is built');
} else {
  console.log('❌ @mymcp/types is NOT built - building it now...');
  try {
    execSync('node build.js build', {
      cwd: path.join(__dirname, '../../shared/types'),
      stdio: 'inherit'
    });
    console.log('✓ @mymcp/types built successfully');
  } catch (error) {
    console.log('❌ Failed to build @mymcp/types');
    process.exit(1);
  }
}

// Step 2: Clean and create dist directory
console.log('\n2. Setting up build environment...');
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });
console.log('✓ Created clean dist directory');

// Step 3: Test TypeScript compilation with verbose output
console.log('\n3. Testing TypeScript compilation...');
try {
  const output = execSync('npx tsc --noEmit --listFiles', {
    cwd: __dirname,
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('✓ TypeScript syntax check passed');
  console.log('Files being processed:', output.split('\n').slice(0, 5).join('\n'), '...');
} catch (error) {
  console.log('❌ TypeScript syntax errors found:');
  console.log(error.stdout || error.message);
  process.exit(1);
}

// Step 4: Try actual compilation
console.log('\n4. Attempting TypeScript compilation...');
try {
  execSync('npx tsc --skipLibCheck', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log('✓ TypeScript compilation successful');
} catch (error) {
  console.log('❌ TypeScript compilation failed');
  process.exit(1);
}

// Step 5: Verify output files
console.log('\n5. Verifying build output...');
const requiredFiles = ['index.js', 'index.d.ts'];
const missingFiles = requiredFiles.filter(file => 
  !fs.existsSync(path.join(distPath, file))
);

if (missingFiles.length > 0) {
  console.log('❌ Missing output files:', missingFiles);
  
  // Show what files were actually created
  if (fs.existsSync(distPath)) {
    const actualFiles = fs.readdirSync(distPath);
    console.log('Actual files created:', actualFiles);
  }
} else {
  console.log('✓ All required files created successfully');
  
  // Show file sizes
  requiredFiles.forEach(file => {
    const filePath = path.join(distPath, file);
    const stats = fs.statSync(filePath);
    console.log(`  ${file}: ${stats.size} bytes`);
  });
}

console.log('\n🎉 Build diagnosis complete!');
