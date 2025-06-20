import axios from 'axios';
import chalk from 'chalk';
import { MultiTierParticipationSystem } from '../../engine/src/features/multi-tier-participation';
import { DMRotationSystem } from '../../engine/src/features/dm-rotation';

interface DemoConfig {
  engineUrl: string;
  redisUrl: string;
  slackToken?: string;
  demoId: string;
}

export class DemoCommands {
  private config: DemoConfig;
  private participationSystem: MultiTierParticipationSystem;
  private dmSystem: DMRotationSystem;

  constructor(config: DemoConfig) {
    this.config = config;
    this.participationSystem = new MultiTierParticipationSystem(config.redisUrl, config.demoId);
    this.dmSystem = new DMRotationSystem(config.redisUrl, config.demoId);
  }

  async startDemo(): Promise<void> {
    try {
      console.log(chalk.green('🎮 Starting Lunch & Learn Demo...'));
      
      // Start both systems
      await Promise.all([
        this.participationSystem.startDemo(),
        this.dmSystem.startDemo()
      ]);

      console.log(chalk.green('✅ Demo started successfully!'));
      console.log(chalk.cyan('📊 Dashboard: https://demo.mymcp.dev/dashboard'));
      console.log(chalk.cyan('💬 Slack: #mymcp-lunch-learn'));
      console.log(chalk.yellow('⏰ Duration: 45 minutes'));
      
      // Display initial state
      await this.showStatus();
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to start demo:'), error);
      throw error;
    }
  }

  async stopDemo(): Promise<void> {
    try {
      console.log(chalk.yellow('🛑 Stopping demo...'));
      
      await Promise.all([
        this.participationSystem.stopDemo(),
        this.dmSystem.endDemo()
      ]);

      console.log(chalk.green('✅ Demo stopped successfully!'));
      
      // Show final stats
      await this.showFinalStats();
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to stop demo:'), error);
      throw error;
    }
  }

  async showStatus(): Promise<void> {
    try {
      const state = await this.participationSystem.getDemoState();
      const dmState = await this.dmSystem.getCurrentState();
      const leaderboard = await this.participationSystem.getLeaderboard();
      const tierStats = await this.participationSystem.getTierStats();

      console.log(chalk.bold('\n📊 DEMO STATUS'));
      console.log(chalk.gray('─'.repeat(50)));
      
      // Current DM and Phase
      if (dmState.currentDM && dmState.currentPhase) {
        console.log(chalk.cyan(`🎭 Current DM: ${dmState.currentDM.name} ${dmState.currentDM.avatar}`));
        console.log(chalk.cyan(`📍 Phase: ${dmState.currentPhase.name}`));
        
        if (dmState.timeElapsed) {
          const minutes = Math.floor(dmState.timeElapsed / 60000);
          const seconds = Math.floor((dmState.timeElapsed % 60000) / 1000);
          console.log(chalk.yellow(`⏱️  Time Elapsed: ${minutes}:${seconds.toString().padStart(2, '0')}`));
        }
      }

      // Participant count
      console.log(chalk.green(`👥 Participants: ${state.participants_count || 0}`));
      
      // Tier statistics
      console.log(chalk.bold('\n🏆 TIER COMPLETION'));
      Object.entries(tierStats).forEach(([tier, count]) => {
        const percentage = state.participants_count > 0 
          ? Math.round((count as number / parseInt(state.participants_count)) * 100)
          : 0;
        const bar = '█'.repeat(Math.floor(percentage / 10));
        console.log(`${tier}: ${count} (${percentage}%) ${chalk.green(bar)}`);
      });

      // Leaderboard
      if (leaderboard.length > 0) {
        console.log(chalk.bold('\n🥇 LEADERBOARD (Top 5)'));
        leaderboard.slice(0, 5).forEach((participant, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
          console.log(`${medal} ${participant.name} (${participant.persona}) - ${participant.points} pts`);
        });
      }

      // Next transition
      if (dmState.nextTransition) {
        const timeToNext = dmState.nextTransition.estimatedTime - Date.now();
        const minutes = Math.floor(timeToNext / 60000);
        console.log(chalk.yellow(`\n⏭️  Next: ${dmState.nextTransition.phase.name} in ~${minutes} minutes`));
      }

    } catch (error) {
      console.error(chalk.red('❌ Failed to get status:'), error);
    }
  }

