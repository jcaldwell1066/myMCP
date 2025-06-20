import { EventEmitter } from 'events';
import Redis from 'ioredis';
import * as schedule from 'node-schedule';

export interface DungeonMaster {
  id: string;
  name: string;
  color: 'green' | 'blue';
  isActive: boolean;
  specialties: string[];
  avatar?: string;
}

export interface DemoPhase {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  dmId: string;
  startTime?: number;
  endTime?: number;
  status: 'pending' | 'active' | 'completed';
  handoffNotes?: string;
}

export interface DMHandoff {
  id: string;
  fromDM: string;
  toDM: string;
  phase: string;
  timestamp: number;
  handoffNotes: string;
  participantCount: number;
  currentLeaderboard: any[];
  systemStatus: any;
}

export class DMRotationSystem extends EventEmitter {
  private redis: Redis;
  private dms: Map<string, DungeonMaster> = new Map();
  private phases: Map<string, DemoPhase> = new Map();
  private handoffs: DMHandoff[] = [];
  private currentDM: string | null = null;
  private currentPhase: string | null = null;
  private demoId: string;
  private rotationSchedule: schedule.Job[] = [];
  private isActive: boolean = false;
  private startTime: number = 0;

  constructor(redisUrl: string = 'redis://localhost:6379', demoId: string = 'lunch-learn-demo') {
    super();
    this.redis = new Redis(redisUrl);
    this.demoId = demoId;
    this.initializeDMs();
    this.initializePhases();
  }

  private initializeDMs() {
    const dms: DungeonMaster[] = [
      {
        id: 'green_dm',
        name: 'Green DM',
        color: 'green',
        isActive: false,
        specialties: ['System Architecture', 'Live Demonstrations', 'Q&A Management', 'Technical Introductions'],
        avatar: '🟢'
      },
      {
        id: 'blue_dm',
        name: 'Blue DM', 
        color: 'blue',
        isActive: false,
        specialties: ['Interactive Engagement', 'Hands-on Activities', 'Participation Encouragement', 'Community Building'],
        avatar: '🔵'
      }
    ];

    dms.forEach(dm => this.dms.set(dm.id, dm));
  }

  private initializePhases() {
    const phases: DemoPhase[] = [
      {
        id: 'phase1_introduction',
        name: 'Welcome & System Overview',
        description: 'Introduce myMCP architecture and demonstrate basic functionality',
        duration: 10,
        dmId: 'green_dm',
        status: 'pending'
      },
      {
        id: 'phase2_interaction',
        name: 'Interactive Participation Demo',
        description: 'Live demonstration of multi-tier participation system',
        duration: 20,
        dmId: 'blue_dm',
        status: 'pending'
      },
      {
        id: 'phase3_advanced',
        name: 'Advanced Features & Development',
        description: 'Show advanced capabilities and live development',
        duration: 10,
        dmId: 'green_dm',
        status: 'pending'
      },
      {
        id: 'phase4_wrap',
        name: 'Q&A and Next Steps',
        description: 'Address questions and outline future learning opportunities',
        duration: 5,
        dmId: 'both_dms', // Special case for both DMs
        status: 'pending'
      }
    ];

    phases.forEach(phase => this.phases.set(phase.id, phase));
  }

  async startDemo(): Promise<void> {
    this.isActive = true;
    this.startTime = Date.now();
    
    // Set initial state
    const initialPhase = this.phases.get('phase1_introduction')!;
    this.currentPhase = initialPhase.id;
    this.currentDM = initialPhase.dmId;
    
    // Activate first DM
    const firstDM = this.dms.get(this.currentDM)!;
    firstDM.isActive = true;
    
    // Update Redis
    await this.redis.hset(`${this.demoId}:dm_rotation`, {
      current_dm: this.currentDM,
      current_phase: this.currentPhase,
      demo_started: this.startTime.toString(),
      is_active: '1'
    });

    // Schedule phase transitions
    this.schedulePhaseTransitions();

    // Start first phase
    await this.startPhase(initialPhase.id);

    this.emit('demo_started', { 
      demoId: this.demoId, 
      currentDM: firstDM.name,
      currentPhase: initialPhase.name,
      startTime: this.startTime 
    });

    console.log(`🎮 Demo started with ${firstDM.name} (${firstDM.avatar}) leading ${initialPhase.name}`);
  }

