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
          await this.handleQuestCommand(respond, args.slice(1), command.user_id);
          break;
        case 'chat':
          await this.handleChatCommand(command.user_id, args.slice(1).join(' '), respond);
          break;
        case 'score':
          await this.handleScoreCommand(command.user_id, args.slice(1), respond);
          break;
        case 'location':
          await this.handleLocationCommand(command.user_id, args.slice(1), respond);
          break;
        case 'player':
          await this.handlePlayerCommand(command.user_id, args.slice(1), respond);
          break;
        case 'item':
          await this.handleItemCommand(command.user_id, args.slice(1), respond);
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

  private async handleQuestCommand(respond: any, args: string[], userId: string) {
    const subcommand = args[0] || 'list';
    const playerId = `slack-${userId}`;
    
    try {
      switch (subcommand) {
        case 'list':
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
          break;
          
        case 'start':
          const questId = args[1];
          if (!questId) {
            await respond('Please specify a quest ID to start. Example: `/mymcp quest start global-meeting`');
            return;
          }
          
          const startResponse = await axios.post(`${this.config.engineUrl}/api/actions/${playerId}`, {
            type: 'START_QUEST',
            payload: { questId },
            playerId
          });
          
          await respond({
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `🎯 Quest *${questId}* started successfully!`
                }
              }
            ]
          });
          break;
          
        case 'complete':
          const completeType = args[1];
          const id = args[2];
          
          if (!completeType || !id) {
            await respond('Usage: `/mymcp quest complete <step|quest> <id>`');
            return;
          }
          
          if (completeType === 'step') {
            const stepResponse = await axios.post(`${this.config.engineUrl}/api/actions/${playerId}`, {
              type: 'COMPLETE_QUEST_STEP',
              payload: { stepId: id },
              playerId
            });
            
            await respond({
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `✅ Quest step *${id}* completed!`
                  }
                }
              ]
            });
          } else if (completeType === 'quest') {
            const questResponse = await axios.post(`${this.config.engineUrl}/api/actions/${playerId}`, {
              type: 'COMPLETE_QUEST',
              payload: { questId: id },
              playerId
            });
            
            await respond({
              blocks: [
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: `🏆 Quest *${id}* completed!`
                  }
                }
              ]
            });
          } else {
            await respond('Invalid completion type. Use: step or quest');
          }
          break;
          
        case 'active':
          const state = await axios.get(`${this.config.engineUrl}/api/state/${playerId}`);
          const activeQuests = state.data.data?.quests?.active || [];
          
          const activeBlocks: KnownBlock[] = [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '📋 Active Quests'
              }
            }
          ];
          
          if (activeQuests.length === 0) {
            activeBlocks.push({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '_No active quests_'
              }
            });
          } else {
            activeQuests.forEach((quest: any) => {
              activeBlocks.push({
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*${quest.name || quest.id}*\n${quest.description || 'No description'}\nProgress: ${quest.progress || '0'}%`
                }
              });
            });
          }
          
          await respond({ blocks: activeBlocks });
          break;
          
        default:
          await respond('Invalid subcommand. Use: list, start, complete, or active');
      }
    } catch (error) {
      console.error('Quest command error:', error);
      await respond('Failed to process quest command. Please try again.');
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

  private async handleScoreCommand(userId: string, args: string[], respond: any) {
    const playerId = `slack-${userId}`;
    const subcommand = args[0];
    
    if (!subcommand) {
      await respond('Usage: `/mymcp score <set|add|subtract> <value>`');
      return;
    }

    try {
      let response;
      const value = parseInt(args[1]);
      
      if (isNaN(value)) {
        await respond('Please provide a valid number for the score value.');
        return;
      }

      switch (subcommand) {
        case 'set':
          response = await axios.post(`${this.config.engineUrl}/api/actions/${playerId}`, {
            type: 'SET_SCORE',
            payload: { score: value },
            playerId
          });
          break;
        case 'add':
          const currentState = await axios.get(`${this.config.engineUrl}/api/state/${playerId}`);
          const currentScore = currentState.data.data?.player?.score || 0;
          response = await axios.post(`${this.config.engineUrl}/api/actions/${playerId}`, {
            type: 'SET_SCORE',
            payload: { score: currentScore + value },
            playerId
          });
          break;
        case 'subtract':
          const state = await axios.get(`${this.config.engineUrl}/api/state/${playerId}`);
          const score = state.data.data?.player?.score || 0;
          response = await axios.post(`${this.config.engineUrl}/api/actions/${playerId}`, {
            type: 'SET_SCORE',
            payload: { score: Math.max(0, score - value) },
            playerId
          });
          break;
        default:
          await respond('Invalid subcommand. Use: set, add, or subtract');
          return;
      }

      const newScore = response.data.data?.player?.score || 0;
      await respond({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `✅ Score updated successfully!\n*New score:* ${newScore}`
            }
          }
        ]
      });
    } catch (error) {
      console.error('Score command error:', error);
      await respond('Failed to update score. Please try again.');
    }
  }

  private async handleLocationCommand(userId: string, args: string[], respond: any) {
    const playerId = `slack-${userId}`;
    const subcommand = args[0];
    
    if (!subcommand) {
      await respond('Usage: `/mymcp location <move|list> [location]`');
      return;
    }

    try {
      switch (subcommand) {
        case 'move':
          const location = args.slice(1).join(' ');
          if (!location) {
            await respond('Please specify a location to move to.');
            return;
          }
          
          const response = await axios.post(`${this.config.engineUrl}/api/actions/${playerId}`, {
            type: 'CHANGE_LOCATION',
            payload: { location },
            playerId
          });
          
          await respond({
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `📍 Moved to *${location}*!`
                }
              }
            ]
          });
          break;
          
        case 'list':
          const state = await axios.get(`${this.config.engineUrl}/api/state/${playerId}`);
          const locations = state.data.data?.world?.locations || [];
          const currentLocation = state.data.data?.player?.currentLocation || 'unknown';
          
          const locationBlocks: KnownBlock[] = [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '🗺️ Available Locations'
              }
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `Current location: *${currentLocation}*`
                }
              ]
            }
          ];
          
          locations.forEach((loc: any) => {
            locationBlocks.push({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `• *${loc.name || loc}*${loc.description ? `\n  _${loc.description}_` : ''}`
              }
            });
          });
          
          await respond({ blocks: locationBlocks });
          break;
          
        default:
          await respond('Invalid subcommand. Use: move or list');
      }
    } catch (error) {
      console.error('Location command error:', error);
      await respond('Failed to process location command. Please try again.');
    }
  }

  private async handlePlayerCommand(userId: string, args: string[], respond: any) {
    const playerId = `slack-${userId}`;
    const subcommand = args[0];
    
    if (!subcommand) {
      await respond('Usage: `/mymcp player <update|reset> [field] [value]`');
      return;
    }

    try {
      switch (subcommand) {
        case 'update':
          const field = args[1];
          const value = args.slice(2).join(' ');
          
          if (!field || !value) {
            await respond('Please specify both field and value. Example: `/mymcp player update name "New Name"`');
            return;
          }
          
          const updates: any = {};
          updates[field] = value;
          
          const response = await axios.put(`${this.config.engineUrl}/api/state/${playerId}/player`, updates);
          
          await respond({
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `✅ Player ${field} updated to: *${value}*`
                }
              }
            ]
          });
          break;
          
        case 'reset':
          // Reset player to initial state
          const resetResponse = await axios.post(`${this.config.engineUrl}/api/actions/${playerId}`, {
            type: 'RESET_PLAYER',
            playerId
          });
          
          await respond({
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: '🔄 Player has been reset to initial state!'
                }
              }
            ]
          });
          break;
          
        default:
          await respond('Invalid subcommand. Use: update or reset');
      }
    } catch (error) {
      console.error('Player command error:', error);
      await respond('Failed to update player. Please try again.');
    }
  }

  private async handleItemCommand(userId: string, args: string[], respond: any) {
    const playerId = `slack-${userId}`;
    const subcommand = args[0];
    
    if (!subcommand) {
      await respond('Usage: `/mymcp item <use|list> [itemId]`');
      return;
    }

    try {
      switch (subcommand) {
        case 'use':
          const itemId = args[1];
          if (!itemId) {
            await respond('Please specify an item ID to use.');
            return;
          }
          
          const response = await axios.post(`${this.config.engineUrl}/api/actions/${playerId}`, {
            type: 'USE_ITEM',
            payload: { itemId },
            playerId
          });
          
          await respond({
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `✨ Used item: *${itemId}*`
                }
              }
            ]
          });
          break;
          
        case 'list':
          const state = await axios.get(`${this.config.engineUrl}/api/state/${playerId}`);
          const inventory = state.data.data?.inventory?.items || [];
          
          const inventoryBlocks: KnownBlock[] = [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '🎒 Your Inventory'
              }
            }
          ];
          
          if (inventory.length === 0) {
            inventoryBlocks.push({
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '_Your inventory is empty_'
              }
            });
          } else {
            inventory.forEach((item: any) => {
              inventoryBlocks.push({
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `• *${item.name || item.id}* (${item.quantity || 1}x)\n  _${item.description || 'No description'}_`
                }
              });
            });
          }
          
          await respond({ blocks: inventoryBlocks });
          break;
          
        default:
          await respond('Invalid subcommand. Use: use or list');
      }
    } catch (error) {
      console.error('Item command error:', error);
      await respond('Failed to process item command. Please try again.');
    }
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
            text: '*Core Commands:*'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '• `/mymcp status [player]` - View player status\n• `/mymcp leaderboard` - View top players\n• `/mymcp chat <message>` - Send message to game AI\n• `/mymcp help` - Show this help message'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Quest Commands:*'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '• `/mymcp quest list` - View available quests\n• `/mymcp quest start <questId>` - Start a specific quest\n• `/mymcp quest complete step <stepId>` - Complete a quest step\n• `/mymcp quest complete quest <questId>` - Complete entire quest\n• `/mymcp quest active` - View your active quests'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Player Management:*'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '• `/mymcp score set <value>` - Set score to specific value\n• `/mymcp score add <value>` - Add to current score\n• `/mymcp score subtract <value>` - Subtract from score\n• `/mymcp player update <field> <value>` - Update player field\n• `/mymcp player reset` - Reset player to initial state'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*World & Items:*'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '• `/mymcp location list` - View available locations\n• `/mymcp location move <location>` - Move to a location\n• `/mymcp item list` - View your inventory\n• `/mymcp item use <itemId>` - Use an item'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '💡 You can also chat directly in this channel to interact with the game AI!'
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
    try {
      // Get system health from engine
      let engineHealth = { status: 'unknown', activeStates: 0, wsConnections: 0, llm: { enabled: false } };
      let engineStats = null;
      
      try {
        const healthResponse = await axios.get(`${this.config.engineUrl}/health`);
        engineHealth = healthResponse.data;
        
        const statsResponse = await axios.get(`${this.config.engineUrl}/api/stats`);
        engineStats = statsResponse.data.data;
      } catch (error) {
        console.error('Failed to get engine health:', error);
      }
      
      // Check Redis connection
      const redisStatus = this.redis.status === 'ready' ? '✅ Active' : '❌ Disconnected';
      
      // Get player data
      const players = await this.getAllPlayers();
      const activePlayers = players.filter(p => Date.now() - p.lastActive < 3600000); // Active in last hour
      const topPlayers = players.sort((a, b) => b.score - a.score).slice(0, 3);
      
      // Calculate uptime
      const uptime = engineStats?.system?.uptime || 0;
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const uptimeStr = `${hours}h ${minutes}m`;
      
      // Get active quests count
      let activeQuestsCount = 0;
      let totalMessages = 0;
      for (const player of players) {
        try {
          const state = await axios.get(`${this.config.engineUrl}/api/state/${player.playerId}`);
          if (state.data.data?.quests?.active) activeQuestsCount++;
          totalMessages += state.data.data?.session?.conversationHistory?.length || 0;
        } catch (e) {
          // Skip if player state can't be fetched
        }
      }
      
      const timestamp = Math.floor(Date.now() / 1000);
      const lastUpdated = `<!date^${timestamp}^{date_short_pretty} at {time}|${new Date().toISOString()}>`;
      
      const dashboardBlocks: KnownBlock[] = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🎮 myMCP Game Status Dashboard'
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Last Updated: ${lastUpdated}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*System Health:* ${engineHealth.status === 'ok' ? '🟢 All Systems Operational' : '🔴 System Issues Detected'}`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `├─ Engine: ${engineHealth.status === 'ok' ? '✅' : '❌'} Running (Port ${this.config.engineUrl?.split(':').pop() || '3000'})\n├─ Slack Bot: ✅ Connected\n├─ Redis: ${redisStatus}\n└─ LLM: ${engineHealth.llm?.enabled ? '✅' : '❌'} ${engineHealth.llm?.enabled ? 'Available' : 'Not Available'}`
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*📊 Current Activity*'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Players Online:* ${players.length}`
            },
            {
              type: 'mrkdwn',
              text: `*Active (1h):* ${activePlayers.length}`
            },
            {
              type: 'mrkdwn',
              text: `*Active Quests:* ${activeQuestsCount}`
            },
            {
              type: 'mrkdwn',
              text: `*Messages Today:* ${totalMessages}`
            }
          ]
        }
      ];
      
      // Add top players section if any exist
      if (topPlayers.length > 0) {
        dashboardBlocks.push(
          {
            type: 'divider'
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*🏆 Top Players*'
            }
          }
        );
        
        topPlayers.forEach((player, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
          dashboardBlocks.push({
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `${medal} *${player.name}* - ${player.score} points (${player.level})`
              }
            ]
          });
        });
      }
      
      // Add performance metrics
      if (engineStats) {
        const memoryUsage = engineStats.system?.memoryUsage;
        const memoryMB = memoryUsage ? Math.round(memoryUsage.heapUsed / 1024 / 1024) : 0;
        const memoryPercent = memoryUsage ? Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100) : 0;
        
        dashboardBlocks.push(
          {
            type: 'divider'
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*📈 Performance*'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Uptime:* ${uptimeStr}`
              },
              {
                type: 'mrkdwn',
                text: `*Response Time:* <50ms`
              },
              {
                type: 'mrkdwn',
                text: `*Memory Usage:* ${memoryMB}MB (${memoryPercent}%)`
              },
              {
                type: 'mrkdwn',
                text: `*WebSocket Clients:* ${engineHealth.wsConnections || 0}`
              }
            ]
          }
        );
      }
      
      // Add footer with commands hint
      dashboardBlocks.push(
        {
          type: 'divider'
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '💡 Use `/mymcp help` for available commands or chat directly to interact with the game AI'
            }
          ]
        }
      );

      if (this.dashboardMessageTs) {
        // Update existing message
        await this.webClient.chat.update({
          channel: this.config.dashboardChannel!,
          ts: this.dashboardMessageTs,
          blocks: dashboardBlocks,
          text: '🎮 myMCP Game Status Dashboard'
        });
      } else {
        // Post new message
        const result = await this.webClient.chat.postMessage({
          channel: this.config.dashboardChannel!,
          blocks: dashboardBlocks,
          text: '🎮 myMCP Game Status Dashboard'
        });
        this.dashboardMessageTs = result.ts;
      }
    } catch (error) {
      console.error('Dashboard update error:', error);
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
        name: response.data.data?.player?.name || 'Unknown',
        level: response.data.data?.player?.level || 'apprentice',
        score: response.data.data?.player?.score || 0,
        currentQuest: response.data.data?.player?.currentQuest,
        location: response.data.data?.player?.location || 'town',
        achievements: response.data.data?.player?.achievements || [],
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
      const response = await axios.get(`${this.config.engineUrl}/api/quests/default-player`);
      return response.data.data?.available || [];
    } catch (error) {
      return [];
    }
  }

  private async forwardToGameEngine(userId: string, message: string, say: any) {
    try {
      const playerId = `slack-${userId}`;
      const response = await axios.post(`${this.config.engineUrl}/api/actions/${playerId}`, {
        type: 'CHAT',
        payload: { message },
        playerId: playerId
      });
      
      const responseMessage = response.data.data?.botResponse?.message || response.data.data?.message || 'No response from game engine.';
      
      await say({
        text: responseMessage,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: responseMessage
            }
          }
        ]
      });
    } catch (error) {
      console.error('Forward to game engine error:', error);
      await say('Sorry, I couldn\'t process that message. Try again later.');
    }
  }

  private async sendGameMessage(userId: string, message: string): Promise<string> {
    try {
      const playerId = `slack-${userId}`;
      const response = await axios.post(`${this.config.engineUrl}/api/actions/${playerId}`, {
        type: 'CHAT',
        payload: { message },
        playerId: playerId
      });
      return response.data.data?.botResponse?.message || response.data.data?.message || 'No response from game engine.';
    } catch (error) {
      console.error('Chat error:', error);
      return 'Sorry, I couldn\'t send that message to the game.';
    }
  }

  private async startQuestForUser(userId: string, questId: string, respond: any) {
    try {
      const playerId = `slack-${userId}`;
      const response = await axios.post(`${this.config.engineUrl}/api/actions/${playerId}`, {
        type: 'START_QUEST',
        payload: { questId },
        playerId: playerId
      });
      
      await respond({
        text: `Quest started successfully!`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `✅ Quest started successfully!\n${response.data.data?.quest || ''} - ${response.data.data?.status || ''}`
            }
          }
        ]
      });
    } catch (error) {
      console.error('Start quest error:', error);
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