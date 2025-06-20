import { EventEmitter } from 'events';
import Redis from 'ioredis';

export interface ParticipantTier {
  id: string;
  name: string;
  description: string;
  validation: 'checklist' | 'confirmation' | 'automated' | 'test';
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'coordination' | 'collaboration' | 'monitoring' | 'development' | 'devops';
}

export interface Participant {
  id: string;
  name: string;
  persona: string;
  slackUserId?: string;
  githubUsername?: string;
  joinedAt: number;
  completedTiers: string[];
  currentTier: string | null;
  points: number;
  achievements: string[];
  lastActivity: number;
}

export interface TierProgress {
  tierId: string;
  participantId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  startedAt?: number;
  completedAt?: number;
  validationData?: any;
  notes?: string[];
}

export class MultiTierParticipationSystem extends EventEmitter {
  private redis: Redis;
  private participants: Map<string, Participant> = new Map();
  private tiers: Map<string, ParticipantTier> = new Map();
  private progress: Map<string, TierProgress[]> = new Map();
  private demoId: string;
  private isActive: boolean = false;

  constructor(redisUrl: string = 'redis://localhost:6379', demoId: string = 'lunch-learn-demo') {
    super();
    this.redis = new Redis(redisUrl);
    this.demoId = demoId;
    this.initializeTiers();
  }

  private initializeTiers() {
    const tiers: ParticipantTier[] = [
      {
        id: 'tier1',
        name: 'Teams Attendance',
        description: 'Present and visible in Microsoft Teams',
        validation: 'checklist',
        points: 10,
        difficulty: 'easy',
        category: 'coordination'
      },
      {
        id: 'tier2',
        name: 'Teams Screen Sharing',
        description: 'Actively sharing screen or viewing shared screens',
        validation: 'confirmation',
        points: 15,
        difficulty: 'easy',
        category: 'collaboration'
      },
      {
        id: 'tier3',
        name: 'Teams Speaking/Presenting',
        description: 'Verbally participating in discussions or presenting',
        validation: 'confirmation',
        points: 25,
        difficulty: 'medium',
        category: 'collaboration'
      },
      {
        id: 'tier4',
        name: 'Teams Q&A Participation',
        description: 'Asking questions or providing answers during demo',
        validation: 'confirmation',
        points: 30,
        difficulty: 'medium',
        category: 'collaboration'
      },
      {
        id: 'tier5',
        name: 'Slack Channel Engagement',
        description: 'Posting messages, reactions, or using /mymcp commands',
        validation: 'automated',
        points: 35,
        difficulty: 'medium',
        category: 'collaboration'
      },
      {
        id: 'tier6',
        name: 'Redis State Inspection',
        description: 'Viewing live game state through Redis commands',
        validation: 'confirmation',
        points: 50,
        difficulty: 'hard',
        category: 'monitoring'
      },
      {
        id: 'tier7',
        name: 'GitHub Repository Interaction',
        description: 'Browsing code, issues, or contributing to the repo',
        validation: 'confirmation',
        points: 60,
        difficulty: 'hard',
        category: 'development'
      },
      {
        id: 'tier8',
        name: 'Local Environment Setup',
        description: 'Running engine/cli/web/mcp components locally',
        validation: 'test',
        points: 100,
        difficulty: 'hard',
        category: 'devops'
      },
      {
        id: 'tier9',
        name: 'Active Development/Contribution',
        description: 'Making real-time code changes or submitting PRs',
        validation: 'test',
        points: 150,
        difficulty: 'hard',
        category: 'development'
      }
    ];

    tiers.forEach(tier => this.tiers.set(tier.id, tier));
  }

  async startDemo(): Promise<void> {
    this.isActive = true;
    await this.redis.set(`${this.demoId}:active`, '1');
    await this.redis.set(`${this.demoId}:started_at`, Date.now().toString());
    
    // Initialize demo state
    await this.redis.hset(`${this.demoId}:state`, {
      phase: 'phase1_introduction',
      current_dm: 'Green DM',
      participants_count: '0',
      active_tiers: JSON.stringify({}),
      leaderboard: JSON.stringify([])
    });

    this.emit('demo_started', { demoId: this.demoId, timestamp: Date.now() });
    console.log(`Demo ${this.demoId} started`);
  }

  async stopDemo(): Promise<void> {
    this.isActive = false;
    await this.redis.set(`${this.demoId}:active`, '0');
    await this.redis.set(`${this.demoId}:ended_at`, Date.now().toString());
    
    this.emit('demo_ended', { demoId: this.demoId, timestamp: Date.now() });
    console.log(`Demo ${this.demoId} ended`);
  }

