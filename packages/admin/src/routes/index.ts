import { Application, Request, Response } from 'express';
import { AdminDashboardService } from '../services/AdminDashboardService';
import { HealthMonitor } from '../services/HealthMonitor';
import { RedisQueryService } from '../services/RedisQueryService';
import { LeaderboardService } from '../services/LeaderboardService';
import { SystemMetricsService } from '../services/SystemMetricsService';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export interface Services {
  dashboard: AdminDashboardService;
  health: HealthMonitor;
  redis: RedisQueryService;
  leaderboard: LeaderboardService;
  metrics: SystemMetricsService;
}

export function setupRoutes(app: Application, services: Services) {
  // Health check
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  // Dashboard overview
  app.get('/api/dashboard', async (req: Request, res: Response) => {
    try {
      const data = await services.dashboard.getDashboardData();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
  });

  // System health
  app.get('/api/health', async (req: Request, res: Response) => {
    try {
      const health = await services.health.getSystemHealth();
      res.json(health);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch health data' });
    }
  });

  // Engine health
  app.get('/api/health/engines', async (req: Request, res: Response) => {
    try {
      const health = await services.health.getSystemHealth();
      res.json(health.engines);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch engine health' });
    }
  });

  // System metrics
  app.get('/api/metrics', async (req: Request, res: Response) => {
    try {
      const current = await services.metrics.getCurrentMetrics();
      res.json(current);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });

  app.get('/api/metrics/history', (req: Request, res: Response) => {
    try {
      const duration = req.query.duration ? parseInt(req.query.duration as string) : undefined;
      const history = services.metrics.getMetricsHistory(duration);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch metrics history' });
    }
  });

  app.get('/api/metrics/summary', (req: Request, res: Response) => {
    try {
      const summary = services.metrics.getMetricsSummary();
      res.json(summary);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch metrics summary' });
    }
  });

  // Leaderboard
  app.get('/api/leaderboard', async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const leaderboard = await services.leaderboard.getLeaderboard(limit, offset);
      res.json(leaderboard);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  app.get('/api/leaderboard/stats', async (req: Request, res: Response) => {
    try {
      const stats = await services.leaderboard.getLeaderboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch leaderboard stats' });
    }
  });

  app.get('/api/leaderboard/player/:playerId', async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const rank = await services.leaderboard.getPlayerRank(playerId);
      const around = await services.leaderboard.getLeaderboardAroundPlayer(playerId);
      res.json({ rank, around });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch player rank' });
    }
  });

  // Redis queries
  app.post('/api/redis/query', async (req: Request, res: Response) => {
    try {
      const { command, args = [] } = req.body;
      
      // Log Redis query execution
      services.dashboard.logEvent('info', 'redis', `Executing query: ${command}`, {
        command,
        argsCount: args.length
      });
      
      const result = await services.redis.executeQuery(command, args);
      res.json(result);
    } catch (error: any) {
      services.dashboard.logEvent('error', 'redis', `Query failed: ${req.body.command}`, {
        command: req.body.command,
        error: error.message
      });
      res.status(400).json({ error: error.message });
    }
  });

  app.get('/api/redis/keys', async (req: Request, res: Response) => {
    try {
      const pattern = (req.query.pattern as string) || '*';
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const keys = await services.redis.searchKeys(pattern, limit);
      res.json(keys);
    } catch (error) {
      res.status(500).json({ error: 'Failed to search keys' });
    }
  });

  app.get('/api/redis/key/:key', async (req: Request, res: Response) => {
    try {
      const { key } = req.params;
      const details = await services.redis.getKeyDetails(key);
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch key details' });
    }
  });

  app.get('/api/redis/stats', async (req: Request, res: Response) => {
    try {
      const stats = await services.redis.getRedisStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch Redis stats' });
    }
  });

  app.get('/api/redis/saved-queries', (req: Request, res: Response) => {
    try {
      const queries = services.redis.getSavedQueries();
      res.json(queries);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch saved queries' });
    }
  });

  app.post('/api/redis/saved-queries/:queryId', async (req: Request, res: Response) => {
    try {
      const { queryId } = req.params;
      const result = await services.redis.executeSavedQuery(queryId);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Players
  app.get('/api/players', async (req: Request, res: Response) => {
    try {
      const query = (req.query.q as string) || '';
      const players = await services.dashboard.searchPlayers(query);
      res.json(players);
    } catch (error) {
      res.status(500).json({ error: 'Failed to search players' });
    }
  });

  app.get('/api/players/:playerId', async (req: Request, res: Response) => {
    try {
      const { playerId } = req.params;
      const details = await services.dashboard.getPlayerDetails(playerId);
      if (!details) {
        return res.status(404).json({ error: 'Player not found' });
      }
      res.json(details);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch player details' });
    }
  });

  // Events
  app.get('/api/events', (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const events = services.dashboard.getRecentEvents(limit);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Export endpoints
  app.get('/api/export/leaderboard', async (req: Request, res: Response) => {
    try {
      const format = (req.query.format as 'json' | 'csv') || 'json';
      const data = await services.leaderboard.exportLeaderboard(format);
      
      res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=leaderboard.${format}`);
      res.send(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to export leaderboard' });
    }
  });

  app.get('/api/export/metrics', (req: Request, res: Response) => {
    try {
      const format = (req.query.format as 'json' | 'csv') || 'json';
      const data = services.metrics.exportMetrics(format);
      
      res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=metrics.${format}`);
      res.send(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to export metrics' });
    }
  });

  // Admin actions
  app.post('/api/admin/trigger-health-check', async (req: Request, res: Response) => {
    try {
      const health = await services.health.triggerHealthCheck();
      res.json(health);
    } catch (error) {
      res.status(500).json({ error: 'Failed to trigger health check' });
    }
  });

  app.post('/api/admin/clear-metrics-history', (req: Request, res: Response) => {
    try {
      services.metrics.clearHistory();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear metrics history' });
    }
  });

  app.post('/api/admin/clear-query-history', async (req: Request, res: Response) => {
    try {
      await services.redis.flushHistory();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to clear query history' });
    }
  });

  // API Proxy endpoint for testing engine APIs
  app.all('/api/proxy/*', async (req: Request, res: Response) => {
    try {
      const targetUrl = req.query.target as string;
      if (!targetUrl) {
        return res.status(400).json({ error: 'Target URL is required' });
      }

      // Extract the path after /api/proxy/
      const apiPath = req.params[0] || '';
      const fullUrl = `${targetUrl}/${apiPath}`;

      // Forward the request
      const response = await axios({
        method: req.method,
        url: fullUrl,
        data: req.body,
        headers: {
          'Content-Type': req.get('Content-Type') || 'application/json',
        },
        validateStatus: () => true, // Don't throw on non-2xx status
      });

      // Forward the response
      res.status(response.status).json(response.data);
    } catch (error: any) {
      console.error('Proxy error:', error.message);
      res.status(500).json({ 
        error: 'Proxy request failed', 
        message: error.message,
        target: req.query.target,
        path: req.params[0]
      });
    }
  });

  // CLI proxy endpoint for executing CLI commands
  app.post('/cli/execute', async (req: Request, res: Response) => {
    try {
      const { command, args = [], mode = 'simple', engineUrl = 'http://localhost:3001' } = req.body;
      
      if (!command) {
        return res.status(400).json({ 
          success: false, 
          error: 'Command is required' 
        });
      }

      // Sanitize command to prevent injection
      const allowedCommands = ['status', 'chat', 'health', 'quests', 'get-score', 
                              'start-quest', 'quest-steps', 'complete-step', 
                              'complete-quest', 'next', 'progress', 'history', 'help'];
      
      if (!allowedCommands.includes(command)) {
        services.dashboard.logEvent('warning', 'cli', `Blocked unauthorized command: ${command}`);
        return res.status(400).json({ 
          success: false, 
          error: `Command '${command}' is not allowed` 
        });
      }

      // Build the CLI command based on mode
      let cliPath: string;
      let cliArgs: string[] = [];
      
      if (mode === 'simple') {
        // Use simple-cli.js for basic commands
        cliPath = path.join(__dirname, '..', '..', '..', 'cli', 'src', 'simple-cli.js');
        cliArgs = [command, ...args];
      } else if (mode === 'full') {
        // Use the built TypeScript CLI
        cliPath = path.join(__dirname, '..', '..', '..', 'cli', 'dist', 'index.js');
        cliArgs = [command, ...args];
      } else {
        return res.status(400).json({ 
          success: false, 
          error: `Invalid mode '${mode}'. Use 'simple' or 'full'` 
        });
      }

      // Execute the command
      const fullCommand = `node ${cliPath} ${cliArgs.map(arg => 
        typeof arg === 'string' && arg.includes(' ') ? `"${arg}"` : arg
      ).join(' ')}`;
      
      console.log(`Executing CLI command: ${fullCommand} with engine: ${engineUrl}`);
      
      // Log the CLI command execution
      services.dashboard.logEvent('info', 'cli', `Executing command: ${command}`, {
        command,
        args,
        engineUrl,
        mode
      });
      
      const { stdout, stderr } = await execAsync(fullCommand, {
        env: { 
          ...process.env, 
          FORCE_COLOR: '1', // Preserve colors
          ENGINE_URL: engineUrl // Pass the selected engine URL
        },
        timeout: 30000 // 30 second timeout
      });

      // Log successful command execution
      services.dashboard.logEvent('info', 'cli', `Command completed: ${command}`, {
        command,
        success: true,
        hasOutput: !!stdout,
        hasError: !!stderr
      });

      res.json({
        success: true,
        command,
        args,
        mode,
        output: stdout,
        error: stderr,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('CLI execution error:', error);
      
      // Handle execution errors
      if (error.code === 'ENOENT') {
        res.status(500).json({ 
          success: false, 
          error: 'CLI not found. Make sure the CLI is built.',
          details: 'Run: cd packages/cli && npm run build'
        });
      } else if (error.killed || error.signal === 'SIGTERM') {
        res.status(408).json({ 
          success: false, 
          error: 'Command timed out after 30 seconds' 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: error.message,
          output: error.stdout || '',
          errorOutput: error.stderr || ''
        });
      }
    }
  });

  // CLI command suggestions endpoint
  app.get('/cli/suggestions', (req: Request, res: Response) => {
    const { prefix = '' } = req.query;
    
    const commands = [
      { command: 'help', description: 'Show available commands' },
      { command: 'status', description: 'Show current game status' },
      { command: 'health', description: 'Check engine connection' },
      { command: 'chat', description: 'Chat with the AI guide', requiresArgs: true },
      { command: 'quests', description: 'List all quests' },
      { command: 'get-score', description: 'Get current score' },
      { command: 'start-quest', description: 'Start a quest', requiresArgs: true },
      { command: 'quest-steps', description: 'View active quest steps' },
      { command: 'complete-step', description: 'Complete a quest step', requiresArgs: true },
      { command: 'complete-quest', description: 'Complete active quest' },
      { command: 'next', description: 'Show next step to do' },
      { command: 'progress', description: 'Show quest progress' },
      { command: 'history', description: 'Show conversation history' }
    ];
    
    const filtered = commands.filter(cmd => 
      cmd.command.toLowerCase().includes(String(prefix).toLowerCase())
    );
    
    res.json({
      success: true,
      suggestions: filtered,
      timestamp: new Date().toISOString()
    });
  });

  // Quest Editor endpoints
  app.get('/api/quest-drafts', async (req: Request, res: Response) => {
    try {
      // In production, this would fetch from a database
      // For now, we'll use Redis to store drafts
      const drafts = await services.redis.searchKeys('quest:draft:*', 100);
      const draftData = await Promise.all(
        drafts.map(async (keyInfo) => {
          const data = await services.redis.getKeyDetails(keyInfo.key);
          return { key: keyInfo.key, ...JSON.parse(data.value || '{}') };
        })
      );
      res.json(draftData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quest drafts' });
    }
  });

  app.post('/api/quest-drafts', async (req: Request, res: Response) => {
    try {
      const questData = req.body;
      if (!questData.id || !questData.title) {
        return res.status(400).json({ error: 'Quest ID and title are required' });
      }

      // Store in Redis
      const key = `quest:draft:${questData.id}`;
      await services.redis.executeQuery('SET', [key, JSON.stringify({
        ...questData,
        status: 'draft',
        lastModified: new Date().toISOString()
      })]);

      // Log the event
      services.dashboard.logEvent('info', 'quest-editor', `Quest draft saved: ${questData.title}`, {
        questId: questData.id
      });

      res.json({ success: true, questId: questData.id });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to save quest draft', details: error.message });
    }
  });

  app.post('/api/quest-publish', async (req: Request, res: Response) => {
    try {
      const questData = req.body;
      if (!questData.id || !questData.title || !questData.description) {
        return res.status(400).json({ error: 'Quest ID, title, and description are required' });
      }

      if (!questData.steps || questData.steps.length === 0) {
        return res.status(400).json({ error: 'At least one quest step is required' });
      }

      // Store as published quest
      const key = `quest:published:${questData.id}`;
      await services.redis.executeQuery('SET', [key, JSON.stringify({
        ...questData,
        status: 'published',
        publishedAt: new Date().toISOString()
      })]);

      // Add to quest catalog set
      await services.redis.executeQuery('SADD', ['quest:catalog', questData.id]);

      // Remove from drafts if exists
      const draftKey = `quest:draft:${questData.id}`;
      await services.redis.executeQuery('DEL', [draftKey]);

      // Log the event
      services.dashboard.logEvent('info', 'quest-editor', `Quest published: ${questData.title}`, {
        questId: questData.id,
        score: questData.score,
        steps: questData.steps.length
      });

      res.json({ success: true, questId: questData.id });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to publish quest', details: error.message });
    }
  });

  app.get('/api/quest-catalog', async (req: Request, res: Response) => {
    try {
      // Get all published quests
      const catalogKeys = await services.redis.executeQuery('SMEMBERS', ['quest:catalog']);
      const questIds = catalogKeys.result || [];

      const quests = await Promise.all(
        questIds.map(async (questId: string) => {
          const key = `quest:published:${questId}`;
          const questData = await services.redis.getKeyDetails(key);
          return questData.value ? JSON.parse(questData.value) : null;
        })
      );

      res.json({ 
        quests: quests.filter(q => q !== null),
        total: quests.length 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch quest catalog' });
    }
  });

  app.delete('/api/quest-drafts/:questId', async (req: Request, res: Response) => {
    try {
      const { questId } = req.params;
      const key = `quest:draft:${questId}`;
      
      await services.redis.executeQuery('DEL', [key]);
      
      services.dashboard.logEvent('info', 'quest-editor', `Quest draft deleted: ${questId}`);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete quest draft' });
    }
  });
} 