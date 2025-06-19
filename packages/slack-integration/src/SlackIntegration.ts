import { App, Block, KnownBlock } from '@slack/bolt';
import { WebClient } from '@slack/web-api';
import Redis from 'ioredis';
import axios from 'axios';
import * as schedule from 'node-schedule';
import QuickChart from 'quickchart-js';

interface SlackConfig {
  botToken: string;
  appToken: string;
  signingSecret: string;
  defaultChannel: string;
  dashboardChannel?: string;
  redisUrl?: string;
  engineUrl?: string;
}

interface GameEvent {
  type: string;
  playerId: string;
  timestamp: number;
  data: any;
}

interface PlayerStats {
  playerId: string;
  name: string;
  level: string;
  score: number;
  currentQuest?: string;
  location: string;
  achievements: string[];
  lastActive: number;
}

export class SlackIntegration {
  private app: App;
  private webClient: WebClient;
  private redis: Redis;
  private sub: Redis;
  private config: SlackConfig;
  private playerCache: Map<string, PlayerStats> = new Map();
  private dashboardMessageTs?: string;
  
  constructor(config: SlackConfig) {
    this.config = {
      redisUrl: 'redis://localhost:6379',
      engineUrl: 'http://localhost:3000',
      ...config
    };

    // Initialize Slack app
    this.app = new App({
      token: this.config.botToken,
      appToken: this.config.appToken,
      signingSecret: this.config.signingSecret,
      socketMode: true
    });

    this.webClient = new WebClient(this.config.botToken);

    // Initialize Redis connections with proper error handling
    this.redis = new Redis(this.config.redisUrl!);
    this.sub = new Redis(this.config.redisUrl!);

    this.setupEventHandlers();
    this.setupSlackCommands();
    this.setupScheduledTasks();
  }

  private setupEventHandlers() {
    // Subscribe to game events
    this.sub.subscribe(
      'game:chat',
      'game:quest:started',
      'game:quest:completed',
      'game:player:levelup',
      'game:player:achievement',
      'game:player:location',
      'game:state:update'
    );

    this.sub.on('message', async (channel, message) => {
      try {
        const event: GameEvent = JSON.parse(message);
        await this.handleGameEvent(channel, event);
      } catch (error) {
        console.error('Error processing game event:', error);
      }
    });
  }

  private async handleGameEvent(channel: string, event: GameEvent) {
    switch (channel) {
      case 'game:chat':
        await this.postChatMessage(event);
        break;
      case 'game:quest:started':
        await this.postQuestUpdate(event, 'started');
        break;
      case 'game:quest:completed':
        await this.postQuestUpdate(event, 'completed');
        break;
      case 'game:player:levelup':
        await this.postLevelUpNotification(event);
        break;
      case 'game:player:achievement':
        await this.postAchievementNotification(event);
        break;
      case 'game:player:location':
        await this.postLocationUpdate(event);
        break;
      case 'game:state:update':
        await this.updatePlayerCache(event);
        break;
    }
  }

