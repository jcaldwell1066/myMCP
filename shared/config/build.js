// build.js - Cross-platform build script for shared/config
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function cleanDist() {
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    console.log('✓ Cleaned dist directory');
  }
  
  // Also clean the tsbuildinfo file to force a rebuild
  const tsbuildinfo = path.join(__dirname, 'tsconfig.tsbuildinfo');
  if (fs.existsSync(tsbuildinfo)) {
    fs.unlinkSync(tsbuildinfo);
    console.log('✓ Cleaned TypeScript build info');
  }
}

function buildConfig() {
  try {
    console.log('🔄 Building TypeScript...');
    
    // Create dist directory if it doesn't exist
    const distPath = path.join(__dirname, 'dist');
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath, { recursive: true });
    }
    
    // Use direct tsc command (same approach that works for types)
    execSync('npx tsc', { stdio: 'inherit', cwd: __dirname });
    console.log('✓ TypeScript build completed');
  } catch (error) {
    console.error('❌ TypeScript build failed:', error.message);
    process.exit(1);
  }
}

function verifyBuild() {
  const distPath = path.join(__dirname, 'dist');
  const indexJs = path.join(distPath, 'index.js');
  const indexDts = path.join(distPath, 'index.d.ts');
  
  if (!fs.existsSync(indexJs) || !fs.existsSync(indexDts)) {
    console.error('❌ Build verification failed - missing output files');
    console.error(`  Checked for: ${indexJs}`);
    console.error(`  Checked for: ${indexDts}`);
    
    // Debug: show what files actually exist
    if (fs.existsSync(distPath)) {
      const distFiles = fs.readdirSync(distPath);
      console.error(`  Files in dist: ${distFiles.join(', ')}`);
    } else {
      console.error('  dist directory does not exist');
    }
    process.exit(1);
  }
  
  // Get file sizes for confirmation
  const jsStats = fs.statSync(indexJs);
  const dtsStats = fs.statSync(indexDts);
  
  console.log('✓ Build verification passed');
  console.log(`  index.js: ${jsStats.size} bytes`);
  console.log(`  index.d.ts: ${dtsStats.size} bytes`);
}

// Main execution
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'clean':
      cleanDist();
      break;
    case 'build':
      cleanDist();
      buildConfig();
      verifyBuild();
      break;
    case 'dev':
      console.log('🔄 Starting development mode...');
      execSync('npx tsc --watch', { stdio: 'inherit', cwd: __dirname });
      break;
    default:
      console.log('Usage: node build.js [clean|build|dev]');
  }
}