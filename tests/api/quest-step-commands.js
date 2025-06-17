/**
 * Enhanced Quest Step Commands for myMCP CLI
 * Add these commands to the existing CLI to support step-by-step quest progression
 */

// Add these new commands to the existing CLI

// Quest Steps command - view detailed step information
program
  .command('quest-steps')
  .description('View detailed steps for the active quest')
  .action(async () => {
    const questsData = await getQuests();
    if (!questsData) return;
    
    if (!questsData.active) {
      console.log(chalk.yellow('⚠️  No active quest. Start a quest first with "mycli start-quest"'));
      return;
    }
    
    const quest = questsData.active;
    console.log(chalk.bold.blue(`🗡️  Quest: ${quest.title}`));
    console.log(chalk.gray(quest.description));
    console.log(chalk.gray('─'.repeat(50)));
    
    quest.steps.forEach((step: any, index: number) => {
      const stepNumber = index + 1;
      const status = step.completed ? chalk.green('✅ COMPLETED') : chalk.yellow('⏳ PENDING');
      const icon = step.completed ? '✅' : '🔲';
      
      console.log(`${icon} Step ${stepNumber}: ${step.description}`);
      console.log(`   Status: ${status}`);
      console.log(`   ID: ${chalk.gray(step.id)}`);
      console.log();
    });
    
    const completedSteps = quest.steps.filter((s: any) => s.completed).length;
    const totalSteps = quest.steps.length;
    const progressBar = '█'.repeat(Math.floor((completedSteps / totalSteps) * 20)) + 
                       '░'.repeat(20 - Math.floor((completedSteps / totalSteps) * 20));
    
    console.log(chalk.cyan(`📊 Progress: [${progressBar}] ${completedSteps}/${totalSteps} steps`));
    
    if (completedSteps === totalSteps) {
      console.log(chalk.green('🎉 All steps completed! Use "mycli complete-quest" to finish the quest.'));
    } else {
      const nextStep = quest.steps.find((s: any) => !s.completed);
      if (nextStep) {
        console.log(chalk.yellow(`🎯 Next: ${nextStep.description}`));
        console.log(chalk.gray(`   Complete with: mycli complete-step ${nextStep.id}`));
      }
    }
  });

// Complete Step command - mark a specific step as completed
program
  .command('complete-step')
  .description('Mark a quest step as completed')
  .argument('[stepId]', 'ID of the step to complete')
  .action(async (stepId) => {
    const questsData = await getQuests();
    if (!questsData) return;
    
    if (!questsData.active) {
      console.log(chalk.yellow('⚠️  No active quest. Start a quest first.'));
      return;
    }
    
    if (!stepId) {
      console.log(chalk.blue('🔲 Available steps to complete:'));
      console.log(chalk.gray('─'.repeat(30)));
      
      questsData.active.steps.forEach((step: any, index: number) => {
        const stepNumber = index + 1;
        const status = step.completed ? chalk.green('✅ DONE') : chalk.yellow('⏳ PENDING');
        console.log(`${stepNumber}. ${step.description} (${step.id})`);
        console.log(`   Status: ${status}`);
        console.log();
      });
      
      console.log(chalk.gray('Usage: mycli complete-step <stepId>'));
      console.log(chalk.gray('   e.g: mycli complete-step find-allies'));
      return;
    }
    
    // Find the step
    const step = questsData.active.steps.find((s: any) => s.id === stepId);
    if (!step) {
      console.log(chalk.red(`❌ Step "${stepId}" not found in active quest.`));
      console.log(chalk.gray('Use "mycli quest-steps" to see available steps.'));
      return;
    }
    
    if (step.completed) {
      console.log(chalk.yellow(`⚠️  Step "${step.description}" is already completed.`));
      return;
    }
    
    // Complete the step via API
    const result = await executeGameAction('COMPLETE_QUEST_STEP', { stepId });
    if (!result) return;
    
    console.log(chalk.green('🎉 Step Completed!'));
    console.log(chalk.cyan(`✅ ${step.description}`));
    console.log(chalk.gray(`   Step ID: ${stepId}`));
    
    // Show updated progress
    const updatedQuests = await getQuests();
    if (updatedQuests && updatedQuests.active) {
      const completedSteps = updatedQuests.active.steps.filter((s: any) => s.completed).length;
      const totalSteps = updatedQuests.active.steps.length;
      console.log(chalk.cyan(`📊 Progress: ${completedSteps}/${totalSteps} steps completed`));
      
      if (completedSteps === totalSteps) {
        console.log(chalk.green('🏆 All steps completed! Ready to finish the quest!'));
        console.log(chalk.gray('   Use: mycli complete-quest'));
      } else {
        const nextStep = updatedQuests.active.steps.find((s: any) => !s.completed);
        if (nextStep) {
          console.log(chalk.yellow(`🎯 Next step: ${nextStep.description}`));
        }
      }
    }
  });

