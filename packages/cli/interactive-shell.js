// interactive-shell.js - Main CLI loop for myMCP
const { Command } = require('commander');
const chalk = require('chalk');
const figlet = require('figlet');
const inquirer = require('inquirer');
const { execSync } = require('child_process');
const path = require('path');

// Import the main CLI program
const cliPath = path.join(__dirname, 'dist', 'mycli.js');

function showBanner() {
  console.log(
    chalk.cyan(
      figlet.textSync('myMCP Shell', { 
        font: 'Standard',
        horizontalLayout: 'default' 
      })
    )
  );
  console.log(chalk.yellow('🗡️  Interactive Fantasy CLI Shell'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log(chalk.blue('Available commands:'));
  console.log(chalk.gray('  status, get-score, set-score <num>, chat <msg>'));
  console.log(chalk.gray('  start-quest [id], quests, history, config show'));
  console.log(chalk.gray('  help, exit'));
  console.log(chalk.gray('─'.repeat(50)));
  console.log();
}

async function executeCommand(input) {
  const trimmed = input.trim();
  
  if (!trimmed) return;
  
  // Handle exit commands
  if (['exit', 'quit', 'bye', 'q'].includes(trimmed.toLowerCase())) {
    console.log(chalk.green('🎮 Thanks for playing! Goodbye, adventurer!'));
    process.exit(0);
  }
  
  // Handle help
  if (trimmed.toLowerCase() === 'help') {
    console.log(chalk.blue('🎯 Available Commands:'));
    console.log(chalk.yellow('  status') + chalk.gray(' - Show current game status'));
    console.log(chalk.yellow('  get-score') + chalk.gray(' - Get current score'));
    console.log(chalk.yellow('  set-score <number>') + chalk.gray(' - Set score (e.g., set-score 100)'));
    console.log(chalk.yellow('  start-quest [id]') + chalk.gray(' - Start a quest'));
    console.log(chalk.yellow('  quests') + chalk.gray(' - View all quests'));
    console.log(chalk.yellow('  history') + chalk.gray(' - Show conversation history'));
    console.log(chalk.yellow('  chat <message>') + chalk.gray(' - Send a chat message'));
    console.log(chalk.yellow('  config show') + chalk.gray(' - Show configuration'));
    console.log(chalk.yellow('  help') + chalk.gray(' - Show this help'));
    console.log(chalk.yellow('  exit') + chalk.gray(' - Exit the shell'));
    console.log();
    return;
  }
  
  // Handle clear screen
  if (trimmed.toLowerCase() === 'clear') {
    console.clear();
    showBanner();
    return;
  }
  
  // Execute the command using the CLI
  try {
    const fullCommand = `node "${cliPath}" ${trimmed}`;
    const result = execSync(fullCommand, { 
      encoding: 'utf8',
      cwd: __dirname,
      stdio: 'pipe'
    });
    
    if (result.trim()) {
      console.log(result);
    }
  } catch (error) {
    if (error.stdout && error.stdout.trim()) {
      console.log(error.stdout);
    } else if (error.stderr && error.stderr.trim()) {
      console.log(chalk.red('Error:'), error.stderr);
    } else {
      console.log(chalk.red('Command failed:'), error.message);
    }
  }
}

async function startShell() {
  console.clear();
  showBanner();
  
  // Test connection first
  console.log(chalk.blue('🔧 Testing connection to myMCP Engine...'));
  try {
    execSync(`node "${cliPath}" status`, { 
      encoding: 'utf8',
      cwd: __dirname,
      stdio: 'pipe'
    });
    console.log(chalk.green('✓ Connected to engine successfully!'));
  } catch (error) {
    console.log(chalk.red('⚠️  Warning: Could not connect to engine'));
    console.log(chalk.gray('   Make sure engine is running: cd packages/engine && npm start'));
  }
  console.log();
  
  // Main command loop
  while (true) {
    try {
      const { command } = await inquirer.prompt([{
        type: 'input',
        name: 'command',
        message: chalk.cyan('myMCP>'),
        validate: () => true // Allow empty input
      }]);
      
      await executeCommand(command);
      
    } catch (error) {
      if (error.name === 'ExitPromptError') {
        console.log(chalk.green('\n🎮 Goodbye, adventurer!'));
        process.exit(0);
      } else {
        console.log(chalk.red('Shell error:'), error.message);
      }
    }
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log(chalk.green('\n🎮 Goodbye, adventurer!'));
  process.exit(0);
});

// Start the shell
startShell().catch(error => {
  console.error(chalk.red('Failed to start shell:'), error.message);
  process.exit(1);
});
