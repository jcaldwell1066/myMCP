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
Object.defineProperty(exports, "__esModule", { value: true });
const SlackIntegration_1 = require("./SlackIntegration");
const dotenv = __importStar(require("dotenv"));
// Load environment variables
dotenv.config();
// Slack integration configuration
const config = {
    botToken: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || '#mymcp-game',
    dashboardChannel: process.env.SLACK_DASHBOARD_CHANNEL || '#mymcp-dashboard',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    engineUrl: process.env.ENGINE_URL || 'http://localhost:3000'
};
// Validate required configuration
if (!config.botToken || !config.appToken || !config.signingSecret) {
    console.error('❌ Missing required Slack configuration!');
    console.error('Please set the following environment variables:');
    console.error('- SLACK_BOT_TOKEN');
    console.error('- SLACK_APP_TOKEN');
    console.error('- SLACK_SIGNING_SECRET');
    process.exit(1);
}
// Create and start Slack integration
const slackIntegration = new SlackIntegration_1.SlackIntegration(config);
async function start() {
    try {
        await slackIntegration.start();
        console.log('🎮 myMCP Slack Integration Started!');
        console.log(`📢 Default channel: ${config.defaultChannel}`);
        console.log(`📊 Dashboard channel: ${config.dashboardChannel}`);
        console.log(`🎯 Engine URL: ${config.engineUrl}`);
    }
    catch (error) {
        console.error('Failed to start Slack integration:', error);
        process.exit(1);
    }
}
// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⏹️ Shutting down Slack integration...');
    await slackIntegration.stop();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n⏹️ Shutting down Slack integration...');
    await slackIntegration.stop();
    process.exit(0);
});
// Start the integration
start();
//# sourceMappingURL=index.js.map