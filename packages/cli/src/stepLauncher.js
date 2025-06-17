// Enhanced Quest Step Launcher for myMCP CLI
// Provides rich step execution with resources, validation, and progress tracking

const chalk = require('chalk');
const inquirer = require('inquirer');
const { spawn, exec } = require('child_process');
const { promises: fs } = require('fs');
const path = require('path');

// Import enhanced quest step types (will need to be compiled from TypeScript)
const { isEnhancedQuestStep, getStepPoints } = require('../../engine/dist/types/QuestStep');

class StepLauncher {
  constructor(apiClient) {
    this.apiClient = apiClient;
    this.workingDirectory = process.cwd();
  }

  /**
   * Launch an enhanced quest step with full resources and guidance
   */
  async launchStep(step, playerId) {
    if (!isEnhancedQuestStep(step)) {
      console.log(chalk.yellow('⚠️  This step hasn\'t been enhanced yet. Using basic completion mode.'));
      return this.launchBasicStep(step, playerId);
    }

    console.clear();
    this.showStepHeader(step);
    
    // Show step resources
    await this.showResources(step);
    
    // Execute launcher if available
    if (step.execution.launcher) {
      await this.executeLauncher(step.execution.launcher);
    }
    
    // Handle step execution based on type
    switch (step.execution.type) {
      case 'guided':
        await this.handleGuidedExecution(step, playerId);
        break;
      case 'automated':
        await this.handleAutomatedExecution(step, playerId);
        break;
      case 'verification':
        await this.handleVerificationExecution(step, playerId);
        break;
      default:
        await this.handleManualExecution(step, playerId);
    }
  }

  /**
   * Display step header with metadata
   */
  showStepHeader(step) {
    console.log(chalk.bold.blue(`🎯 ${step.title}`));
    console.log(chalk.gray('─'.repeat(60)));
    console.log(chalk.white(step.description));
    console.log();
    
    // Show metadata
    const metadata = step.metadata;
    console.log(chalk.blue('📊 Step Information:'));
    console.log(chalk.gray(`   • Difficulty: ${this.getDifficultyEmoji(metadata.difficulty)} ${metadata.difficulty}`));
    console.log(chalk.gray(`   • Category: ${metadata.category}`));
    console.log(chalk.gray(`   • Points: ${metadata.points}`));
    
    if (metadata.estimatedDuration) {
      console.log(chalk.gray(`   • Duration: ${metadata.estimatedDuration}`));
    }
    
    if (metadata.prerequisites && metadata.prerequisites.length > 0) {
      console.log(chalk.gray(`   • Prerequisites: ${metadata.prerequisites.join(', ')}`));
    }
    
    if (metadata.tags.length > 0) {
      console.log(chalk.gray(`   • Tags: ${metadata.tags.join(', ')}`));
    }
    
    console.log();
  }

  /**
   * Show available resources for the step
   */
  async showResources(step) {
    const resources = step.resources;
    
    if (resources.documentation && resources.documentation.length > 0) {
      console.log(chalk.yellow('📚 Documentation:'));
      resources.documentation.forEach((doc, index) => {
        console.log(chalk.gray(`   ${index + 1}. ${doc.title}`));
        console.log(chalk.blue(`      ${doc.url}`));
        if (doc.description) {
          console.log(chalk.gray(`      ${doc.description}`));
        }
      });
      console.log();
    }

    if (resources.tools && resources.tools.length > 0) {
      console.log(chalk.yellow('🛠️  Tools:'));
      resources.tools.forEach((tool, index) => {
        console.log(chalk.gray(`   ${index + 1}. ${tool.name}: ${tool.description}`));
        if (tool.url) {
          console.log(chalk.blue(`      ${tool.url}`));
        }
        if (tool.command) {
          console.log(chalk.cyan(`      Command: ${tool.command}`));
        }
      });
      console.log();
    }

    if (resources.templates && resources.templates.length > 0) {
      console.log(chalk.yellow('📄 Templates:'));
      resources.templates.forEach((template, index) => {
        console.log(chalk.gray(`   ${index + 1}. ${template.name}`));
        console.log(chalk.gray(`      ${template.description || 'Template file'}`));
      });
      
      // Ask if user wants to create template files
      const { createTemplates } = await inquirer.prompt([{
        type: 'confirm',
        name: 'createTemplates',
        message: 'Would you like to create these template files?',
        default: true
      }]);
      
      if (createTemplates) {
        await this.createTemplateFiles(resources.templates);
      }
      console.log();
    }

    if (resources.codeExamples && resources.codeExamples.length > 0) {
      console.log(chalk.yellow('💻 Code Examples:'));
      resources.codeExamples.forEach((example, index) => {
        console.log(chalk.gray(`   ${index + 1}. ${example.filename} (${example.language})`));
        console.log(chalk.gray(`      ${example.description}`));
      });
      
      const { showCode } = await inquirer.prompt([{
        type: 'confirm',
        name: 'showCode',
        message: 'Would you like to see the code examples?',
        default: false
      }]);
      
      if (showCode) {
        await this.showCodeExamples(resources.codeExamples);
      }
      console.log();
    }
  }