  async addParticipant(participant: Omit<Participant, 'id' | 'joinedAt' | 'completedTiers' | 'currentTier' | 'points' | 'achievements' | 'lastActivity'>): Promise<string> {
    const participantId = `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newParticipant: Participant = {
      id: participantId,
      joinedAt: Date.now(),
      completedTiers: [],
      currentTier: null,
      points: 0,
      achievements: [],
      lastActivity: Date.now(),
      ...participant
    };

    this.participants.set(participantId, newParticipant);
    this.progress.set(participantId, []);

    // Store in Redis
    await this.redis.hset(`${this.demoId}:participants`, participantId, JSON.stringify(newParticipant));
    await this.redis.incr(`${this.demoId}:participants_count`);

    // Update state
    await this.updateLeaderboard();

    this.emit('participant_joined', { participantId, participant: newParticipant });
    console.log(`Participant ${participant.name} joined as ${participant.persona}`);
    
    return participantId;
  }

  async startTier(participantId: string, tierId: string): Promise<boolean> {
    if (!this.isActive) {
      throw new Error('Demo is not active');
    }

    const participant = this.participants.get(participantId);
    const tier = this.tiers.get(tierId);

    if (!participant || !tier) {
      return false;
    }

    // Check if already completed
    if (participant.completedTiers.includes(tierId)) {
      return false;
    }

    // Update progress
    const participantProgress = this.progress.get(participantId) || [];
    const existingProgress = participantProgress.find(p => p.tierId === tierId);

    if (existingProgress) {
      existingProgress.status = 'in_progress';
      existingProgress.startedAt = Date.now();
    } else {
      participantProgress.push({
        tierId,
        participantId,
        status: 'in_progress',
        startedAt: Date.now(),
        notes: []
      });
    }

    this.progress.set(participantId, participantProgress);
    participant.currentTier = tierId;
    participant.lastActivity = Date.now();

    // Store in Redis
    await this.redis.hset(`${this.demoId}:participants`, participantId, JSON.stringify(participant));
    await this.redis.hset(`${this.demoId}:progress`, participantId, JSON.stringify(participantProgress));

    this.emit('tier_started', { participantId, tierId, participant, tier });
    console.log(`${participant.name} started ${tier.name} (${tierId})`);

    return true;
  }

  async completeTier(participantId: string, tierId: string, validationData?: any): Promise<boolean> {
    if (!this.isActive) {
      throw new Error('Demo is not active');
    }

    const participant = this.participants.get(participantId);
    const tier = this.tiers.get(tierId);

    if (!participant || !tier) {
      return false;
    }

    // Check if already completed
    if (participant.completedTiers.includes(tierId)) {
      return false;
    }

    // Update progress
    const participantProgress = this.progress.get(participantId) || [];
    const tierProgress = participantProgress.find(p => p.tierId === tierId);

    if (tierProgress) {
      tierProgress.status = 'completed';
      tierProgress.completedAt = Date.now();
      tierProgress.validationData = validationData;
    } else {
      participantProgress.push({
        tierId,
        participantId,
        status: 'completed',
        startedAt: Date.now(),
        completedAt: Date.now(),
        validationData,
        notes: []
      });
    }

    // Update participant
    participant.completedTiers.push(tierId);
    participant.points += tier.points;
    participant.currentTier = null;
    participant.lastActivity = Date.now();

    // Check for achievements
    await this.checkAchievements(participantId);

    this.progress.set(participantId, participantProgress);

    // Store in Redis
    await this.redis.hset(`${this.demoId}:participants`, participantId, JSON.stringify(participant));
    await this.redis.hset(`${this.demoId}:progress`, participantId, JSON.stringify(participantProgress));

    // Update aggregated data
    await this.updateTierStats();
    await this.updateLeaderboard();

    this.emit('tier_completed', { participantId, tierId, participant, tier, points: tier.points });
    console.log(`${participant.name} completed ${tier.name} (${tierId}) for ${tier.points} points`);

    return true;
  }

  async checkAchievements(participantId: string): Promise<string[]> {
    const participant = this.participants.get(participantId);
    if (!participant) return [];

    const newAchievements: string[] = [];
    const completed = participant.completedTiers;

    // Achievement logic
    const achievements = [
      { id: 'first_steps', name: 'First Steps', condition: () => completed.includes('tier1') && completed.includes('tier2') },
      { id: 'voice_of_demo', name: 'Voice of the Demo', condition: () => completed.includes('tier3') && completed.includes('tier4') },
      { id: 'digital_native', name: 'Digital Native', condition: () => completed.includes('tier5') },
      { id: 'system_explorer', name: 'System Explorer', condition: () => completed.includes('tier6') || completed.includes('tier7') },
      { id: 'local_hero', name: 'Local Hero', condition: () => completed.includes('tier8') },
      { id: 'code_contributor', name: 'Code Contributor', condition: () => completed.includes('tier9') },
      { id: 'tier_collector', name: 'Tier Collector', condition: () => completed.length >= 5 },
      { id: 'high_scorer', name: 'High Scorer', condition: () => participant.points >= 200 },
      { id: 'completionist', name: 'Completionist', condition: () => completed.length >= 7 }
    ];

    achievements.forEach(achievement => {
      if (!participant.achievements.includes(achievement.id) && achievement.condition()) {
        participant.achievements.push(achievement.id);
        newAchievements.push(achievement.name);
      }
    });

    if (newAchievements.length > 0) {
      await this.redis.hset(`${this.demoId}:participants`, participantId, JSON.stringify(participant));
      this.emit('achievements_unlocked', { participantId, participant, achievements: newAchievements });
    }

    return newAchievements;
  }

  async updateTierStats(): Promise<void> {
    const tierStats: { [key: string]: number } = {};
    
    for (const [tierId] of this.tiers) {
      tierStats[tierId] = 0;
    }

    for (const [, participant] of this.participants) {
      participant.completedTiers.forEach(tierId => {
        tierStats[tierId]++;
      });
    }

    await this.redis.hset(`${this.demoId}:state`, 'active_tiers', JSON.stringify(tierStats));
  }

  async updateLeaderboard(): Promise<void> {
    const sortedParticipants = Array.from(this.participants.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        name: p.name,
        persona: p.persona,
        points: p.points,
        completedTiers: p.completedTiers.length,
        achievements: p.achievements.length
      }));

    await this.redis.hset(`${this.demoId}:state`, 'leaderboard', JSON.stringify(sortedParticipants));
    await this.redis.hset(`${this.demoId}:state`, 'participants_count', this.participants.size.toString());
  }

  async getParticipant(participantId: string): Promise<Participant | null> {
    return this.participants.get(participantId) || null;
  }

  async getParticipantBySlackId(slackUserId: string): Promise<Participant | null> {
    for (const [, participant] of this.participants) {
      if (participant.slackUserId === slackUserId) {
        return participant;
      }
    }
    return null;
  }

  async getAllParticipants(): Promise<Participant[]> {
    return Array.from(this.participants.values());
  }

  async getLeaderboard(): Promise<any[]> {
    const leaderboardData = await this.redis.hget(`${this.demoId}:state`, 'leaderboard');
    return leaderboardData ? JSON.parse(leaderboardData) : [];
  }

  async getTierStats(): Promise<{ [key: string]: number }> {
    const tierStatsData = await this.redis.hget(`${this.demoId}:state`, 'active_tiers');
    return tierStatsData ? JSON.parse(tierStatsData) : {};
  }

  async getDemoState(): Promise<any> {
    return await this.redis.hgetall(`${this.demoId}:state`);
  }

  async getParticipantProgress(participantId: string): Promise<TierProgress[]> {
    return this.progress.get(participantId) || [];
  }

  // Validation webhooks for automated tier completion
  async handleSlackActivity(slackUserId: string, activity: any): Promise<void> {
    const participant = await this.getParticipantBySlackId(slackUserId);
    if (participant && !participant.completedTiers.includes('tier5')) {
      await this.completeTier(participant.id, 'tier5', { activity, source: 'slack' });
    }
  }

  async handleGitHubActivity(githubUsername: string, activity: any): Promise<void> {
    for (const [, participant] of this.participants) {
      if (participant.githubUsername === githubUsername && !participant.completedTiers.includes('tier7')) {
        await this.completeTier(participant.id, 'tier7', { activity, source: 'github' });
        break;
      }
    }
  }

  async handleLocalSetupValidation(participantId: string, validationData: any): Promise<void> {
    const participant = this.participants.get(participantId);
    if (participant && !participant.completedTiers.includes('tier8')) {
      await this.completeTier(participantId, 'tier8', { ...validationData, source: 'local_setup' });
    }
  }

  async handleCodeContribution(participantId: string, contributionData: any): Promise<void> {
    const participant = this.participants.get(participantId);
    if (participant && !participant.completedTiers.includes('tier9')) {
      await this.completeTier(participantId, 'tier9', { ...contributionData, source: 'code_contribution' });
    }
  }

  // Cleanup and utility methods
  async cleanup(): Promise<void> {
    await this.redis.del(`${this.demoId}:active`);
    await this.redis.del(`${this.demoId}:state`);
    await this.redis.del(`${this.demoId}:participants`);
    await this.redis.del(`${this.demoId}:progress`);
    await this.redis.disconnect();
  }

  getTiers(): ParticipantTier[] {
    return Array.from(this.tiers.values());
  }

  isValidTier(tierId: string): boolean {
    return this.tiers.has(tierId);
  }
}