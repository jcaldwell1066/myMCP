#!/usr/bin/env node

/**
 * Quick Build Test
 * Test the TypeScript compilation
 */

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function quickBuild() {
  console.log('🔨 Testing TypeScript compilation...');
  
  try {
    await new Promise<void>((resolve, reject) => {
      const buildProcess = exec('npx tsc', { 
        cwd: join(__dirname, '..'),
        timeout: 30000 
      }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Build failed with error:', error.message);
          if (stdout) console.log('STDOUT:', stdout);
          if (stderr) console.log('STDERR:', stderr);
          reject(error);
          return;
        }
        
        console.log('✅ TypeScript compilation successful!');
        if (stdout) console.log('Output:', stdout);
        if (stderr) console.log('Warnings:', stderr);
        resolve();
      });
      
      buildProcess.on('exit', (code) => {
        if (code === 0) {
          console.log('✅ Build process completed successfully');
        } else {
          console.error(`❌ Build process exited with code ${code}`);
        }
      });
    });
    
    console.log('🎉 All TypeScript errors resolved!');
    
  } catch (error) {
    console.error('💥 Build test failed:', error);
    process.exit(1);
  }
}

quickBuild();