  async addParticipant(name: string, persona: string, slackUserId?: string, githubUsername?: string): Promise<void> {
    try {
      const participantId = await this.participationSystem.addParticipant({
        name,
        persona,
        slackUserId,
        githubUsername
      });

      console.log(chalk.green(`✅ Added participant: ${name} as ${persona}`));
      console.log(chalk.gray(`   Participant ID: ${participantId}`));
      
      if (slackUserId) {
        console.log(chalk.cyan(`💬 Slack integration enabled`));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to add participant:'), error);
    }
  }

  async completeTier(participantId: string, tierId: string): Promise<void> {
    try {
      const success = await this.participationSystem.completeTier(participantId, tierId);
      
      if (success) {
        const participant = await this.participationSystem.getParticipant(participantId);
        console.log(chalk.green(`✅ ${participant?.name} completed ${tierId}!`));
        
        // Check for achievements
        const achievements = await this.participationSystem.checkAchievements(participantId);
        if (achievements.length > 0) {
          console.log(chalk.yellow(`🏆 New achievements: ${achievements.join(', ')}`));
        }
      } else {
        console.log(chalk.yellow(`⚠️  Could not complete tier ${tierId}`));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to complete tier:'), error);
    }
  }

  async listParticipants(): Promise<void> {
    try {
      const participants = await this.participationSystem.getAllParticipants();
      
      if (participants.length === 0) {
        console.log(chalk.yellow('No participants yet.'));
        return;
      }

      console.log(chalk.bold('\n👥 PARTICIPANTS'));
      console.log(chalk.gray('─'.repeat(70)));
      
      participants.forEach(p => {
        const tierCount = p.completedTiers.length;
        const achievementCount = p.achievements.length;
        console.log(`${chalk.cyan(p.name)} (${p.persona}) - ${p.points} pts, ${tierCount} tiers, ${achievementCount} achievements`);
        
        if (p.completedTiers.length > 0) {
          console.log(chalk.gray(`  Completed: ${p.completedTiers.join(', ')}`));
        }
      });
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to list participants:'), error);
    }
  }

  async dmHandoff(newDMId: string, reason: string = 'Manual handoff'): Promise<void> {
    try {
      const success = await this.dmSystem.forceHandoff(newDMId, reason);
      
      if (success) {
        console.log(chalk.green(`✅ DM handoff completed`));
        const state = await this.dmSystem.getCurrentState();
        console.log(chalk.cyan(`🎭 New DM: ${state.currentDM?.name} ${state.currentDM?.avatar}`));
      } else {
        console.log(chalk.red('❌ DM handoff failed'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to perform DM handoff:'), error);
    }
  }

  async extendPhase(minutes: number): Promise<void> {
    try {
      const success = await this.dmSystem.extendCurrentPhase(minutes);
      
      if (success) {
        console.log(chalk.green(`✅ Extended current phase by ${minutes} minutes`));
        const state = await this.dmSystem.getCurrentState();
        console.log(chalk.cyan(`📍 Current phase: ${state.currentPhase?.name}`));
      } else {
        console.log(chalk.red('❌ Failed to extend phase'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to extend phase:'), error);
    }
  }

  async showFinalStats(): Promise<void> {
    try {
      const participants = await this.participationSystem.getAllParticipants();
      const tierStats = await this.participationSystem.getTierStats();
      const handoffHistory = await this.dmSystem.getHandoffHistory();

      console.log(chalk.bold('\n📊 FINAL DEMO STATISTICS'));
      console.log(chalk.gray('═'.repeat(60)));
      
      // Overall participation
      console.log(chalk.green(`👥 Total Participants: ${participants.length}`));
      console.log(chalk.green(`🔄 DM Handoffs: ${handoffHistory.length}`));
      
      // Tier completion rates
      console.log(chalk.bold('\n🎯 TIER COMPLETION RATES'));
      Object.entries(tierStats).forEach(([tier, count]) => {
        const percentage = participants.length > 0 
          ? Math.round((count as number / participants.length) * 100)
          : 0;
        console.log(`${tier}: ${count}/${participants.length} (${percentage}%)`);
      });

      // Top performers
      const topPerformers = participants
        .sort((a, b) => b.points - a.points)
        .slice(0, 3);
        
      if (topPerformers.length > 0) {
        console.log(chalk.bold('\n🏆 TOP PERFORMERS'));
        topPerformers.forEach((p, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
          console.log(`${medal} ${p.name} (${p.persona}) - ${p.points} points, ${p.completedTiers.length} tiers`);
        });
      }

      // Achievements summary
      const allAchievements = participants.flatMap(p => p.achievements);
      const achievementCounts = allAchievements.reduce((acc, achievement) => {
        acc[achievement] = (acc[achievement] || 0) + 1;
        return acc;
      }, {} as { [key: string]: number });

      if (Object.keys(achievementCounts).length > 0) {
        console.log(chalk.bold('\n🏅 ACHIEVEMENTS EARNED'));
        Object.entries(achievementCounts).forEach(([achievement, count]) => {
          console.log(`${achievement}: ${count} participants`);
        });
      }

      // Success metrics
      console.log(chalk.bold('\n✅ SUCCESS METRICS'));
      const tier5Plus = Object.entries(tierStats)
        .filter(([tier]) => parseInt(tier.replace('tier', '')) >= 5)
        .reduce((sum, [, count]) => sum + (count as number), 0);
      
      console.log(`Slack Engagement (Tier 5+): ${tier5Plus} participants`);
      console.log(`Advanced Participation (Tier 8+): ${(tierStats.tier8 || 0) + (tierStats.tier9 || 0)} participants`);
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to show final stats:'), error);
    }
  }

  async monitorDemo(): Promise<void> {
    console.log(chalk.cyan('🔍 Starting demo monitoring... (Press Ctrl+C to stop)'));
    
    let lastParticipantCount = 0;
    let lastLeaderboard: any[] = [];
    
    const monitor = setInterval(async () => {
      try {
        const state = await this.participationSystem.getDemoState();
        const leaderboard = await this.participationSystem.getLeaderboard();
        const participantCount = parseInt(state.participants_count || '0');
        
        // Alert on new participants
        if (participantCount > lastParticipantCount) {
          const newCount = participantCount - lastParticipantCount;
          console.log(chalk.green(`🆕 ${newCount} new participant(s) joined! Total: ${participantCount}`));
          lastParticipantCount = participantCount;
        }
        
        // Alert on leaderboard changes
        if (leaderboard.length > 0 && JSON.stringify(leaderboard) !== JSON.stringify(lastLeaderboard)) {
          const leader = leaderboard[0];
          console.log(chalk.yellow(`👑 Leader: ${leader.name} (${leader.points} points)`));
          lastLeaderboard = [...leaderboard];
        }
        
      } catch (error) {
        console.error(chalk.red('Monitor error:'), error);
      }
    }, 5000); // Check every 5 seconds

    // Listen for system events
    this.participationSystem.on('tier_completed', (event) => {
      console.log(chalk.green(`🎯 ${event.participant.name} completed ${event.tier.name}! (+${event.points} pts)`));
    });

    this.participationSystem.on('achievements_unlocked', (event) => {
      console.log(chalk.yellow(`🏆 ${event.participant.name} earned: ${event.achievements.join(', ')}`));
    });

    this.dmSystem.on('dm_handoff', (event) => {
      console.log(chalk.blue(`🔄 DM Handoff: ${event.fromDM} → ${event.toDM}`));
    });

    this.dmSystem.on('phase_started', (event) => {
      console.log(chalk.cyan(`▶️  Phase Started: ${event.phase.name}`));
    });

    // Cleanup on exit
    process.on('SIGINT', () => {
      clearInterval(monitor);
      console.log(chalk.yellow('\n🛑 Monitoring stopped'));
      process.exit(0);
    });
  }

  async cleanup(): Promise<void> {
    try {
      await Promise.all([
        this.participationSystem.cleanup(),
        this.dmSystem.cleanup()
      ]);
      console.log(chalk.green('✅ Demo cleanup completed'));
    } catch (error) {
      console.error(chalk.red('❌ Cleanup failed:'), error);
    }
  }
}

// CLI interface functions
export const demoCommands = {
  async start(options: any) {
    const config: DemoConfig = {
      engineUrl: options.engineUrl || 'http://localhost:3000',
      redisUrl: options.redisUrl || 'redis://localhost:6379',
      slackToken: options.slackToken,
      demoId: options.demoId || 'lunch-learn-demo'
    };
    
    const demo = new DemoCommands(config);
    await demo.startDemo();
  },

  async stop(options: any) {
    const config: DemoConfig = {
      engineUrl: options.engineUrl || 'http://localhost:3000',
      redisUrl: options.redisUrl || 'redis://localhost:6379',
      demoId: options.demoId || 'lunch-learn-demo'
    };
    
    const demo = new DemoCommands(config);
    await demo.stopDemo();
  },

  async status(options: any) {
    const config: DemoConfig = {
      engineUrl: options.engineUrl || 'http://localhost:3000',
      redisUrl: options.redisUrl || 'redis://localhost:6379',
      demoId: options.demoId || 'lunch-learn-demo'
    };
    
    const demo = new DemoCommands(config);
    await demo.showStatus();
  },

  async join(name: string, persona: string, options: any) {
    const config: DemoConfig = {
      engineUrl: options.engineUrl || 'http://localhost:3000',
      redisUrl: options.redisUrl || 'redis://localhost:6379',
      demoId: options.demoId || 'lunch-learn-demo'
    };
    
    const demo = new DemoCommands(config);
    await demo.addParticipant(name, persona, options.slack, options.github);
  },

  async complete(participantId: string, tierId: string, options: any) {
    const config: DemoConfig = {
      engineUrl: options.engineUrl || 'http://localhost:3000',
      redisUrl: options.redisUrl || 'redis://localhost:6379',
      demoId: options.demoId || 'lunch-learn-demo'
    };
    
    const demo = new DemoCommands(config);
    await demo.completeTier(participantId, tierId);
  },

  async participants(options: any) {
    const config: DemoConfig = {
      engineUrl: options.engineUrl || 'http://localhost:3000',
      redisUrl: options.redisUrl || 'redis://localhost:6379',
      demoId: options.demoId || 'lunch-learn-demo'
    };
    
    const demo = new DemoCommands(config);
    await demo.listParticipants();
  },

  async handoff(newDMId: string, options: any) {
    const config: DemoConfig = {
      engineUrl: options.engineUrl || 'http://localhost:3000',
      redisUrl: options.redisUrl || 'redis://localhost:6379',
      demoId: options.demoId || 'lunch-learn-demo'
    };
    
    const demo = new DemoCommands(config);
    await demo.dmHandoff(newDMId, options.reason);
  },

  async extend(minutes: number, options: any) {
    const config: DemoConfig = {
      engineUrl: options.engineUrl || 'http://localhost:3000',
      redisUrl: options.redisUrl || 'redis://localhost:6379',
      demoId: options.demoId || 'lunch-learn-demo'
    };
    
    const demo = new DemoCommands(config);
    await demo.extendPhase(minutes);
  },

  async monitor(options: any) {
    const config: DemoConfig = {
      engineUrl: options.engineUrl || 'http://localhost:3000',
      redisUrl: options.redisUrl || 'redis://localhost:6379',
      demoId: options.demoId || 'lunch-learn-demo'
    };
    
    const demo = new DemoCommands(config);
    await demo.monitorDemo();
  },

  async cleanup(options: any) {
    const config: DemoConfig = {
      engineUrl: options.engineUrl || 'http://localhost:3000',
      redisUrl: options.redisUrl || 'redis://localhost:6379',
      demoId: options.demoId || 'lunch-learn-demo'
    };
    
    const demo = new DemoCommands(config);
    await demo.cleanup();
  }
};