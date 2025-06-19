"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackIntegration = void 0;
const bolt_1 = require("@slack/bolt");
const web_api_1 = require("@slack/web-api");
const ioredis_1 = __importDefault(require("ioredis"));
const axios_1 = __importDefault(require("axios"));
const schedule = __importStar(require("node-schedule"));
const quickchart_js_1 = __importDefault(require("quickchart-js"));
class SlackIntegration {
    constructor(config) {
        this.playerCache = new Map();
        this.config = {
            redisUrl: 'redis://localhost:6379',
            engineUrl: 'http://localhost:3000',
            ...config
        };
        // Initialize Slack app
        this.app = new bolt_1.App({
            token: this.config.botToken,
            appToken: this.config.appToken,
            signingSecret: this.config.signingSecret,
            socketMode: true
        });
        this.webClient = new web_api_1.WebClient(this.config.botToken);
        // Initialize Redis connections with proper error handling
        this.redis = new ioredis_1.default(this.config.redisUrl);
        this.sub = new ioredis_1.default(this.config.redisUrl);
        this.setupEventHandlers();
        this.setupSlackCommands();
        this.setupScheduledTasks();
    }
    setupEventHandlers() {
        // Subscribe to game events
        this.sub.subscribe('game:chat', 'game:quest:started', 'game:quest:completed', 'game:player:levelup', 'game:player:achievement', 'game:player:location', 'game:state:update');
        this.sub.on('message', async (channel, message) => {
            try {
                const event = JSON.parse(message);
                await this.handleGameEvent(channel, event);
            }
            catch (error) {
                console.error('Error processing game event:', error);
            }
        });
    }
    async handleGameEvent(channel, event) {
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
    async postChatMessage(event) {
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
    async postQuestUpdate(event, status) {
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
    async postLevelUpNotification(event) {
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
    async postAchievementNotification(event) {
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
    async postLocationUpdate(event) {
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
    setupSlackCommands() {
        // Slash command: /mymcp
        this.app.command('/mymcp', async ({ command, ack, respond }) => {
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
        this.app.message(async ({ message, say }) => {
            if (message.subtype)
                return; // Ignore bot messages
            const user = message.user;
            const text = message.text;
            // Forward message to game engine
            await this.forwardToGameEngine(user, text, say);
        });
        // Interactive components
        this.app.action('start_quest', async ({ body, ack, respond }) => {
            await ack();
            const questId = body.actions[0].value;
            await this.startQuestForUser(body.user.id, questId, respond);
        });
    }
    async handleStatusCommand(respond, playerId) {
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
    async handleLeaderboardCommand(respond) {
        const players = await this.getAllPlayers();
        const sorted = players.sort((a, b) => b.score - a.score).slice(0, 10);
        const leaderboardBlocks = [
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
    async handleQuestCommand(respond, args) {
        if (args.length === 0 || args[0] === 'list') {
            // List available quests
            const quests = await this.getAvailableQuests();
            const questBlocks = [
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
    async handleChatCommand(userId, message, respond) {
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
    async handleHelpCommand(respond) {
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
    setupScheduledTasks() {
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
    async updateDashboard() {
        const players = await this.getAllPlayers();
        const activePlayers = players.filter(p => Date.now() - p.lastActive < 3600000); // Active in last hour
        // Generate activity chart
        const chart = await this.generateActivityChart(players);
        const dashboardBlocks = [
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
                channel: this.config.dashboardChannel,
                ts: this.dashboardMessageTs,
                blocks: dashboardBlocks
            });
        }
        else {
            // Post new message
            const result = await this.webClient.chat.postMessage({
                channel: this.config.dashboardChannel,
                blocks: dashboardBlocks
            });
            this.dashboardMessageTs = result.ts;
        }
    }
    async generateActivityChart(players) {
        const hourlyActivity = new Array(24).fill(0);
        const now = Date.now();
        players.forEach(player => {
            const hoursAgo = Math.floor((now - player.lastActive) / 3600000);
            if (hoursAgo < 24) {
                hourlyActivity[23 - hoursAgo]++;
            }
        });
        const chart = new quickchart_js_1.default();
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
    async postDailySummary() {
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
    async getPlayerInfo(playerId) {
        if (this.playerCache.has(playerId)) {
            return this.playerCache.get(playerId);
        }
        try {
            const response = await axios_1.default.get(`${this.config.engineUrl}/api/state/${playerId}`);
            const playerData = {
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
        }
        catch (error) {
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
    async updatePlayerCache(event) {
        const { playerId, data } = event;
        const existing = this.playerCache.get(playerId) || {};
        this.playerCache.set(playerId, {
            ...existing,
            ...data,
            playerId,
            lastActive: Date.now()
        });
    }
    async getAllPlayers() {
        // Get all player IDs from Redis
        const playerIds = await this.redis.smembers('game:players');
        const players = [];
        for (const playerId of playerIds) {
            const player = await this.getPlayerInfo(playerId);
            players.push(player);
        }
        return players;
    }
    async getAvailableQuests() {
        try {
            const response = await axios_1.default.get(`${this.config.engineUrl}/api/quests`);
            return response.data.available || [];
        }
        catch (error) {
            return [];
        }
    }
    async forwardToGameEngine(userId, message, say) {
        try {
            const response = await axios_1.default.post(`${this.config.engineUrl}/api/chat`, {
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
        }
        catch (error) {
            await say('Sorry, I couldn\'t process that message. Try again later.');
        }
    }
    async sendGameMessage(userId, message) {
        try {
            const response = await axios_1.default.post(`${this.config.engineUrl}/api/chat`, {
                playerId: `slack-${userId}`,
                message
            });
            return response.data.response;
        }
        catch (error) {
            return 'Sorry, I couldn\'t send that message to the game.';
        }
    }
    async startQuestForUser(userId, questId, respond) {
        try {
            const response = await axios_1.default.post(`${this.config.engineUrl}/api/actions/slack-${userId}`, {
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
        }
        catch (error) {
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
exports.SlackIntegration = SlackIntegration;
//# sourceMappingURL=SlackIntegration.js.map