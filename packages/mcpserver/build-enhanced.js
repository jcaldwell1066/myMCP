#!/usr/bin/env node

/**
 * Build script to compile enhanced-comprehensive.ts and make it the main index.js
 */

import { execSync } from 'child_process';
import { copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔨 Building enhanced comprehensive MCP server...');

try {
  // Build all TypeScript files
  console.log('📦 Compiling TypeScript...');
  execSync('npx tsc --build', { stdio: 'inherit', cwd: __dirname });
  
  // Check if enhanced-comprehensive.js was created
  const enhancedPath = join(__dirname, 'dist', 'enhanced-comprehensive.js');
  const indexPath = join(__dirname, 'dist', 'index.js');
  
  if (existsSync(enhancedPath)) {
    console.log('✅ Enhanced version compiled successfully');
    
    // Copy enhanced version to index.js (the main entry point)
    console.log('🔄 Making enhanced version the main entry point...');
    copyFileSync(enhancedPath, indexPath);
    
    console.log('✅ Enhanced comprehensive server is now active!');
    console.log('🎯 The enhanced server includes:');
    console.log('   • 8 Resources (game state, quests, inventory, etc.)');
    console.log('   • 11 Tools (quest management, player actions, etc.)');
    console.log('   • 5 Prompts (game guidance and context)');
    console.log('');
    console.log('🚀 Ready to use! Your MCP config will now use the enhanced server.');
    
  } else {
    console.error('❌ Enhanced version not found after build');
    process.exit(1);
  }
  
} catch (error) {
  console.error('💥 Build failed:', error.message);
  process.exit(1);
}
