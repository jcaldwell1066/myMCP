// Migration script to enhance existing quest steps with rich metadata and resources
import { EnhancedQuestStep, LegacyQuestStep, isEnhancedQuestStep } from '../types/QuestStep';
import { getStepEnhancement } from '../data/stepEnhancements';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface GameState {
  player: any;
  quests: {
    available: Quest[];
    active: Quest | null;
    completed: Quest[];
  };
  inventory: any;
  session: any;
  metadata: any;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  steps: (EnhancedQuestStep | LegacyQuestStep)[];
  [key: string]: any;
}

export class QuestStepMigrator {
  private gameStatesFile: string;
  private backupFile: string;

  constructor(dataDir: string = './data') {
    this.gameStatesFile = join(dataDir, 'game-states.json');
    this.backupFile = join(dataDir, 'game-states.backup.json');
  }

  /**
   * Migrate all quest steps to enhanced format
   */
  async migrateAll(): Promise<void> {
    console.log('🔄 Starting quest step migration...');

    if (!existsSync(this.gameStatesFile)) {
      console.log('❌ No game states file found, nothing to migrate');
      return;
    }

    // Create backup
    this.createBackup();

    // Load current game states
    const gameStates = this.loadGameStates();
    
    // Migrate each game state
    let totalStepsMigrated = 0;
    for (const [playerId, gameState] of Object.entries(gameStates)) {
      const migrated = this.migrateGameState(gameState);
      totalStepsMigrated += migrated;
      console.log(`✅ Migrated ${migrated} steps for player: ${playerId}`);
    }

    // Save migrated data
    this.saveGameStates(gameStates);
    
    console.log(`🎉 Migration complete! Enhanced ${totalStepsMigrated} quest steps total`);
  }

  /**
   * Migrate a single game state
   */
  private migrateGameState(gameState: GameState): number {
    let stepsMigrated = 0;

    // Migrate available quests
    gameState.quests.available = gameState.quests.available.map(quest => {
      const migratedSteps = this.migrateQuestSteps(quest.steps, quest.id);
      stepsMigrated += migratedSteps.filter(step => isEnhancedQuestStep(step)).length;
      return { ...quest, steps: migratedSteps };
    });

    // Migrate active quest
    if (gameState.quests.active) {
      const migratedSteps = this.migrateQuestSteps(gameState.quests.active.steps, gameState.quests.active.id);
      stepsMigrated += migratedSteps.filter(step => isEnhancedQuestStep(step)).length;
      gameState.quests.active = { ...gameState.quests.active, steps: migratedSteps };
    }

    // Migrate completed quests
    gameState.quests.completed = gameState.quests.completed.map(quest => {
      const migratedSteps = this.migrateQuestSteps(quest.steps, quest.id);
      stepsMigrated += migratedSteps.filter(step => isEnhancedQuestStep(step)).length;
      return { ...quest, steps: migratedSteps };
    });

    return stepsMigrated;
  }

  /**
   * Migrate quest steps array
   */
  private migrateQuestSteps(steps: (EnhancedQuestStep | LegacyQuestStep)[], questId: string): EnhancedQuestStep[] {
    return steps.map(step => {
      // Skip if already enhanced
      if (isEnhancedQuestStep(step)) {
        return step;
      }

      // Convert legacy step to enhanced step
      return this.enhanceStep(step as LegacyQuestStep, questId);
    });
  }

  /**
   * Convert a legacy step to enhanced format
   */
  private enhanceStep(legacyStep: LegacyQuestStep, questId: string): EnhancedQuestStep {
    const enhancement = getStepEnhancement(legacyStep.id);

    if (!enhancement) {
      // Create a basic enhanced step if no specific enhancement exists
      console.log(`⚠️  No enhancement found for step: ${legacyStep.id}, using defaults`);
      return {
        ...legacyStep,
        title: legacyStep.description,
        metadata: {
          difficulty: 'medium',
          category: 'development',
          tags: ['general'],
          points: 25
        },
        resources: {},
        execution: {
          type: 'manual',
          validation: {
            type: 'confirmation',
            criteria: ['Task completed successfully']
          }
        },
        progress: {
          attempts: 0,
          notes: [],
          artifacts: []
        }
      };
    }

    // Apply enhancement definition
    const enhancedStep: EnhancedQuestStep = {
      // Preserve existing basic properties
      id: legacyStep.id,
      description: legacyStep.description,
      completed: legacyStep.completed,
      
      // Add enhanced properties from definition
      title: enhancement.title,
      metadata: enhancement.metadata,
      resources: enhancement.resources,
      execution: enhancement.execution,
      
      // Initialize progress tracking
      progress: {
        attempts: 0,
        notes: [],
        artifacts: []
      }
    };

    console.log(`✨ Enhanced step: ${legacyStep.id} → ${enhancement.title}`);
    return enhancedStep;
  }