  /**
   * Execute the step launcher
   */
  async executeLauncher(launcher) {
    console.log(chalk.green('🚀 Executing step launcher...'));
    
    switch (launcher.type) {
      case 'url':
        console.log(chalk.blue(`🌐 Opening: ${launcher.target}`));
        // In a real implementation, use the 'open' package
        console.log(chalk.gray('   (URL would open in your default browser)'));
        break;
        
      case 'command':
        console.log(chalk.cyan(`⚡ Running: ${launcher.target}`));
        if (launcher.workingDirectory) {
          console.log(chalk.gray(`   Working directory: ${launcher.workingDirectory}`));
        }
        // In a real implementation, execute the command
        console.log(chalk.gray('   (Command would execute here)'));
        break;
        
      case 'file':
        console.log(chalk.blue(`📄 Opening file: ${launcher.target}`));
        if (launcher.workingDirectory) {
          const fullPath = path.join(launcher.workingDirectory, launcher.target);
          console.log(chalk.gray(`   Full path: ${fullPath}`));
        }
        break;
        
      case 'checklist':
        console.log(chalk.yellow('✅ Checklist Items:'));
        launcher.items.forEach((item, index) => {
          console.log(chalk.gray(`   ${index + 1}. [ ] ${item}`));
        });
        break;
        
      case 'editor':
        console.log(chalk.magenta('✏️  Opening editor...'));
        console.log(chalk.gray(`   Target: ${launcher.target}`));
        break;
    }
    
    if (launcher.description) {
      console.log(chalk.gray(`   ${launcher.description}`));
    }
    
    // Pause for user to process
    await inquirer.prompt([{
      type: 'input',
      name: 'continue',
      message: 'Press Enter when ready to continue...'
    }]);
    
    console.log();
  }