  private schedulePhaseTransitions() {
    let cumulativeTime = 0;
    const phases = Array.from(this.phases.values());

    phases.forEach((phase, index) => {
      if (index === 0) {
        // First phase starts immediately
        cumulativeTime += phase.duration;
        return;
      }

      const transitionTime = new Date(this.startTime + cumulativeTime * 60 * 1000);
      
      const job = schedule.scheduleJob(transitionTime, async () => {
        await this.transitionToPhase(phase.id);
      });

      this.rotationSchedule.push(job);
      cumulativeTime += phase.duration;

      console.log(`⏰ Scheduled transition to ${phase.name} at ${transitionTime.toLocaleTimeString()}`);
    });
  }

  async transitionToPhase(phaseId: string): Promise<boolean> {
    if (!this.isActive) {
      console.log('Demo not active, skipping phase transition');
      return false;
    }

    const newPhase = this.phases.get(phaseId);
    const currentPhase = this.currentPhase ? this.phases.get(this.currentPhase) : null;
    
    if (!newPhase) {
      console.error(`Phase ${phaseId} not found`);
      return false;
    }

    // Complete current phase if it exists
    if (currentPhase) {
      await this.completePhase(currentPhase.id);
    }

    // Perform DM handoff if needed
    const newDMId = newPhase.dmId;
    if (newDMId !== this.currentDM && newDMId !== 'both_dms') {
      await this.performDMHandoff(newDMId, phaseId);
    }

    // Start new phase
    await this.startPhase(phaseId);

    return true;
  }

  async performDMHandoff(newDMId: string, phaseId: string): Promise<void> {
    const oldDMId = this.currentDM;
    const oldDM = oldDMId ? this.dms.get(oldDMId) : null;
    const newDM = this.dms.get(newDMId);
    const phase = this.phases.get(phaseId);

    if (!newDM || !phase) {
      console.error('Invalid DM or phase for handoff');
      return;
    }

    // Gather current state for handoff
    const participantCount = await this.redis.hget(`${this.demoId}:state`, 'participants_count') || '0';
    const leaderboardData = await this.redis.hget(`${this.demoId}:state`, 'leaderboard') || '[]';
    const tierStatsData = await this.redis.hget(`${this.demoId}:state`, 'active_tiers') || '{}';

    const systemStatus = {
      participants: parseInt(participantCount),
      leaderboard: JSON.parse(leaderboardData),
      tierStats: JSON.parse(tierStatsData),
      timestamp: Date.now()
    };

    // Generate handoff notes
    const handoffNotes = this.generateHandoffNotes(oldDM, newDM, phase, systemStatus);

    // Create handoff record
    const handoff: DMHandoff = {
      id: `handoff_${Date.now()}`,
      fromDM: oldDMId || 'system',
      toDM: newDMId,
      phase: phaseId,
      timestamp: Date.now(),
      handoffNotes,
      participantCount: systemStatus.participants,
      currentLeaderboard: systemStatus.leaderboard,
      systemStatus
    };

    this.handoffs.push(handoff);

    // Update DM states
    if (oldDM) {
      oldDM.isActive = false;
    }
    newDM.isActive = true;
    this.currentDM = newDMId;

    // Update Redis
    await this.redis.hset(`${this.demoId}:dm_rotation`, 'current_dm', newDMId);
    await this.redis.hset(`${this.demoId}:handoffs`, handoff.id, JSON.stringify(handoff));

    // Broadcast handoff
    this.emit('dm_handoff', handoff);

    // Send Slack notification if applicable
    await this.notifyHandoff(handoff);

    console.log(`🔄 DM Handoff: ${oldDM?.name || 'System'} → ${newDM.name} for ${phase.name}`);
    console.log(`📋 Handoff Notes: ${handoffNotes}`);
  }