  private async postChatMessage(event: GameEvent) {
    const { playerId, data } = event;
    const player = await this.getPlayerInfo(playerId);
    
    await this.webClient.chat.postMessage({
      channel: this.config.defaultChannel,
      text: `${player.name}: ${data.message}`,
      blocks: [
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*${player.name}* (${player.level}) in _${player.location}_`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: data.message
          }
        }
      ]
    });
  }

  private async postQuestUpdate(event: GameEvent, status: 'started' | 'completed') {
    const { playerId, data } = event;
    const player = await this.getPlayerInfo(playerId);
    const emoji = status === 'started' ? '🎯' : '✅';
    
    await this.webClient.chat.postMessage({
      channel: this.config.defaultChannel,
      text: `${emoji} ${player.name} ${status} quest: ${data.questName}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *${player.name}* ${status} quest: *${data.questName}*`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `${data.description || 'No description available'}`
            }
          ]
        }
      ]
    });
  }

  private async postLevelUpNotification(event: GameEvent) {
    const { playerId, data } = event;
    const player = await this.getPlayerInfo(playerId);
    
    await this.webClient.chat.postMessage({
      channel: this.config.defaultChannel,
      text: `🎉 ${player.name} leveled up to ${data.newLevel}!`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🎉 *${player.name}* leveled up!`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Previous Level:*\n${data.oldLevel}`
            },
            {
              type: 'mrkdwn',
              text: `*New Level:*\n${data.newLevel}`
            }
          ]
        }
      ]
    });
  }

  private async postAchievementNotification(event: GameEvent) {
    const { playerId, data } = event;
    const player = await this.getPlayerInfo(playerId);
    
    await this.webClient.chat.postMessage({
      channel: this.config.defaultChannel,
      text: `🏆 ${player.name} earned achievement: ${data.achievement}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🏆 *${player.name}* earned a new achievement!`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${data.achievement}*\n${data.description || ''}`
          }
        }
      ]
    });
  }

  private async postLocationUpdate(event: GameEvent) {
    const { playerId, data } = event;
    const player = await this.getPlayerInfo(playerId);
    
    if (data.broadcast) {
      await this.webClient.chat.postMessage({
        channel: this.config.defaultChannel,
        text: `📍 ${player.name} moved to ${data.location}`,
        blocks: [
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `📍 *${player.name}* moved from _${data.from}_ to _${data.location}_`
              }
            ]
          }
        ]
      });
    }
  }

  private setupSlackCommands() {
    // Slash command: /mymcp
    this.app.command('/mymcp', async ({ command, ack, respond }: any) => {
      await ack();
      
      const args = command.text.split(' ');
      const action = args[0];
      
      switch (action) {
        case 'status':
          await this.handleStatusCommand(respond, args[1]);
          break;
        case 'leaderboard':
          await this.handleLeaderboardCommand(respond);
          break;
        case 'quest':
          await this.handleQuestCommand(respond, args.slice(1));
          break;
        case 'chat':
          await this.handleChatCommand(command.user_id, args.slice(1).join(' '), respond);
          break;
        case 'help':
        default:
          await this.handleHelpCommand(respond);
      }
    });

    // Message handler for direct game interaction
    this.app.message(async ({ message, say }: any) => {
      if (message.subtype) return; // Ignore bot messages
      
      const user = message.user;
      const text = (message as any).text;
      
      // Forward message to game engine
      await this.forwardToGameEngine(user, text, say);
    });

    // Interactive components
    this.app.action('start_quest', async ({ body, ack, respond }: any) => {
      await ack();
      const questId = (body as any).actions[0].value;
      await this.startQuestForUser((body as any).user.id, questId, respond);
    });
  }

  private async handleStatusCommand(respond: any, playerId?: string) {
    const targetPlayer = playerId || 'default';
    const player = await this.getPlayerInfo(targetPlayer);
    
    await respond({
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${player.name}'s Status`
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Level:* ${player.level}`
            },
            {
              type: 'mrkdwn',
              text: `*Score:* ${player.score}`
            },
            {
              type: 'mrkdwn',
              text: `*Location:* ${player.location}`
            },
            {
              type: 'mrkdwn',
              text: `*Current Quest:* ${player.currentQuest || 'None'}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Achievements:* ${player.achievements.length > 0 ? player.achievements.join(', ') : 'None yet'}`
          }
        }
      ]
    });
  }

  private async handleLeaderboardCommand(respond: any) {
    const players = await this.getAllPlayers();
    const sorted = players.sort((a, b) => b.score - a.score).slice(0, 10);
    
    const leaderboardBlocks: KnownBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🏆 Leaderboard'
        }
      }
    ];
    
    sorted.forEach((player, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      leaderboardBlocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${medal} *${player.name}* - ${player.score} points (${player.level})`
        }
      });
    });
    
    await respond({ blocks: leaderboardBlocks });
  }

  private async handleQuestCommand(respond: any, args: string[]) {
    if (args.length === 0 || args[0] === 'list') {
      // List available quests
      const quests = await this.getAvailableQuests();
      const questBlocks: KnownBlock[] = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '📜 Available Quests'
          }
        }
      ];
      
      quests.forEach(quest => {
        questBlocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${quest.name}*\n${quest.description}`
          },
          accessory: {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Start Quest'
            },
            value: quest.id,
            action_id: 'start_quest'
          }
        });
      });
      
      await respond({ blocks: questBlocks });
    }
  }

  private async handleChatCommand(userId: string, message: string, respond: any) {
    if (!message) {
      await respond('Please provide a message to send to the game.');
      return;
    }
    
    const response = await this.sendGameMessage(userId, message);
    await respond({
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: response
          }
        }
      ]
    });
  }

  private async handleHelpCommand(respond: any) {
    await respond({
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎮 myMCP Commands'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Available Commands:*'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '• `/mymcp status [player]` - View player status\n• `/mymcp leaderboard` - View top players\n• `/mymcp quest [list]` - View available quests\n• `/mymcp chat <message>` - Send message to game\n• `/mymcp help` - Show this help message'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: 'You can also chat directly in this channel to interact with the game!'
            }
          ]
        }
      ]
    });
  }

  private setupScheduledTasks() {
    // Update dashboard every 5 minutes
    if (this.config.dashboardChannel) {
      schedule.scheduleJob('*/5 * * * *', async () => {
        await this.updateDashboard();
      });
    }

    // Daily summary at 9 AM
    schedule.scheduleJob('0 9 * * *', async () => {
      await this.postDailySummary();
    });
  }

  private async updateDashboard() {
    const players = await this.getAllPlayers();
    const activePlayers = players.filter(p => Date.now() - p.lastActive < 3600000); // Active in last hour
    
    // Generate activity chart
    const chart = await this.generateActivityChart(players);
    
    const dashboardBlocks: KnownBlock[] = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📊 myMCP Live Dashboard'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Total Players:* ${players.length}`
          },
          {
            type: 'mrkdwn',
            text: `*Active Now:* ${activePlayers.length}`
          }
        ]
      },
      {
        type: 'image',
        image_url: chart,
        alt_text: 'Player activity chart'
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Last updated: <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`
          }
        ]
      }
    ];

    if (this.dashboardMessageTs) {
      // Update existing message
      await this.webClient.chat.update({
        channel: this.config.dashboardChannel!,
        ts: this.dashboardMessageTs,
        blocks: dashboardBlocks
      });
    } else {
      // Post new message
      const result = await this.webClient.chat.postMessage({
        channel: this.config.dashboardChannel!,
        blocks: dashboardBlocks
      });
      this.dashboardMessageTs = result.ts;
    }
  }

  private async generateActivityChart(players: PlayerStats[]): Promise<string> {
    const hourlyActivity = new Array(24).fill(0);
    const now = Date.now();
    
    players.forEach(player => {
      const hoursAgo = Math.floor((now - player.lastActive) / 3600000);
      if (hoursAgo < 24) {
        hourlyActivity[23 - hoursAgo]++;
      }
    });

    const chart = new QuickChart();
    chart.setConfig({
      type: 'line',
      data: {
        labels: Array.from({ length: 24 }, (_, i) => `${23 - i}h ago`),
        datasets: [{
          label: 'Active Players',
          data: hourlyActivity,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
    chart.setWidth(600);
    chart.setHeight(300);

    return chart.getUrl();
  }

  private async postDailySummary() {
    const players = await this.getAllPlayers();
    const yesterday = Date.now() - 86400000;
    const activePlayers = players.filter(p => p.lastActive > yesterday);
    
    // Calculate statistics
    const totalScore = players.reduce((sum, p) => sum + p.score, 0);
    const topPlayer = players.sort((a, b) => b.score - a.score)[0];
    
    await this.webClient.chat.postMessage({
      channel: this.config.defaultChannel,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '☀️ Daily myMCP Summary'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Active Players (24h):* ${activePlayers.length}`
            },
            {
              type: 'mrkdwn',
              text: `*Total Score:* ${totalScore}`
            },
            {
              type: 'mrkdwn',
              text: `*Top Player:* ${topPlayer?.name || 'None'}`
            },
            {
              type: 'mrkdwn',
              text: `*Top Score:* ${topPlayer?.score || 0}`
            }
          ]
        }
      ]
    });
  }

  // Helper methods
  private async getPlayerInfo(playerId: string): Promise<PlayerStats> {
    if (this.playerCache.has(playerId)) {
      return this.playerCache.get(playerId)!;
    }
    
    try {
      const response = await axios.get(`${this.config.engineUrl}/api/state/${playerId}`);
      const playerData: PlayerStats = {
        playerId,
        name: response.data.player?.name || 'Unknown',
        level: response.data.player?.level || 'apprentice',
        score: response.data.player?.score || 0,
        currentQuest: response.data.player?.currentQuest,
        location: response.data.player?.location || 'town',
        achievements: response.data.player?.achievements || [],
        lastActive: Date.now()
      };
      
      this.playerCache.set(playerId, playerData);
      return playerData;
    } catch (error) {
      return {
        playerId,
        name: 'Unknown',
        level: 'apprentice',
        score: 0,
        location: 'town',
        achievements: [],
        lastActive: Date.now()
      };
    }
  }

  private async updatePlayerCache(event: GameEvent) {
    const { playerId, data } = event;
    const existing = this.playerCache.get(playerId) || {} as PlayerStats;
    
    this.playerCache.set(playerId, {
      ...existing,
      ...data,
      playerId,
      lastActive: Date.now()
    });
  }

  private async getAllPlayers(): Promise<PlayerStats[]> {
    // Get all player IDs from Redis
    const playerIds = await this.redis.smembers('game:players');
    const players: PlayerStats[] = [];
    
    for (const playerId of playerIds) {
      const player = await this.getPlayerInfo(playerId);
      players.push(player);
    }
    
    return players;
  }

  private async getAvailableQuests(): Promise<any[]> {
    try {
      const response = await axios.get(`${this.config.engineUrl}/api/quests`);
      return response.data.available || [];
    } catch (error) {
      return [];
    }
  }

  private async forwardToGameEngine(userId: string, message: string, say: any) {
    try {
      const response = await axios.post(`${this.config.engineUrl}/api/chat`, {
        playerId: `slack-${userId}`,
        message
      });
      
      await say({
        text: response.data.response,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: response.data.response
            }
          }
        ]
      });
    } catch (error) {
      await say('Sorry, I couldn\'t process that message. Try again later.');
    }
  }

  private async sendGameMessage(userId: string, message: string): Promise<string> {
    try {
      const response = await axios.post(`${this.config.engineUrl}/api/chat`, {
        playerId: `slack-${userId}`,
        message
      });
      return response.data.response;
    } catch (error) {
      return 'Sorry, I couldn\'t send that message to the game.';
    }
  }

  private async startQuestForUser(userId: string, questId: string, respond: any) {
    try {
      const response = await axios.post(`${this.config.engineUrl}/api/actions/slack-${userId}`, {
        type: 'START_QUEST',
        payload: { questId }
      });
      
      await respond({
        text: `Quest started successfully!`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `✅ Quest started successfully!\n${response.data.message || ''}`
            }
          }
        ]
      });
    } catch (error) {
      await respond('Failed to start quest. Please try again.');
    }
  }

  async start() {
    await this.app.start();
    console.log('⚡️ Slack integration is running!');
    
    // Post startup message
    await this.webClient.chat.postMessage({
      channel: this.config.defaultChannel,
      text: '🚀 myMCP Slack integration is now online!',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🚀 *myMCP Slack integration is now online!*'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: 'Type `/mymcp help` to see available commands or just chat to interact with the game.'
            }
          ]
        }
      ]
    });
  }

  async stop() {
    await this.app.stop();
    this.redis.disconnect();
    this.sub.disconnect();
  }
}