// Test script to check if TypeScript compilation works
console.log('Testing TypeScript compilation...');

try {
  const { execSync } = require('child_process');
  
  // Run TypeScript compiler with verbose output
  console.log('Running: npx tsc --noEmit');
  const result = execSync('npx tsc --noEmit', { 
    encoding: 'utf8',
    cwd: process.cwd()
  });
  
  console.log('TypeScript check passed!');
  console.log(result);
  
} catch (error) {
  console.error('TypeScript compilation failed:');
  console.error(error.stdout);
  console.error(error.stderr);
}
