#!/usr/bin/env node

/**
 * Lodge E-Commerce Quest Demo
 * Demonstrates the enhanced quest step object model in action
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Load the quest definition
const questData = JSON.parse(fs.readFileSync(path.join(__dirname, 'lodge-ecommerce-quest.json'), 'utf8'));

// Import enhanced quest step utilities (simulated)
const { isEnhancedQuestStep, getStepPoints, getStepDifficulty } = require('../packages/cli/src/questStepTypes');

class LodgeQuestDemo {
  constructor() {
    this.quest = questData;
    this.currentStepIndex = 0;
  }

  /**
   * Display quest overview with enhanced metadata
   */
  showQuestOverview() {
    console.log(chalk.bold.blue('🏔️  Alpine Retreat E-Commerce Setup Quest'));
    console.log(chalk.gray('═'.repeat(60)));
    console.log(chalk.white(this.quest.description));
    console.log();
    
    // Quest-level metadata
    console.log(chalk.yellow('📊 Quest Metadata:'));
    console.log(chalk.gray(`   Difficulty: ${this.quest.difficulty}`));
    console.log(chalk.gray(`   Category: ${this.quest.category}`));
    console.log(chalk.gray(`   Estimated Time: ${this.quest.estimatedTime}`));
    console.log(chalk.gray(`   Total Points: ${this.quest.metadata.totalPoints} points`));
    console.log();
    
    // Skills and applications
    console.log(chalk.cyan('🎯 Skills You\'ll Learn:'));
    this.quest.metadata.skillsLearned.forEach(skill => {
      console.log(chalk.gray(`   • ${skill}`));
    });
    console.log();
    
    console.log(chalk.green('🌟 Real-World Applications:'));
    this.quest.metadata.realWorldApplications.forEach(app => {
      console.log(chalk.gray(`   • ${app}`));
    });
    console.log();
  }

  /**
   * Display detailed step information with enhanced features
   */
  showStepDetails(stepIndex) {
    const step = this.quest.steps[stepIndex];
    if (!step) {
      console.log(chalk.red('❌ Step not found'));
      return;
    }

    console.log(chalk.bold.blue(`📋 Step ${stepIndex + 1}: ${step.title}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.white(step.description));
    console.log();

    // Enhanced metadata display
    console.log(chalk.yellow('📊 Step Metadata:'));
    console.log(chalk.gray(`   Difficulty: ${this.getDifficultyDisplay(step.metadata.difficulty)}`));
    console.log(chalk.gray(`   Category: ${step.metadata.category}`));
    console.log(chalk.gray(`   Points: ${step.metadata.points}`));
    console.log(chalk.gray(`   Duration: ${step.metadata.estimatedDuration}`));
    console.log(chalk.gray(`   Real-World Skill: ${step.metadata.realWorldSkill}`));
    
    if (step.metadata.tags && step.metadata.tags.length > 0) {
      console.log(chalk.gray(`   Tags: ${step.metadata.tags.join(', ')}`));
    }
    
    if (step.metadata.prerequisites && step.metadata.prerequisites.length > 0) {
      console.log(chalk.gray(`   Prerequisites: ${step.metadata.prerequisites.join(', ')}`));
    }
    console.log();

    // Resources display
    if (step.resources && Object.keys(step.resources).length > 0) {
      console.log(chalk.cyan('📚 Available Resources:'));
      
      if (step.resources.docs && step.resources.docs.length > 0) {
        console.log(chalk.cyan('   Documentation:'));
        step.resources.docs.forEach(doc => {
          console.log(chalk.gray(`     • ${doc.title}: ${doc.description}`));
          if (doc.url) console.log(chalk.gray(`       URL: ${doc.url}`));
        });
      }
      
      if (step.resources.tools && step.resources.tools.length > 0) {
        console.log(chalk.cyan('   Tools:'));
        step.resources.tools.forEach(tool => {
          console.log(chalk.gray(`     • ${tool.name}: ${tool.description}`));
          if (tool.url) console.log(chalk.gray(`       URL: ${tool.url}`));
        });
      }
      
      if (step.resources.examples && step.resources.examples.length > 0) {
        console.log(chalk.cyan('   Examples:'));
        step.resources.examples.forEach(example => {
          console.log(chalk.gray(`     • ${example.name}: ${example.description}`));
        });
      }
      console.log();
    }

    // Execution details
    console.log(chalk.magenta('⚙️  Execution Details:'));
    console.log(chalk.gray(`   Type: ${step.execution.type}`));
    console.log(chalk.gray(`   Validation: ${step.execution.validation.type}`));
    
    if (step.execution.hints && step.execution.hints.length > 0) {
      console.log(chalk.yellow('   💡 Hints:'));
      step.execution.hints.forEach(hint => {
        console.log(chalk.gray(`     • ${hint}`));
      });
    }
    console.log();

    // Validation criteria
    console.log(chalk.green('✅ Success Criteria:'));
    step.execution.validation.criteria.forEach(criterion => {
      console.log(chalk.gray(`   • ${criterion}`));
    });
    console.log();

    // Progress tracking
    console.log(chalk.blue('📈 Progress Tracking:'));
    console.log(chalk.gray(`   Attempts: ${step.progress.attempts}`));
    console.log(chalk.gray(`   Notes: ${step.progress.notes.length} recorded`));
    console.log(chalk.gray(`   Artifacts: ${step.progress.artifacts.length} collected`));
    console.log();
  }

  /**
   * Simulate step execution with enhanced features
   */
  async simulateStepExecution(stepIndex) {
    const step = this.quest.steps[stepIndex];
    if (!step) {
      console.log(chalk.red('❌ Step not found'));
      return;
    }

    console.log(chalk.bold.yellow(`🚀 Launching Step: ${step.title}`));
    console.log(chalk.gray('─'.repeat(50)));

    // Show execution type
    switch (step.execution.type) {
      case 'manual':
        await this.simulateManualExecution(step);
        break;
      case 'automated':
        await this.simulateAutomatedExecution(step);
        break;
      case 'hybrid':
        await this.simulateHybridExecution(step);
        break;
      default:
        console.log(chalk.red(`❌ Unknown execution type: ${step.execution.type}`));
    }
  }

  /**
   * Simulate manual step execution
   */
  async simulateManualExecution(step) {
    console.log(chalk.blue('👤 Manual Execution Mode'));
    console.log(chalk.gray('This step requires human judgment and creativity.'));
    console.log();

    // Show resources
    if (step.resources.docs && step.resources.docs.length > 0) {
      console.log(chalk.cyan('📖 Opening documentation resources...'));
      await this.delay(1000);
    }

    if (step.resources.tools && step.resources.tools.length > 0) {
      console.log(chalk.cyan('🔧 Preparing tools and platforms...'));
      await this.delay(1500);
    }

    // Show validation criteria
    console.log(chalk.green('✅ Please complete the following deliverables:'));
    step.execution.validation.criteria.forEach((criterion, index) => {
      console.log(chalk.gray(`   ${index + 1}. ${criterion}`));
    });

    console.log();
    console.log(chalk.yellow('💡 Ready to begin work. Use the provided resources and hints.'));
  }

  /**
   * Simulate automated step execution
   */
  async simulateAutomatedExecution(step) {
    console.log(chalk.green('🤖 Automated Execution Mode'));
    console.log(chalk.gray('Running automated tests and validations...'));
    console.log();

    for (const criterion of step.execution.validation.criteria) {
      console.log(chalk.gray(`   Running: ${criterion}`));
      await this.delay(800);
      console.log(chalk.green(`   ✅ Passed`));
    }

    console.log();
    console.log(chalk.green('🎉 All automated validations passed!'));
  }

  /**
   * Simulate hybrid step execution
   */
  async simulateHybridExecution(step) {
    console.log(chalk.magenta('🔄 Hybrid Execution Mode'));
    console.log(chalk.gray('Combining automated guidance with manual work...'));
    console.log();

    if (step.execution.launcher && step.execution.launcher.phases) {
      console.log(chalk.cyan('📋 Guided Workflow:'));
      for (const [index, phase] of step.execution.launcher.phases.entries()) {
        console.log(chalk.gray(`   ${index + 1}. ${phase}`));
        await this.delay(500);
      }
      console.log();
    }

    console.log(chalk.yellow('🎯 Complete each phase, then run validation checks.'));
  }

  /**
   * Show quest progress summary
   */
  showProgressSummary() {
    const totalSteps = this.quest.steps.length;
    const completedSteps = this.quest.steps.filter(step => step.completed).length;
    const totalPoints = this.quest.steps.reduce((sum, step) => sum + step.metadata.points, 0);
    const earnedPoints = this.quest.steps
      .filter(step => step.completed)
      .reduce((sum, step) => sum + step.metadata.points, 0);

    console.log(chalk.bold.blue('📊 Quest Progress Summary'));
    console.log(chalk.gray('═'.repeat(40)));
    console.log(chalk.white(`Steps Completed: ${completedSteps}/${totalSteps}`));
    console.log(chalk.white(`Points Earned: ${earnedPoints}/${totalPoints}`));
    console.log(chalk.white(`Progress: ${Math.round((completedSteps / totalSteps) * 100)}%`));
    console.log();

    // Progress bar
    const progressBar = '█'.repeat(Math.floor((completedSteps / totalSteps) * 20)) + 
                       '░'.repeat(20 - Math.floor((completedSteps / totalSteps) * 20));
    console.log(chalk.cyan(`[${progressBar}]`));
    console.log();

    // Skills progress
    const skillsLearned = this.quest.steps
      .filter(step => step.completed)
      .flatMap(step => step.metadata.tags)
      .reduce((skills, tag) => {
        skills[tag] = (skills[tag] || 0) + 1;
        return skills;
      }, {});

    if (Object.keys(skillsLearned).length > 0) {
      console.log(chalk.green('🎯 Skills in Progress:'));
      Object.entries(skillsLearned).forEach(([skill, count]) => {
        console.log(chalk.gray(`   • ${skill}: ${count} steps completed`));
      });
    }
  }

  /**
   * Helper methods
   */
  getDifficultyDisplay(difficulty) {
    const displays = {
      easy: '🟢 Easy',
      medium: '🟡 Medium',
      hard: '🔴 Hard'
    };
    return displays[difficulty] || difficulty;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Interactive demo runner
   */
  async runDemo() {
    console.clear();
    console.log(chalk.bold.cyan('🎮 Enhanced Quest Step Object Model Demo'));
    console.log(chalk.gray('═'.repeat(60)));
    console.log();

    // Show quest overview
    this.showQuestOverview();
    
    console.log(chalk.yellow('Press Enter to continue...'));
    await this.waitForEnter();

    // Show first step details
    console.clear();
    this.showStepDetails(0);
    
    console.log(chalk.yellow('Press Enter to simulate step execution...'));
    await this.waitForEnter();

    // Simulate step execution
    await this.simulateStepExecution(0);
    
    console.log();
    console.log(chalk.yellow('Press Enter to view progress summary...'));
    await this.waitForEnter();

    // Show progress
    console.clear();
    this.showProgressSummary();

    console.log();
    console.log(chalk.green('🎉 Demo complete! The enhanced quest step object model provides:'));
    console.log(chalk.gray('   • Rich metadata for better organization'));
    console.log(chalk.gray('   • Comprehensive resource management'));
    console.log(chalk.gray('   • Flexible execution types'));
    console.log(chalk.gray('   • Advanced validation methods'));
    console.log(chalk.gray('   • Detailed progress tracking'));
  }

  waitForEnter() {
    return new Promise(resolve => {
      process.stdin.once('data', () => resolve());
    });
  }
}

// Run the demo if executed directly
if (require.main === module) {
  const demo = new LodgeQuestDemo();
  demo.runDemo().catch(console.error);
}

module.exports = LodgeQuestDemo;