// Complete Quest command - finish the entire quest
program
  .command('complete-quest')
  .description('Complete the active quest (all steps must be finished)')
  .action(async () => {
    const questsData = await getQuests();
    if (!questsData) return;
    
    if (!questsData.active) {
      console.log(chalk.yellow('⚠️  No active quest to complete.'));
      return;
    }
    
    const quest = questsData.active;
    const completedSteps = quest.steps.filter((s: any) => s.completed).length;
    const totalSteps = quest.steps.length;
    
    if (completedSteps < totalSteps) {
      console.log(chalk.yellow(`⚠️  Quest not ready for completion: ${completedSteps}/${totalSteps} steps completed`));
      console.log(chalk.gray('Complete all steps first with "mycli complete-step <stepId>"'));
      
      const remainingSteps = quest.steps.filter((s: any) => !s.completed);
      console.log(chalk.blue('🔲 Remaining steps:'));
      remainingSteps.forEach((step: any) => {
        console.log(chalk.gray(`   • ${step.description} (${step.id})`));
      });
      return;
    }
    
    // Complete the quest via API
    const result = await executeGameAction('COMPLETE_QUEST', {});
    if (!result) return;
    
    console.log(chalk.green('🎊 QUEST COMPLETED! 🎊'));
    console.log(chalk.cyan(`🏆 ${quest.title}`));
    console.log(chalk.yellow(`⭐ Reward: +${quest.reward.score} points`));
    
    if (quest.reward.items && quest.reward.items.length > 0) {
      console.log(chalk.blue(`🎁 Items received: ${quest.reward.items.join(', ')}`));
    }
    
    // Show updated status
    const updatedState = await getPlayerState();
    if (updatedState) {
      console.log(chalk.magenta(`🎯 New level: ${updatedState.player.level}`));
      console.log(chalk.cyan(`📊 Total score: ${updatedState.player.score} points`));
    }
    
    console.log(chalk.gray('🗡️  Ready for your next quest! Use "mycli start-quest" to continue.'));
  });

// Current Step command - show what to do next
program
  .command('current-step')
  .alias('next')
  .description('Show the current/next step to complete')
  .action(async () => {
    const questsData = await getQuests();
    if (!questsData) return;
    
    if (!questsData.active) {
      console.log(chalk.yellow('⚠️  No active quest.'));
      console.log(chalk.gray('Start a quest: mycli start-quest'));
      return;
    }
    
    const quest = questsData.active;
    const nextStep = quest.steps.find((s: any) => !s.completed);
    
    if (!nextStep) {
      console.log(chalk.green('🎉 All steps completed!'));
      console.log(chalk.gray('Complete the quest: mycli complete-quest'));
      return;
    }
    
    const stepIndex = quest.steps.findIndex((s: any) => s.id === nextStep.id) + 1;
    const totalSteps = quest.steps.length;
    const completedSteps = quest.steps.filter((s: any) => s.completed).length;
    
    console.log(chalk.bold.blue(`🎯 Current Step (${stepIndex}/${totalSteps})`));
    console.log(chalk.gray('─'.repeat(30)));
    console.log(chalk.cyan(nextStep.description));
    console.log(chalk.gray(`Step ID: ${nextStep.id}`));
    console.log();
    console.log(chalk.yellow(`📊 Progress: ${completedSteps}/${totalSteps} steps completed`));
    console.log(chalk.gray(`Complete with: mycli complete-step ${nextStep.id}`));
  });

// Quest Progress command - show detailed progress
program
  .command('quest-progress')
  .alias('progress')
  .description('Show detailed quest progress and statistics')
  .action(async () => {
    const questsData = await getQuests();
    if (!questsData) return;
    
    console.log(chalk.bold.blue('📊 Quest Progress Report'));
    console.log(chalk.gray('─'.repeat(40)));
    
    // Active quest progress
    if (questsData.active) {
      const quest = questsData.active;
      const completedSteps = quest.steps.filter((s: any) => s.completed).length;
      const totalSteps = quest.steps.length;
      const progressPercent = Math.round((completedSteps / totalSteps) * 100);
      
      console.log(chalk.green(`⚔️  Active: ${quest.title}`));
      console.log(chalk.cyan(`📈 Progress: ${progressPercent}% (${completedSteps}/${totalSteps} steps)`));
      console.log(chalk.yellow(`🎁 Potential Reward: ${quest.reward.score} points`));
      
      if (completedSteps === totalSteps) {
        console.log(chalk.green('✅ Ready to complete!'));
      } else {
        const nextStep = quest.steps.find((s: any) => !s.completed);
        console.log(chalk.blue(`🎯 Next: ${nextStep ? nextStep.description : 'Unknown'}`));
      }
      console.log();
    }
    
    // Overall statistics
    console.log(chalk.yellow(`📋 Available Quests: ${questsData.available.length}`));
    console.log(chalk.green(`✅ Completed Quests: ${questsData.completed.length}`));
    
    if (questsData.completed.length > 0) {
      const totalRewards = questsData.completed.reduce((sum: number, quest: any) => 
        sum + quest.reward.score, 0);
      console.log(chalk.magenta(`🏆 Total Quest Rewards: ${totalRewards} points`));
    }
  });
