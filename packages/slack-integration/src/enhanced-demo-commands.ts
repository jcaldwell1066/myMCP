import { App, Block, KnownBlock } from '@slack/bolt';
import Redis from 'ioredis';
import axios from 'axios';

interface DemoConfig {
  botToken: string;
  appToken: string;
  signingSecret: string;
  demoChannel: string;
  redisUrl: string;
  engineUrl: string;
  demoId: string;
}

interface ParticipantInfo {
  id: string;
  name: string;
  slackUserId: string;
  persona: string;
  completedTiers: string[];
  points: number;
  achievements: string[];
}

export class DemoSlackCommands {
  private app: App;
  private redis: Redis;
  private config: DemoConfig;

  constructor(config: DemoConfig) {
    this.config = config;
    this.app = new App({
      token: config.botToken,
      appToken: config.appToken,
      signingSecret: config.signingSecret,
      socketMode: true
    });
    this.redis = new Redis(config.redisUrl);
    this.setupDemoCommands();
  }

  private setupDemoCommands() {
    // Enhanced demo-specific commands
    this.app.command('/demo-join', async ({ command, ack, respond }: any) => {
      await ack();
      const args = command.text.split(' ');
      const persona = args[0] || 'curious_observer';
      await this.handleDemoJoin(command.user_id, command.user_name, persona, respond);
    });

    this.app.command('/demo-status', async ({ command, ack, respond }: any) => {
      await ack();
      await this.handleDemoStatus(respond);
    });

    this.app.command('/demo-tier', async ({ command, ack, respond }: any) => {
      await ack();
      const args = command.text.split(' ');
      const tierId = args[0];
      await this.handleTierCompletion(command.user_id, tierId, respond);
    });

    this.app.command('/demo-leaderboard', async ({ command, ack, respond }: any) => {
      await ack();
      await this.handleLeaderboard(respond);
    });

    this.app.command('/demo-help', async ({ command, ack, respond }: any) => {
      await ack();
      await this.handleDemoHelp(respond);
    });

    // Interactive buttons for tier completion
    this.app.action('complete_tier', async ({ body, ack, respond }: any) => {
      await ack();
      const tierId = (body as any).actions[0].value;
      await this.handleTierCompletion((body as any).user.id, tierId, respond);
    });

    // Persona selection
    this.app.action('select_persona', async ({ body, ack, respond }: any) => {
      await ack();
      const persona = (body as any).actions[0].value;
      await this.handleDemoJoin((body as any).user.id, (body as any).user.name, persona, respond);
    });
  }

