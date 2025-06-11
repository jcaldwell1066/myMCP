#!/usr/bin/env node

/**
 * myMCP Pre-Release Packaging Script
 * Creates a distributable pre-release package
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('📦 myMCP Pre-Release Packaging');
console.log('==============================');

const version = '0.1.0-pre-release';
const packageName = `myMCP-${version}`;
const distDir = path.join(process.cwd(), 'dist');
const packageDir = path.join(distDir, packageName);

function createPackageStructure() {
  console.log('📁 Creating package structure...');
  
  // Create directories
  fs.mkdirSync(distDir, { recursive: true });
  fs.mkdirSync(packageDir, { recursive: true });
  
  // Copy essential files
  const filesToCopy = [
    'README.md',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    '.env.example',
    '.eslintrc.js',
    '.prettierrc.json',
    '.gitignore'
  ];
  
  filesToCopy.forEach(file => {
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, path.join(packageDir, file));
      console.log(`✅ Copied ${file}`);
    }
  });
  
  // Copy directories
  const dirsToCopy = [
    'docs',
    'packages', 
    'shared',
    'scripts',
    'tests',
    'examples'
  ];
  
  dirsToCopy.forEach(dir => {
    if (fs.existsSync(dir)) {
      copyDirectory(dir, path.join(packageDir, dir));
      console.log(`✅ Copied ${dir}/`);
    }
  });
}

function copyDirectory(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    // Skip node_modules and other build artifacts
    if (entry.name === 'node_modules' || entry.name === '.git') {
      continue;
    }
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function updatePackageVersion() {
  console.log('🏷️  Updating package version...');
  
  const packageJsonPath = path.join(packageDir, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  packageJson.version = version;
  packageJson.description = 'myMCP Pre-Release - Fantasy chatbot system with CLI, API, and quest components';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`✅ Updated version to ${version}`);
}

function createReleaseNotes() {
  console.log('📝 Creating release notes...');
  
  const releaseNotes = `# myMCP ${version} - Pre-Release

## 🎯 What's New

This pre-release demonstrates the core foundation of myMCP - a fantasy-themed chatbot system that gamifies technical learning through epic quests.

### ✨ Features Included

- **🗡️ Fantasy CLI Interface** - Interactive command-line with 8 core commands
- **⚡ Game State Management API** - Express.js engine with REST endpoints  
- **🏰 Three Epic Quests** - Real-world skills wrapped in fantasy adventures
- **🔄 Real-time Updates** - WebSocket support for live state synchronization
- **🌐 Cross-Platform** - Works on Windows, macOS, Linux, and WSL
- **📚 Professional Documentation** - Complete setup guides and API reference

### 🎮 Available Quests

1. **Council of Three Realms** - Master timezone coordination and meeting scheduling
2. **Dungeon Keeper's Vigil** - Learn server monitoring and system health checks  
3. **Cryptomancer's Seal** - Implement HMAC cryptographic authentication

### 🚀 Quick Start

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Start the engine
npm run dev:engine

# 3. Start your adventure (new terminal)
npm run dev:cli -- status
npm run dev:cli -- start-quest
\`\`\`

### 📊 Progress Status

**Current**: 31.25% complete (5/16 tasks)
- ✅ Foundation architecture and CLI-Engine integration
- 🚧 Next: Tab completion, LLM integration, web interface

### 🔧 Technical Details

- **Node.js 18+** and **TypeScript 5.0+**
- **Express.js** REST API with **WebSocket** real-time updates
- **Commander.js** CLI framework with fantasy theming
- **Cross-platform** configuration management
- **Comprehensive** error handling and user guidance

### ⚠️ Pre-Release Limitations

- Simple bot responses (LLM integration planned for Task 7)
- CLI interface only (React webapp planned for Task 12)
- Manual tab completion (shell integration planned for Task 6)

### 🤝 Contributing

We welcome feedback and contributions! See \`docs/GETTING_STARTED.md\` for setup instructions and \`docs/README.md\` for complete documentation.

### 📄 License

MIT License - see LICENSE file for details.

---

**Ready to transform your technical journey into an epic adventure?** 🗡️✨

For support, documentation, and examples, visit the \`docs/\` directory.
`;

  fs.writeFileSync(path.join(packageDir, 'RELEASE_NOTES.md'), releaseNotes);
  console.log('✅ Created release notes');
}

function createInstallScript() {
  console.log('🔧 Creating install script...');
  
  const installScript = `#!/bin/bash
# myMCP Pre-Release Install Script

echo "🗡️ myMCP Pre-Release Installation"
echo "=================================="

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Installation failed!"
    exit 1
fi

# Build project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "🎉 Installation complete!"
echo ""
echo "🚀 Quick Start:"
echo "  1. Start engine: npm run dev:engine"
echo "  2. New terminal:  npm run dev:cli -- status"
echo "  3. Begin quest:   npm run dev:cli -- start-quest"
echo ""
echo "📚 Documentation: docs/GETTING_STARTED.md"
echo "🎮 Ready for adventure!"
`;

  fs.writeFileSync(path.join(packageDir, 'install.sh'), installScript);
  
  // Windows install script
  const installBat = `@echo off
REM myMCP Pre-Release Install Script (Windows)

echo 🗡️ myMCP Pre-Release Installation
echo ==================================

echo 📦 Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Installation failed!
    pause
    exit /b 1
)

echo 🔨 Building project...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo 🎉 Installation complete!
echo.
echo 🚀 Quick Start:
echo   1. Start engine: npm run dev:engine
echo   2. New terminal:  npm run dev:cli -- status  
echo   3. Begin quest:   npm run dev:cli -- start-quest
echo.
echo 📚 Documentation: docs\\GETTING_STARTED.md
echo 🎮 Ready for adventure!
pause
`;

  fs.writeFileSync(path.join(packageDir, 'install.bat'), installBat);
  console.log('✅ Created install scripts');
}

function createArchive() {
  console.log('🗜️  Creating archive...');
  
  try {
    // Create ZIP archive
    execSync(`cd ${distDir} && zip -r ${packageName}.zip ${packageName}`, { stdio: 'inherit' });
    console.log(`✅ Created ${packageName}.zip`);
    
    // Create tar.gz archive  
    execSync(`cd ${distDir} && tar -czf ${packageName}.tar.gz ${packageName}`, { stdio: 'inherit' });
    console.log(`✅ Created ${packageName}.tar.gz`);
    
  } catch (error) {
    console.log('⚠️  Archive creation failed - manual archiving may be needed');
    console.log('📁 Package directory ready at:', packageDir);
  }
}

function generateChecksums() {
  console.log('🔐 Generating checksums...');
  
  try {
    const zipFile = path.join(distDir, `${packageName}.zip`);
    const tarFile = path.join(distDir, `${packageName}.tar.gz`);
    
    if (fs.existsSync(zipFile)) {
      const zipChecksum = execSync(`shasum -a 256 "${zipFile}"`, { encoding: 'utf8' });
      console.log(`ZIP SHA256: ${zipChecksum.trim()}`);
    }
    
    if (fs.existsSync(tarFile)) {
      const tarChecksum = execSync(`shasum -a 256 "${tarFile}"`, { encoding: 'utf8' });
      console.log(`TAR SHA256: ${tarChecksum.trim()}`);
    }
    
  } catch (error) {
    console.log('⚠️  Checksum generation skipped (shasum not available)');
  }
}

// Main packaging process
async function createPreRelease() {
  try {
    console.log(`Creating pre-release package: ${packageName}`);
    
    createPackageStructure();
    updatePackageVersion();
    createReleaseNotes();
    createInstallScript();
    createArchive();
    generateChecksums();
    
    console.log('\n🎉 Pre-release package created successfully!');
    console.log(`📁 Location: ${packageDir}`);
    console.log(`📦 Archives: ${distDir}/${packageName}.zip, ${packageName}.tar.gz`);
    console.log('\n🚀 Ready for distribution!');
    
  } catch (error) {
    console.error('❌ Packaging failed:', error.message);
    process.exit(1);
  }
}

// Run packaging if called directly
if (require.main === module) {
  createPreRelease();
}

module.exports = { createPreRelease };