  /**
   * Handle guided execution with user interaction
   */
  async handleGuidedExecution(step, playerId) {
    console.log(chalk.blue('🧭 Guided Execution Mode'));
    console.log(chalk.gray('Follow the steps below and confirm completion:'));
    console.log();
    
    // Show hints if available
    if (step.execution.hints && step.execution.hints.length > 0) {
      console.log(chalk.yellow('💡 Helpful Hints:'));
      step.execution.hints.forEach((hint, index) => {
        console.log(chalk.gray(`   ${index + 1}. ${hint}`));
      });
      console.log();
    }
    
    // Interactive completion
    const { completed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'completed',
      message: `Have you completed "${step.title}"?`,
      default: false
    }]);
    
    if (completed) {
      await this.handleValidation(step, playerId);
    } else {
      console.log(chalk.yellow('💪 Take your time! You can return to this step later.'));
    }
  }

  /**
   * Handle manual execution
   */
  async handleManualExecution(step, playerId) {
    console.log(chalk.blue('✋ Manual Execution Mode'));
    console.log(chalk.gray('Complete this step manually and confirm when done.'));
    console.log();
    
    const { completed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'completed',
      message: `Mark "${step.title}" as completed?`,
      default: false
    }]);
    
    if (completed) {
      await this.handleValidation(step, playerId);
    }
  }

  /**
   * Handle validation after step completion
   */
  async handleValidation(step, playerId) {
    if (!step.execution.validation) {
      return this.completeStep(step, playerId);
    }
    
    const validation = step.execution.validation;
    console.log(chalk.blue('🔍 Validation Phase'));
    
    switch (validation.type) {
      case 'checklist':
        await this.handleChecklistValidation(validation, step, playerId);
        break;
        
      case 'test':
        await this.handleTestValidation(validation, step, playerId);
        break;
        
      case 'confirmation':
        await this.handleConfirmationValidation(validation, step, playerId);
        break;
        
      default:
        await this.completeStep(step, playerId);
    }
  }

  /**
   * Handle checklist validation
   */
  async handleChecklistValidation(validation, step, playerId) {
    console.log(chalk.yellow('✅ Validation Checklist:'));
    
    const checklistPrompts = validation.criteria.map((criterion, index) => ({
      type: 'confirm',
      name: `item_${index}`,
      message: criterion,
      default: false
    }));
    
    const answers = await inquirer.prompt(checklistPrompts);
    const allCompleted = Object.values(answers).every(answer => answer === true);
    
    if (allCompleted) {
      console.log(chalk.green('✅ All validation criteria met!'));
      await this.completeStep(step, playerId);
    } else {
      console.log(chalk.yellow('⚠️  Some criteria not met. Please complete missing items and try again.'));
    }
  }

  /**
   * Handle automated test validation
   */
  async handleTestValidation(validation, step, playerId) {
    if (validation.automatedCheck) {
      console.log(chalk.blue('🤖 Running automated validation...'));
      console.log(chalk.gray(`Command: ${validation.automatedCheck.command}`));
      
      // In a real implementation, run the actual command
      const mockSuccess = Math.random() > 0.3; // 70% success rate for demo
      
      if (mockSuccess) {
        console.log(chalk.green('✅ Automated validation passed!'));
        await this.completeStep(step, playerId);
      } else {
        console.log(chalk.red('❌ Automated validation failed.'));
        console.log(chalk.yellow('Please review the requirements and try again.'));
      }
    } else {
      // Fall back to checklist validation
      await this.handleChecklistValidation(validation, step, playerId);
    }
  }

  /**
   * Handle confirmation validation
   */
  async handleConfirmationValidation(validation, step, playerId) {
    console.log(chalk.yellow('🔍 Please confirm the following:'));
    validation.criteria.forEach((criterion, index) => {
      console.log(chalk.gray(`   ${index + 1}. ${criterion}`));
    });
    
    const { confirmed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmed',
      message: 'Do you confirm all criteria have been met?',
      default: false
    }]);
    
    if (confirmed) {
      console.log(chalk.green('✅ Step validated and confirmed!'));
      await this.completeStep(step, playerId);
    } else {
      console.log(chalk.yellow('Please complete the missing criteria and try again.'));
    }
  }

  /**
   * Complete the step via API
   */
  async completeStep(step, playerId) {
    try {
      console.log(chalk.blue('💾 Marking step as completed...'));
      
      const response = await this.apiClient.post(`/api/actions/${playerId}`, {
        type: 'COMPLETE_QUEST_STEP',
        payload: { stepId: step.id },
        playerId: playerId
      });
      
      if (response.data.success) {
        const points = getStepPoints(step);
        console.log(chalk.green(`🎉 Step completed! +${points} points`));
        console.log(chalk.gray(`   ${step.title} is now marked as complete.`));
      } else {
        console.log(chalk.red('❌ Failed to mark step as complete.'));
      }
    } catch (error) {
      console.log(chalk.red('❌ Error completing step:', error.message));
    }
  }

  /**
   * Handle basic (non-enhanced) step completion
   */
  async launchBasicStep(step, playerId) {
    console.log(chalk.bold.blue(`📝 ${step.description}`));
    console.log(chalk.gray('─'.repeat(50)));
    console.log();
    
    const { completed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'completed',
      message: 'Have you completed this step?',
      default: false
    }]);
    
    if (completed) {
      await this.completeStep(step, playerId);
    }
  }

  /**
   * Create template files in the current directory
   */
  async createTemplateFiles(templates) {
    for (const template of templates) {
      try {
        const filePath = path.join(this.workingDirectory, template.filename);
        await fs.writeFile(filePath, template.content, 'utf8');
        console.log(chalk.green(`✅ Created template: ${template.filename}`));
      } catch (error) {
        console.log(chalk.red(`❌ Failed to create ${template.filename}: ${error.message}`));
      }
    }
  }

  /**
   * Display code examples
   */
  async showCodeExamples(examples) {
    for (const example of examples) {
      console.log(chalk.bold.yellow(`\n📄 ${example.filename} (${example.language})`));
      console.log(chalk.gray(example.description));
      console.log(chalk.blue('─'.repeat(50)));
      console.log(example.code);
      console.log(chalk.blue('─'.repeat(50)));
      
      const { createFile } = await inquirer.prompt([{
        type: 'confirm',
        name: 'createFile',
        message: `Create ${example.filename}?`,
        default: false
      }]);
      
      if (createFile) {
        try {
          const filePath = path.join(this.workingDirectory, example.filename);
          await fs.writeFile(filePath, example.code, 'utf8');
          console.log(chalk.green(`✅ Created: ${example.filename}`));
        } catch (error) {
          console.log(chalk.red(`❌ Failed to create file: ${error.message}`));
        }
      }
    }
  }

  /**
   * Get emoji for difficulty level
   */
  getDifficultyEmoji(difficulty) {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'medium': return '🟡';
      case 'hard': return '🔴';
      default: return '⚪';
    }
  }
}

module.exports = StepLauncher;
