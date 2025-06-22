// Wood Badge Specific CLI Commands for myMCP
// Specialized commands for Wood Badge staff training quest

const chalk = require('chalk');
const { Command } = require('commander');
const { getPlayerState, executeGameAction } = require('./api-client');

// ASCII Art for Wood Badge
const WOOD_BADGE_ASCII = {
  fleurDeLis: `
     ⚜️
    ╱│╲
   ╱ │ ╲
  ╱  │  ╲
 ╱   │   ╲
╱    │    ╲`,
  
  staffBadge: `
┌─────────────┐
│  ⚜️ STAFF ⚜️  │
│   TRAINER   │
│  WOOD BADGE │
└─────────────┘`,

  neckerchief: `
    ╭─────╮
   ╱       ╲
  ╱         ╲
 ╱           ╲
╱_____________╲`,

  patrolBadges: {
    Eagle: '🦅',
    Bear: '🐻',
    Fox: '🦊',
    Wolf: '🐺',
    Beaver: '🦫',
    Owl: '🦉'
  }
};

// Wood Badge themed colors
const WB_COLORS = {
  primary: chalk.hex('#1f4e79'),
  secondary: chalk.hex('#b8860b'),
  accent: chalk.hex('#228b22'),
  fleur: chalk.yellow,
  patrol: chalk.blue
};

class WoodBadgeCommands {
  constructor(program) {
    this.program = program;
    this.setupCommands();
  }

  setupCommands() {
    // Wood Badge welcome command
    this.program
      .command('wb-welcome')
      .description('Display Wood Badge welcome message with ASCII art')
      .action(this.showWelcome.bind(this));

    // Wood Badge quest status
    this.program
      .command('wb-status')
      .description('Show Wood Badge training quest status')
      .action(this.showWoodBadgeStatus.bind(this));

    // Wood Badge patrol info
    this.program
      .command('wb-patrol')
      .description('Show your patrol information and members')
      .option('-p, --patrol <name>', 'Show specific patrol information')
      .action(this.showPatrolInfo.bind(this));

    // Wood Badge progress tracker
    this.program
      .command('wb-progress')
      .description('Show detailed progress through Wood Badge training')
      .action(this.showProgressTracker.bind(this));

    // Wood Badge resource launcher
    this.program
      .command('wb-resource')
      .description('Launch Wood Badge training resources')
      .argument('<resource>', 'Resource to launch (docs, videos, tools)')
      .action(this.launchResource.bind(this));

    // Wood Badge staff dashboard
    this.program
      .command('wb-dashboard')
      .description('Launch Wood Badge staff dashboard')
      .action(this.launchDashboard.bind(this));

    // Wood Badge community tools
    this.program
      .command('wb-connect')
      .description('Connect to Wood Badge community platforms')
      .option('-s, --slack', 'Open Slack workspace')
      .option('-d, --discord', 'Open Discord server')
      .action(this.connectCommunity.bind(this));
  }

  async showWelcome() {
    console.log(WB_COLORS.fleur(WOOD_BADGE_ASCII.fleurDeLis));
    console.log();
    console.log(WB_COLORS.primary.bold('WOOD BADGE STAFF TRAINING QUEST 2025'));
    console.log(WB_COLORS.accent('Central Florida Council'));
    console.log();
    console.log(chalk.gray('────────────────────────────────────────'));
    console.log();
    console.log(WB_COLORS.secondary('"Back to Gilwell, Happy Land"'));
    console.log();
    console.log('Welcome to the future of Scouting leadership training!');
    console.log('This multi-modal quest will prepare you to deliver');
    console.log('exceptional Wood Badge training experiences.');
    console.log();
    console.log(chalk.blue('Available Commands:'));
    console.log('  wb-status     - View your training progress');
    console.log('  wb-patrol     - Check your patrol information');  
    console.log('  wb-progress   - Detailed progress tracker');
    console.log('  wb-dashboard  - Launch staff dashboard');
    console.log('  wb-connect    - Access community platforms');
    console.log();
    console.log(chalk.gray('Use "mycli wb-status" to get started!'));
  }