  private generateHandoffNotes(oldDM: DungeonMaster | null, newDM: DungeonMaster, phase: DemoPhase, systemStatus: any): string {
    const notes = [];
    
    notes.push(`${newDM.avatar} Taking over for ${phase.name}`);
    notes.push(`👥 ${systemStatus.participants} participants active`);
    
    if (systemStatus.leaderboard.length > 0) {
      const leader = systemStatus.leaderboard[0];
      notes.push(`🏆 Leader: ${leader.name} (${leader.points} points)`);
    }

    const topTiers = Object.entries(systemStatus.tierStats as { [key: string]: number })
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 2);
    
    if (topTiers.length > 0) {
      notes.push(`📊 Top tiers: ${topTiers.map(([tier, count]) => `${tier}(${count})`).join(', ')}`);
    }

    // Phase-specific notes
    switch (phase.id) {
      case 'phase2_interaction':
        notes.push('🎯 Focus: Encourage Tier 5+ participation');
        notes.push('💡 Goal: Get more people into Slack and Redis');
        break;
      case 'phase3_advanced':
        notes.push('🔧 Focus: Live coding and Tier 8-9 demonstrations');
        notes.push('💡 Goal: Show local setup and development workflow');
        break;
      case 'phase4_wrap':
        notes.push('❓ Focus: Q&A and resource sharing');
        notes.push('💡 Goal: Clear next steps and follow-up');
        break;
    }