  private async handleDemoJoin(userId: string, userName: string, persona: string, respond: any) {
    try {
      // Check if user is already registered
      const existingParticipant = await this.getParticipantBySlackId(userId);
      
      if (existingParticipant) {
        await respond({
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `👋 Welcome back, *${existingParticipant.name}*! You're already registered as a *${existingParticipant.persona}*.`
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `🏆 Your progress: ${existingParticipant.completedTiers.length} tiers, ${existingParticipant.points} points`
              }
            }
          ]
        });
        return;
      }

      // Register new participant
      const participantData = {
        name: userName,
        slackUserId: userId,
        persona: persona,
        joinedAt: Date.now()
      };

      // Send to engine API
      const response = await axios.post(`${this.config.engineUrl}/api/demo/participants`, participantData);
      const participantId = response.data.participantId;

      // Store in Redis for quick lookup
      await this.redis.hset(`${this.config.demoId}:slack_participants`, userId, JSON.stringify({
        participantId,
        name: userName,
        persona
      }));

      await respond({
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎉 Welcome to the Lunch & Learn Demo!'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Great! You've joined as a *${persona}*. Let's get started with the multi-tier participation system!`
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Next Steps:*\n• Use `/demo-tier tier1` to mark Teams attendance\n• Try `/demo-status` to see your progress\n• Check `/demo-help` for all available commands'
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Complete Tier 1 (Teams)'
                },
                value: 'tier1',
                action_id: 'complete_tier',
                style: 'primary'
              },
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'View Leaderboard'
                },
                value: 'leaderboard',
                action_id: 'show_leaderboard'
              }
            ]
          }
        ]
      });

      // Automatically complete Tier 5 (Slack engagement)
      setTimeout(async () => {
        await this.completeTierForUser(participantId, 'tier5', 'automatic_slack_join');
      }, 1000);

    } catch (error) {
      console.error('Error joining demo:', error);
      await respond({
        text: '❌ Sorry, there was an error joining the demo. Please try again or contact the DM.',
        response_type: 'ephemeral'
      });
    }
  }

  private async handleDemoStatus(respond: any) {
    try {
      const demoState = await this.redis.hgetall(`${this.config.demoId}:state`);
      const leaderboard = await this.getLeaderboard();
      const tierStats = await this.getTierStats();

      const blocks: KnownBlock[] = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📊 Live Demo Status'
          }
        }
      ];

      // Current phase and DM
      if (demoState.current_dm && demoState.current_phase) {
        blocks.push({
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Current DM:*\n${demoState.current_dm}`
            },
            {
              type: 'mrkdwn',
              text: `*Phase:*\n${demoState.current_phase.replace('_', ' ')}`
            }
          ]
        });
      }

      // Participation stats
      const participantCount = demoState.participants_count || '0';
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `👥 *Participants:* ${participantCount}`
        }
      });

      // Tier completion visualization
      if (Object.keys(tierStats).length > 0) {
        const tierText = Object.entries(tierStats)
          .map(([tier, count]) => {
            const percentage = participantCount > 0 
              ? Math.round((count as number / parseInt(participantCount)) * 100)
              : 0;
            const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
            return `${tier}: ${count} (${percentage}%) ${bar}`;
          })
          .join('\n');

        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*🏆 Tier Progress:*\n\`\`\`${tierText}\`\`\``
          }
        });
      }

      // Top 3 leaderboard
      if (leaderboard.length > 0) {
        const topThree = leaderboard.slice(0, 3)
          .map((p, i) => {
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
            return `${medal} ${p.name} - ${p.points} pts (${p.completedTiers} tiers)`;
          })
          .join('\n');

        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*🏅 Top Performers:*\n${topThree}`
          }
        });
      }

      await respond({ blocks });

    } catch (error) {
      console.error('Error getting demo status:', error);
      await respond({
        text: '❌ Could not retrieve demo status. Please try again.',
        response_type: 'ephemeral'
      });
    }
  }

  private async handleTierCompletion(userId: string, tierId: string, respond: any) {
    try {
      const participant = await this.getParticipantBySlackId(userId);
      
      if (!participant) {
        await respond({
          text: '❌ You need to join the demo first! Use `/demo-join [persona-name]`',
          response_type: 'ephemeral'
        });
        return;
      }

      // Check if tier is valid
      const validTiers = ['tier1', 'tier2', 'tier3', 'tier4', 'tier5', 'tier6', 'tier7', 'tier8', 'tier9'];
      if (!validTiers.includes(tierId)) {
        await respond({
          text: `❌ Invalid tier. Valid tiers: ${validTiers.join(', ')}`,
          response_type: 'ephemeral'
        });
        return;
      }

      // Check if already completed
      if (participant.completedTiers.includes(tierId)) {
        await respond({
          text: `✅ You've already completed ${tierId}!`,
          response_type: 'ephemeral'
        });
        return;
      }

      // Complete the tier
      const success = await this.completeTierForUser(participant.id, tierId, 'manual_slack_command');
      
      if (success) {
        const tierNames = {
          tier1: 'Teams Attendance',
          tier2: 'Teams Screen Sharing', 
          tier3: 'Teams Speaking/Presenting',
          tier4: 'Teams Q&A Participation',
          tier5: 'Slack Channel Engagement',
          tier6: 'Redis State Inspection',
          tier7: 'GitHub Repository Interaction',
          tier8: 'Local Environment Setup',
          tier9: 'Active Development/Contribution'
        };

        const tierPoints = {
          tier1: 10, tier2: 15, tier3: 25, tier4: 30, tier5: 35,
          tier6: 50, tier7: 60, tier8: 100, tier9: 150
        };

        await respond({
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `🎉 Congratulations! You completed *${tierNames[tierId as keyof typeof tierNames]}*!`
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `+${tierPoints[tierId as keyof typeof tierPoints]} points! 🏆`
              }
            }
          ]
        });

        // Broadcast to channel if it's a significant tier
        if (['tier6', 'tier7', 'tier8', 'tier9'].includes(tierId)) {
          await this.broadcastAchievement(participant.name, tierNames[tierId as keyof typeof tierNames]);
        }

      } else {
        await respond({
          text: '❌ Could not complete tier. Please try again or contact the DM.',
          response_type: 'ephemeral'
        });
      }

    } catch (error) {
      console.error('Error completing tier:', error);
      await respond({
        text: '❌ Error completing tier. Please try again.',
        response_type: 'ephemeral'
      });
    }
  }

  private async handleLeaderboard(respond: any) {
    try {
      const leaderboard = await this.getLeaderboard();
      
      if (leaderboard.length === 0) {
        await respond({
          text: '📊 No participants yet! Use `/demo-join` to get started.',
          response_type: 'ephemeral'
        });
        return;
      }

      const blocks: KnownBlock[] = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🏆 Live Leaderboard'
          }
        }
      ];

      leaderboard.slice(0, 10).forEach((participant, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${medal} *${participant.name}* (${participant.persona})\n${participant.points} points • ${participant.completedTiers} tiers • ${participant.achievements} achievements`
          }
        });
      });

      await respond({ blocks });

    } catch (error) {
      console.error('Error getting leaderboard:', error);
      await respond({
        text: '❌ Could not retrieve leaderboard. Please try again.',
        response_type: 'ephemeral'
      });
    }
  }

  private async handleDemoHelp(respond: any) {
    await respond({
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎯 Demo Commands Help'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Getting Started:*\n`/demo-join [persona]` - Join the demo with your persona\n`/demo-help` - Show this help message'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Participation:*\n`/demo-tier [tier1-9]` - Mark tier completion\n`/demo-status` - View current demo status\n`/demo-leaderboard` - See current standings'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Available Personas:*\n• `devops_engineer` - Focus on infrastructure\n• `backend_developer` - APIs and architecture\n• `product_manager` - Strategy and communication\n• `qa_specialist` - Testing and quality\n• `curious_observer` - Learning and questions'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Tier Levels:*\n1-2: Teams participation\n3-4: Active engagement\n5: Slack activity (auto-completed)\n6-7: Technical exploration\n8-9: Development work'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '💡 Tip: Some tiers are auto-completed based on your actions! Just by using Slack commands, you\'ve already started earning points.'
            }
          ]
        }
      ]
    });
  }

  private async completeTierForUser(participantId: string, tierId: string, source: string): Promise<boolean> {
    try {
      const response = await axios.post(`${this.config.engineUrl}/api/demo/tiers/complete`, {
        participantId,
        tierId,
        source,
        timestamp: Date.now()
      });
      
      return response.data.success;
    } catch (error) {
      console.error('Error completing tier via API:', error);
      return false;
    }
  }

  private async getParticipantBySlackId(slackUserId: string): Promise<ParticipantInfo | null> {
    try {
      const participantData = await this.redis.hget(`${this.config.demoId}:slack_participants`, slackUserId);
      if (!participantData) return null;

      const participant = JSON.parse(participantData);
      
      // Get full participant data from engine
      const response = await axios.get(`${this.config.engineUrl}/api/demo/participants/${participant.participantId}`);
      return response.data.participant;
      
    } catch (error) {
      console.error('Error getting participant:', error);
      return null;
    }
  }

  private async getLeaderboard(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.config.engineUrl}/api/demo/leaderboard`);
      return response.data.leaderboard || [];
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  private async getTierStats(): Promise<{ [key: string]: number }> {
    try {
      const response = await axios.get(`${this.config.engineUrl}/api/demo/tier-stats`);
      return response.data.tierStats || {};
    } catch (error) {
      console.error('Error getting tier stats:', error);
      return {};
    }
  }

  private async broadcastAchievement(participantName: string, tierName: string) {
    try {
      await this.app.client.chat.postMessage({
        token: this.config.botToken,
        channel: this.config.demoChannel,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `🎉 *${participantName}* just completed *${tierName}*! 🚀`
            }
          }
        ]
      });
    } catch (error) {
      console.error('Error broadcasting achievement:', error);
    }
  }

  async start() {
    await this.app.start();
    console.log('🎮 Demo Slack commands are running!');
  }

  async stop() {
    await this.app.stop();
    await this.redis.disconnect();
    console.log('🛑 Demo Slack commands stopped');
  }
}