  async showWoodBadgeStatus() {
    const state = await getPlayerState();
    if (!state) return;

    const woodBadgeQuest = state.quests.available.find(q => 
      q.id === 'woodbadge-staff-training-2025') || 
      state.quests.active;

    if (!woodBadgeQuest) {
      console.log(chalk.yellow('⚠️  Wood Badge quest not found. Please start the quest first.'));
      return;
    }

    console.log(WB_COLORS.fleur(WOOD_BADGE_ASCII.fleurDeLis));
    console.log();
    console.log(WB_COLORS.primary.bold(`🎯 ${woodBadgeQuest.title}`));
    console.log(WB_COLORS.accent(woodBadgeQuest.description));
    console.log();

    const completedSteps = woodBadgeQuest.steps.filter(s => s.completed).length;
    const totalSteps = woodBadgeQuest.steps.length;
    const progressPercent = Math.round((completedSteps / totalSteps) * 100);

    // Progress bar with Wood Badge colors
    const progressBar = '█'.repeat(Math.floor(progressPercent / 5)) + 
                       '░'.repeat(20 - Math.floor(progressPercent / 5));
    
    console.log(WB_COLORS.secondary(`📊 Progress: [${progressBar}] ${completedSteps}/${totalSteps} (${progressPercent}%)`));
    console.log();

    // Show current phase
    let currentPhase = 'Foundation Knowledge';
    if (completedSteps >= 3) currentPhase = 'Skills Development';
    if (completedSteps >= 6) currentPhase = 'Implementation';
    if (completedSteps === totalSteps) currentPhase = 'Complete';

    console.log(chalk.blue(`📚 Current Phase: ${currentPhase}`));
    console.log();

    // Show next step
    const nextStep = woodBadgeQuest.steps.find(s => !s.completed);
    if (nextStep) {
      console.log(chalk.cyan(`⭕ Next Step: ${nextStep.title || nextStep.description}`));
      console.log(chalk.gray(`   Points: ${nextStep.metadata?.points || 25} • Duration: ${nextStep.metadata?.estimatedDuration || 'Unknown'}`));
      console.log(chalk.gray(`   Use "mycli next" to continue`));
    } else {
      console.log(chalk.green('🎉 All steps completed! You are ready to staff Wood Badge courses!'));
      console.log(WB_COLORS.secondary(WOOD_BADGE_ASCII.staffBadge));
    }
  }

  async showPatrolInfo() {
    const state = await getPlayerState();
    if (!state) return;

    // Simulate patrol assignment (in real implementation, this would come from quest data)
    const patrols = ['Eagle', 'Bear', 'Fox', 'Wolf', 'Beaver', 'Owl'];
    const playerPatrol = patrols[Math.floor(Math.random() * patrols.length)];

    console.log(WB_COLORS.patrol.bold(`🏕️  ${playerPatrol} Patrol Information`));
    console.log();

    // ASCII patrol badge
    const badge = WOOD_BADGE_ASCII.patrolBadges[playerPatrol];
    console.log(chalk.gray(`
┌─────────┐
│   ${badge}   │
│ ${playerPatrol.padEnd(7)} │
└─────────┘`));

    console.log();
    console.log(chalk.blue('Patrol Members:'));
    
    // Simulate patrol members
    const mockMembers = [
      { name: 'Sarah Mitchell', role: 'Assistant Scoutmaster', progress: 25 },
      { name: 'Mike Rodriguez', role: 'Den Leader', progress: 38 },
      { name: 'You', role: 'Committee Chair', progress: 0 }
    ];

    mockMembers.forEach(member => {
      const progressBar = '█'.repeat(Math.floor(member.progress / 10)) + 
                         '░'.repeat(10 - Math.floor(member.progress / 10));
      console.log(`  • ${member.name} (${member.role})`);
      console.log(`    Progress: [${progressBar}] ${member.progress}%`);
      console.log();
    });

    console.log(chalk.yellow('💡 Patrol System Benefits:'));
    console.log('  • Small group learning and support');
    console.log('  • Shared experiences and challenges');
    console.log('  • Friendly competition and motivation');
    console.log('  • Lifelong Scouting friendships');
  }

  async showProgressTracker() {
    const state = await getPlayerState();
    if (!state) return;

    const woodBadgeQuest = state.quests.active || 
      state.quests.available.find(q => q.id === 'woodbadge-staff-training-2025');

    if (!woodBadgeQuest) {
      console.log(chalk.yellow('⚠️  Wood Badge quest not found.'));
      return;
    }

    console.log(WB_COLORS.primary.bold('📊 Wood Badge Training Progress Tracker'));
    console.log(chalk.gray('────────────────────────────────────────────'));
    console.log();

    // Show detailed step progress
    woodBadgeQuest.steps.forEach((step, index) => {
      const stepNumber = index + 1;
      const status = step.completed ? chalk.green('✅') : chalk.gray('○');
      const points = step.metadata?.points || 25;
      const duration = step.metadata?.estimatedDuration || 'Unknown';
      
      console.log(`${status} ${stepNumber}. ${step.title || step.description}`);
      console.log(chalk.gray(`      ${points} points • ${duration} • ${step.metadata?.difficulty || 'medium'}`));
      
      if (step.metadata?.tags) {
        console.log(chalk.gray(`      Tags: ${step.metadata.tags.join(', ')}`));
      }
      
      if (!step.completed && step.execution?.hints) {
        console.log(chalk.yellow(`      💡 Hint: ${step.execution.hints[0]}`));
      }
      
      console.log();
    });

    // Show overall statistics
    const totalPoints = woodBadgeQuest.steps.reduce((sum, step) => 
      sum + (step.metadata?.points || 25), 0);
    const earnedPoints = woodBadgeQuest.steps
      .filter(s => s.completed)
      .reduce((sum, step) => sum + (step.metadata?.points || 25), 0);

    console.log(chalk.blue('📈 Statistics:'));
    console.log(`  Total Points Available: ${totalPoints}`);
    console.log(`  Points Earned: ${earnedPoints}`);
    console.log(`  Completion Rate: ${Math.round((earnedPoints / totalPoints) * 100)}%`);
    console.log();

    // Show multi-modal progress
    console.log(chalk.magenta('🔄 Multi-Modal Integration:'));
    const integrations = [
      { name: 'CLI Interface', status: 'Active', color: chalk.green },
      { name: 'Web Dashboard', status: 'Available', color: chalk.blue },
      { name: 'MCP Integration', status: 'Connected', color: chalk.purple },
      { name: 'Slack Workspace', status: 'Ready', color: chalk.yellow },
      { name: 'Discord Server', status: 'Setup', color: chalk.gray }
    ];

    integrations.forEach(integration => {
      console.log(`  • ${integration.name}: ${integration.color(integration.status)}`);
    });
  }

