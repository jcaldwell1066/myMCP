import { Redis } from 'ioredis';
import { Player } from '@mymcp/types';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  level: string;
  questsCompleted: number;
  lastActive: Date;
  trend?: 'up' | 'down' | 'same';
}

export interface LeaderboardStats {
  totalPlayers: number;
  averageScore: number;
  topScore: number;
  mostActivePlayer: string;
  mostQuestsCompleted: number;
}

export class LeaderboardService {
  private redis: Redis;
  private previousRankings: Map<string, number> = new Map();

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl, {
      connectTimeout: 10000,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableOfflineQueue: true
    });
    
    this.redis.on('error', (err) => {
      console.error('LeaderboardService Redis error:', err.message);
    });
    
    this.redis.on('connect', () => {
      console.log('LeaderboardService Redis connected');
    });
  }

  async getLeaderboard(limit = 50, offset = 0): Promise<LeaderboardEntry[]> {
    // Get scores with player IDs
    const scores = await this.redis.zrevrange(
      'game:leaderboard:score', 
      offset, 
      offset + limit - 1, 
      'WITHSCORES'
    );

    const leaderboard: LeaderboardEntry[] = [];
    
    // Prepare all player data fetches in parallel
    const playerDataPromises: Promise<[any, number, string | null]>[] = [];
    
    for (let i = 0; i < scores.length; i += 2) {
      const playerId = scores[i];
      
      // Create a promise that fetches all data for this player in parallel
      const playerDataPromise = Promise.all([
        this.redis.hgetall(`game:state:${playerId}`),
        this.redis.scard(`game:quest:completed:${playerId}`),
        this.redis.hget(`game:session:${playerId}`, 'lastAction')
      ]);
      
      playerDataPromises.push(playerDataPromise);
    }
    
    // Wait for all player data to be fetched
    const allPlayerData = await Promise.all(playerDataPromises);
    
    // Process the results
    for (let i = 0; i < scores.length; i += 2) {
      const playerId = scores[i];
      const score = parseInt(scores[i + 1]);
      const rank = offset + (i / 2) + 1;
      const dataIndex = i / 2;
      
      const [playerData, questsCompleted, sessionData] = allPlayerData[dataIndex];

      // Determine trend
      const previousRank = this.previousRankings.get(playerId);
      let trend: 'up' | 'down' | 'same' = 'same';
      if (previousRank) {
        if (rank < previousRank) trend = 'up';
        else if (rank > previousRank) trend = 'down';
      }

      leaderboard.push({
        rank,
        playerId,
        playerName: playerData.name || 'Unknown',
        score,
        level: playerData.level || 'novice',
        questsCompleted,
        lastActive: sessionData ? new Date(sessionData) : new Date(),
        trend
      });

      // Update previous rankings
      this.previousRankings.set(playerId, rank);
    }

    return leaderboard;
  }

  async getPlayerRank(playerId: string): Promise<number | null> {
    const rank = await this.redis.zrevrank('game:leaderboard:score', playerId);
    return rank !== null ? rank + 1 : null;
  }

  async getLeaderboardAroundPlayer(playerId: string, range = 5): Promise<LeaderboardEntry[]> {
    const rank = await this.getPlayerRank(playerId);
    if (rank === null) return [];

    const offset = Math.max(0, rank - range - 1);
    const limit = range * 2 + 1;

    return this.getLeaderboard(limit, offset);
  }

  async getLeaderboardStats(): Promise<LeaderboardStats> {
    const [totalPlayers, topScore] = await Promise.all([
      this.redis.zcard('game:leaderboard:score'),
      this.redis.zrevrange('game:leaderboard:score', 0, 0, 'WITHSCORES')
    ]);

    // Get all scores for average calculation
    const allScores = await this.redis.zrevrange('game:leaderboard:score', 0, -1, 'WITHSCORES');
    let totalScore = 0;
    let maxQuests = 0;
    let mostActivePlayer = '';

    for (let i = 1; i < allScores.length; i += 2) {
      totalScore += parseInt(allScores[i]);
    }

    // Find player with most quests completed
    const players = await this.redis.smembers('game:players');
    for (const player of players) {
      const questsCompleted = await this.redis.scard(`game:quest:completed:${player}`);
      if (questsCompleted > maxQuests) {
        maxQuests = questsCompleted;
        mostActivePlayer = player;
      }
    }

    return {
      totalPlayers,
      averageScore: totalPlayers > 0 ? Math.round(totalScore / totalPlayers) : 0,
      topScore: topScore.length > 1 ? parseInt(topScore[1]) : 0,
      mostActivePlayer,
      mostQuestsCompleted: maxQuests
    };
  }

  async getLeaderboardByCategory(category: 'score' | 'quests' | 'level', limit = 10): Promise<any[]> {
    switch (category) {
      case 'score':
        return this.getLeaderboard(limit);
      
      case 'quests':
        return this.getQuestLeaderboard(limit);
      
      case 'level':
        return this.getLevelLeaderboard(limit);
      
      default:
        throw new Error(`Unknown category: ${category}`);
    }
  }

  private async getQuestLeaderboard(limit: number): Promise<any[]> {
    const players = await this.redis.smembers('game:players');
    
    // Fetch all quest counts in parallel
    const questCountPromises = players.map(playerId => 
      this.redis.scard(`game:quest:completed:${playerId}`)
        .then(count => ({ playerId, count }))
    );
    
    const questCounts = await Promise.all(questCountPromises);

    // Sort by quest count
    questCounts.sort((a, b) => b.count - a.count);

    // Get top players and fetch their data in parallel
    const topPlayers = questCounts.slice(0, limit);
    const playerDataPromises = topPlayers.map(({ playerId }) =>
      this.redis.hgetall(`game:state:${playerId}`)
    );
    
    const playerDataArray = await Promise.all(playerDataPromises);
    
    // Build leaderboard
    const leaderboard = topPlayers.map((item, index) => ({
      rank: index + 1,
      playerId: item.playerId,
      playerName: playerDataArray[index].name || 'Unknown',
      questsCompleted: item.count,
      score: parseInt(playerDataArray[index].score) || 0,
      level: playerDataArray[index].level || 'novice'
    }));

    return leaderboard;
  }

  private async getLevelLeaderboard(limit: number): Promise<any[]> {
    const levelOrder = ['master', 'expert', 'apprentice', 'novice'];
    const playersByLevel: Record<string, any[]> = {
      master: [],
      expert: [],
      apprentice: [],
      novice: []
    };

    const players = await this.redis.smembers('game:players');

    // Fetch all player data in parallel
    const playerDataPromises = players.map(playerId => 
      this.redis.hgetall(`game:state:${playerId}`)
        .then(playerData => ({
          playerId,
          playerName: playerData.name || 'Unknown',
          score: parseInt(playerData.score) || 0,
          level: playerData.level || 'novice'
        }))
    );
    
    const allPlayerData = await Promise.all(playerDataPromises);
    
    // Group players by level
    for (const player of allPlayerData) {
      if (playersByLevel[player.level]) {
        playersByLevel[player.level].push(player);
      }
    }

    // Sort each level by score
    for (const level of levelOrder) {
      playersByLevel[level].sort((a, b) => b.score - a.score);
    }

    // Combine into single leaderboard
    const leaderboard = [];
    let rank = 1;

    for (const level of levelOrder) {
      for (const player of playersByLevel[level]) {
        if (rank > limit) break;
        leaderboard.push({ rank, ...player });
        rank++;
      }
      if (rank > limit) break;
    }

    return leaderboard;
  }

  async updatePlayerScore(playerId: string, score: number): Promise<void> {
    await this.redis.zadd('game:leaderboard:score', score, playerId);
    await this.redis.hset(`game:state:${playerId}`, 'score', score.toString());
  }

  async resetLeaderboard(): Promise<void> {
    // This is a dangerous operation - should require confirmation
    await this.redis.del('game:leaderboard:score');
    this.previousRankings.clear();
  }

  async exportLeaderboard(format: 'json' | 'csv' = 'json'): Promise<string> {
    const leaderboard = await this.getLeaderboard(1000); // Get top 1000

    if (format === 'json') {
      return JSON.stringify(leaderboard, null, 2);
    } else {
      // CSV format
      const headers = ['Rank', 'Player ID', 'Player Name', 'Score', 'Level', 'Quests Completed', 'Last Active'];
      const rows = leaderboard.map(entry => [
        entry.rank,
        entry.playerId,
        entry.playerName,
        entry.score,
        entry.level,
        entry.questsCompleted,
        entry.lastActive.toISOString()
      ]);

      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  async disconnect() {
    await this.redis.quit();
  }
} 