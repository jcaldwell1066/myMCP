#!/usr/bin/env node

// Migration CLI script for quest step enhancement
const { runMigration } = require('../dist/migrations/questStepMigrator');

async function main() {
  console.log('🚀 Quest Step Enhancement Migration');
  console.log('====================================');
  
  try {
    await runMigration();
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Quest Step Enhancement Migration Tool

Usage: node migrate-quest-steps.js [options]

Options:
  --help, -h    Show this help message
  
This tool migrates legacy quest steps to the enhanced format with:
- Rich metadata (difficulty, duration, points)
- Resource libraries (documentation, tools, templates)
- Execution context (launchers, validation)
- Progress tracking (notes, artifacts, attempts)

A backup will be created before migration.
`);
  process.exit(0);
}

main();
