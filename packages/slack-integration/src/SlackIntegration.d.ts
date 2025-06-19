interface SlackConfig {
    botToken: string;
    appToken: string;
    signingSecret: string;
    defaultChannel: string;
    dashboardChannel?: string;
    redisUrl?: string;
    engineUrl?: string;
}
export declare class SlackIntegration {
    private app;
    private webClient;
    private redis;
    private sub;
    private config;
    private playerCache;
    private dashboardMessageTs?;
    constructor(config: SlackConfig);
    private setupEventHandlers;
    private handleGameEvent;
    private postChatMessage;
    private postQuestUpdate;
    private postLevelUpNotification;
    private postAchievementNotification;
    private postLocationUpdate;
    private setupSlackCommands;
    private handleStatusCommand;
    private handleLeaderboardCommand;
    private handleQuestCommand;
    private handleChatCommand;
    private handleHelpCommand;
    private setupScheduledTasks;
    private updateDashboard;
    private generateActivityChart;
    private postDailySummary;
    private getPlayerInfo;
    private updatePlayerCache;
    private getAllPlayers;
    private getAvailableQuests;
    private forwardToGameEngine;
    private sendGameMessage;
    private startQuestForUser;
    start(): Promise<void>;
    stop(): Promise<void>;
}
export {};