    return notes.join(' | ');
  }

  async startPhase(phaseId: string): Promise<void> {
    const phase = this.phases.get(phaseId);
    if (!phase) return;

    phase.status = 'active';
    phase.startTime = Date.now();
    this.currentPhase = phaseId;

    await this.redis.hset(`${this.demoId}:dm_rotation`, 'current_phase', phaseId);
    await this.redis.hset(`${this.demoId}:phases`, phaseId, JSON.stringify(phase));

    this.emit('phase_started', { phaseId, phase, timestamp: phase.startTime });
    
    const dm = this.dms.get(this.currentDM!);
    console.log(`▶️ Phase Started: ${phase.name} with ${dm?.name} (${dm?.avatar})`);
  }

  async completePhase(phaseId: string): Promise<void> {
    const phase = this.phases.get(phaseId);
    if (!phase) return;

    phase.status = 'completed';
    phase.endTime = Date.now();

    await this.redis.hset(`${this.demoId}:phases`, phaseId, JSON.stringify(phase));

    this.emit('phase_completed', { phaseId, phase, timestamp: phase.endTime });
    
    console.log(`✅ Phase Completed: ${phase.name} (${phase.endTime! - phase.startTime!}ms)`);
  }

  async notifyHandoff(handoff: DMHandoff): Promise<void> {
    // This would integrate with Slack to announce handoffs
    const message = {
      type: 'dm_handoff',
      from: handoff.fromDM,
      to: handoff.toDM,
      phase: handoff.phase,
      notes: handoff.handoffNotes,
      timestamp: handoff.timestamp
    };

    // Publish to Redis for Slack integration to pick up
    await this.redis.publish('game:dm:handoff', JSON.stringify(message));
  }

  async getDMStatus(): Promise<{ current: DungeonMaster | null; all: DungeonMaster[] }> {
    const current = this.currentDM ? this.dms.get(this.currentDM) : null;
    const all = Array.from(this.dms.values());
    
    return { current, all };
  }

  async getPhaseStatus(): Promise<{ current: DemoPhase | null; all: DemoPhase[] }> {
    const current = this.currentPhase ? this.phases.get(this.currentPhase) : null;
    const all = Array.from(this.phases.values());
    
    return { current, all };
  }

  async getHandoffHistory(): Promise<DMHandoff[]> {
    return [...this.handoffs];
  }

  async getCurrentState(): Promise<any> {
    const dmStatus = await this.getDMStatus();
    const phaseStatus = await this.getPhaseStatus();
    const timeElapsed = this.startTime ? Date.now() - this.startTime : 0;
    
    return {
      isActive: this.isActive,
      startTime: this.startTime,
      timeElapsed,
      currentDM: dmStatus.current,
      currentPhase: phaseStatus.current,
      allDMs: dmStatus.all,
      allPhases: phaseStatus.all,
      handoffHistory: this.handoffs,
      nextTransition: this.getNextTransition()
    };
  }

  private getNextTransition(): { phase: DemoPhase; estimatedTime: number } | null {
    if (!this.currentPhase) return null;
    
    const phases = Array.from(this.phases.values());
    const currentIndex = phases.findIndex(p => p.id === this.currentPhase);
    const nextPhase = phases[currentIndex + 1];
    
    if (!nextPhase) return null;
    
    // Calculate estimated time for next transition
    const currentPhase = phases[currentIndex];
    const estimatedTime = this.startTime + 
      phases.slice(0, currentIndex + 1).reduce((sum, p) => sum + p.duration, 0) * 60 * 1000;
    
    return { phase: nextPhase, estimatedTime };
  }

  async forceHandoff(newDMId: string, reason: string): Promise<boolean> {
    if (!this.currentPhase) return false;
    
    const newDM = this.dms.get(newDMId);
    if (!newDM) return false;

    console.log(`🚨 Force handoff requested: ${reason}`);
    await this.performDMHandoff(newDMId, this.currentPhase);
    
    return true;
  }

  async extendCurrentPhase(additionalMinutes: number): Promise<boolean> {
    if (!this.currentPhase) return false;
    
    const phase = this.phases.get(this.currentPhase);
    if (!phase) return false;

    // Cancel existing scheduled transitions
    this.rotationSchedule.forEach(job => job.cancel());
    this.rotationSchedule = [];

    // Extend current phase
    phase.duration += additionalMinutes;
    
    // Reschedule remaining transitions
    this.scheduleRemainingTransitions();
    
    console.log(`⏰ Extended ${phase.name} by ${additionalMinutes} minutes`);
    
    return true;
  }

  private scheduleRemainingTransitions() {
    const phases = Array.from(this.phases.values());
    const currentIndex = phases.findIndex(p => p.id === this.currentPhase);
    
    if (currentIndex === -1) return;
    
    let cumulativeTime = phases.slice(0, currentIndex + 1)
      .reduce((sum, p) => sum + p.duration, 0);
    
    phases.slice(currentIndex + 1).forEach(phase => {
      const transitionTime = new Date(this.startTime + cumulativeTime * 60 * 1000);
      
      const job = schedule.scheduleJob(transitionTime, async () => {
        await this.transitionToPhase(phase.id);
      });

      this.rotationSchedule.push(job);
      cumulativeTime += phase.duration;
    });
  }

  async endDemo(): Promise<void> {
    this.isActive = false;
    
    // Cancel all scheduled transitions
    this.rotationSchedule.forEach(job => job.cancel());
    this.rotationSchedule = [];
    
    // Deactivate all DMs
    for (const [, dm] of this.dms) {
      dm.isActive = false;
    }
    
    // Complete current phase
    if (this.currentPhase) {
      await this.completePhase(this.currentPhase);
    }
    
    await this.redis.hset(`${this.demoId}:dm_rotation`, 'is_active', '0');
    await this.redis.hset(`${this.demoId}:dm_rotation`, 'ended_at', Date.now().toString());
    
    this.emit('demo_ended', { demoId: this.demoId, timestamp: Date.now() });
    
    console.log('🏁 Demo ended, all DM rotations stopped');
  }

  async cleanup(): Promise<void> {
    await this.endDemo();
    await this.redis.del(`${this.demoId}:dm_rotation`);
    await this.redis.del(`${this.demoId}:phases`);
    await this.redis.del(`${this.demoId}:handoffs`);
    await this.redis.disconnect();
  }
}