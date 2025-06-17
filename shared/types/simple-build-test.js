// simple-build-test.js
const { execSync } = require('child_process');
const fs = require('fs');

console.log('Testing TypeScript compilation...');

try {
  // Clean first
  if (fs.existsSync('./dist')) {
    fs.rmSync('./dist', { recursive: true, force: true });
    console.log('✓ Cleaned dist directory');
  }

  // Create dist directory
  fs.mkdirSync('./dist', { recursive: true });
  console.log('✓ Created dist directory');

  // Run TypeScript compilation with explicit options
  console.log('🔄 Running TypeScript compilation...');
  const result = execSync('npx tsc --outDir ./dist --rootDir ./src --declaration --sourceMap src/index.ts', {
    cwd: __dirname,
    encoding: 'utf8'
  });
  
  console.log('✓ TypeScript compilation completed');
  if (result) console.log('Output:', result);

  // Check what was created
  if (fs.existsSync('./dist')) {
    const distFiles = fs.readdirSync('./dist');
    console.log('📁 Files in dist:', distFiles);
    
    distFiles.forEach(file => {
      const filePath = `./dist/${file}`;
      const stats = fs.statSync(filePath);
      console.log(`  ${file} (${stats.size} bytes)`);
    });
  }

} catch (error) {
  console.error('❌ Error:', error.message);
  if (error.stdout) console.log('Stdout:', error.stdout);
  if (error.stderr) console.log('Stderr:', error.stderr);
}