  /**
   * Create backup of current game states
   */
  private createBackup(): void {
    try {
      const currentData = readFileSync(this.gameStatesFile, 'utf8');
      writeFileSync(this.backupFile, currentData);
      console.log(`💾 Backup created: ${this.backupFile}`);
    } catch (error) {
      console.error('❌ Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Load game states from file
   */
  private loadGameStates(): Record<string, GameState> {
    try {
      const data = readFileSync(this.gameStatesFile, 'utf8');
      const states = JSON.parse(data);
      
      // Convert date strings back to Date objects
      Object.values(states).forEach((state: any) => {
        if (state.session?.startTime) {
          state.session.startTime = new Date(state.session.startTime);
        }
        if (state.session?.lastAction) {
          state.session.lastAction = new Date(state.session.lastAction);
        }
        if (state.session?.conversationHistory) {
          state.session.conversationHistory = state.session.conversationHistory.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
        }
        if (state.metadata?.lastUpdated) {
          state.metadata.lastUpdated = new Date(state.metadata.lastUpdated);
        }
      });
      
      return states;
    } catch (error) {
      console.error('❌ Failed to load game states:', error);
      throw error;
    }
  }

  /**
   * Save game states to file
   */
  private saveGameStates(states: Record<string, GameState>): void {
    try {
      writeFileSync(this.gameStatesFile, JSON.stringify(states, null, 2));
      console.log(`💾 Saved enhanced game states to: ${this.gameStatesFile}`);
    } catch (error) {
      console.error('❌ Failed to save game states:', error);
      throw error;
    }
  }

  /**
   * Restore from backup
   */
  restoreBackup(): void {
    if (!existsSync(this.backupFile)) {
      console.log('❌ No backup file found');
      return;
    }

    try {
      const backupData = readFileSync(this.backupFile, 'utf8');
      writeFileSync(this.gameStatesFile, backupData);
      console.log('✅ Restored from backup successfully');
    } catch (error) {
      console.error('❌ Failed to restore backup:', error);
      throw error;
    }
  }

  /**
   * Get migration statistics
   */
  getMigrationStats(): { enhanced: number; legacy: number; total: number } {
    if (!existsSync(this.gameStatesFile)) {
      return { enhanced: 0, legacy: 0, total: 0 };
    }

    const gameStates = this.loadGameStates();
    let enhanced = 0;
    let legacy = 0;

    for (const gameState of Object.values(gameStates)) {
      const allSteps = [
        ...gameState.quests.available.flatMap(q => q.steps),
        ...(gameState.quests.active?.steps || []),
        ...gameState.quests.completed.flatMap(q => q.steps)
      ];

      for (const step of allSteps) {
        if (isEnhancedQuestStep(step)) {
          enhanced++;
        } else {
          legacy++;
        }
      }
    }

    return { enhanced, legacy, total: enhanced + legacy };
  }
}

// CLI interface for migration
export async function runMigration(): Promise<void> {
  const migrator = new QuestStepMigrator();
  
  try {
    // Show current stats
    const beforeStats = migrator.getMigrationStats();
    console.log('📊 Current step status:');
    console.log(`  Enhanced: ${beforeStats.enhanced}`);
    console.log(`  Legacy: ${beforeStats.legacy}`);
    console.log(`  Total: ${beforeStats.total}`);
    
    if (beforeStats.legacy === 0) {
      console.log('🎉 All steps are already enhanced!');
      return;
    }

    // Run migration
    await migrator.migrateAll();
    
    // Show final stats
    const afterStats = migrator.getMigrationStats();
    console.log('\n📊 Final step status:');
    console.log(`  Enhanced: ${afterStats.enhanced}`);
    console.log(`  Legacy: ${afterStats.legacy}`);
    console.log(`  Total: ${afterStats.total}`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    console.log('🔄 Attempting to restore backup...');
    migrator.restoreBackup();
    throw error;
  }
}

// Export for use in other modules
export default QuestStepMigrator;