  async launchResource(resourceType) {
    console.log(WB_COLORS.accent.bold(`📚 Launching ${resourceType} resources...`));
    console.log();

    const resources = {
      docs: [
        'How To Be On Wood Badge Staff',
        'Wood Badge Syllabus 2025',
        'Central Florida Council Guidelines',
        'Adult Learning Principles',
        'EDGE Method Guide'
      ],
      videos: [
        'Wood Badge History and Traditions',
        'The Five Themes of Wood Badge',
        'Facilitation Techniques',
        'Adult Learning Best Practices',
        'Camp La-No-Che Virtual Tour'
      ],
      tools: [
        'Session Planning Template',
        'Participant Assessment Forms',
        'Safety Checklist',
        'Resource Library Access',
        'Evaluation Forms'
      ]
    };

    if (resources[resourceType]) {
      console.log(chalk.blue(`📋 Available ${resourceType}:`));
      resources[resourceType].forEach((resource, index) => {
        console.log(`  ${index + 1}. ${resource}`);
      });
      console.log();
      console.log(chalk.gray('💡 In a real implementation, these would open automatically'));
      console.log(chalk.gray('   or provide direct links to the resources.'));
    } else {
      console.log(chalk.yellow(`⚠️  Unknown resource type: ${resourceType}`));
      console.log(chalk.gray('Available types: docs, videos, tools'));
    }
  }

  async launchDashboard() {
    console.log(WB_COLORS.primary.bold('🚀 Launching Wood Badge Staff Dashboard...'));
    console.log();
    console.log(WB_COLORS.fleur(WOOD_BADGE_ASCII.fleurDeLis));
    console.log();
    console.log('Dashboard Features:');
    console.log('  • Real-time participant progress tracking');
    console.log('  • Multi-modal integration status');
    console.log('  • Patrol-based organization');
    console.log('  • Camp La-No-Che status updates');
    console.log('  • Training activity feed');
    console.log('  • Scout-themed ASCII art elements');
    console.log();
    console.log(chalk.blue('🌐 Opening dashboard at http://localhost:3000/woodbadge-dashboard'));
    console.log(chalk.gray('(In a real implementation, this would open your browser)'));
  }

  async connectCommunity(options) {
    console.log(WB_COLORS.accent.bold('🤝 Connecting to Wood Badge Community...'));
    console.log();

    if (options.slack) {
      console.log(chalk.blue('💬 Opening Slack workspace...'));
      console.log('  Channels:');
      console.log('    • #wb-training-2025 - General discussion');
      console.log('    • #wb-dashboard - Progress updates');
      console.log('    • #wb-resources - Shared materials');
      console.log('    • #wb-eagle-patrol - Your patrol discussions');
      console.log();
    }

    if (options.discord) {
      console.log(chalk.purple('🎮 Opening Discord server...'));
      console.log('  Wood Badge Staff Community:');
      console.log('    • 📢 announcements');
      console.log('    • 💬 general-discussion');
      console.log('    • 📚 training-resources');
      console.log('    • 🎯 quest-help');
      console.log('    • 🦅 eagle-patrol');
      console.log('    • 🔊 staff-meetings (voice)');
      console.log();
    }

    if (!options.slack && !options.discord) {
      console.log('Available community platforms:');
      console.log(chalk.blue('  --slack    Connect to Slack workspace'));
      console.log(chalk.purple('  --discord  Connect to Discord server'));
      console.log();
      console.log('Example: mycli wb-connect --slack --discord');
    }

    console.log(chalk.gray('💡 These platforms provide ongoing support and community'));
    console.log(chalk.gray('   building beyond the formal training period.'));
  }
}

// Export the commands for integration with main CLI
module.exports = { WoodBadgeCommands, WOOD_BADGE_ASCII, WB_COLORS };