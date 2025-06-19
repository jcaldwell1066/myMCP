// Enhanced Quest Step Types for myMCP Engine
// Provides rich metadata, resources, execution context, and progress tracking

import { QuestStep } from '@mymcp/types';

// Legacy step format (basic)
export type LegacyQuestStep = QuestStep;

// Enhanced quest step with rich metadata
export interface EnhancedQuestStep extends QuestStep {
  title: string;
  metadata: {
    difficulty: 'easy' | 'medium' | 'hard';
    category: 'development' | 'coordination' | 'research' | 'testing' | 'security' | 'devops' | 'collaboration' | 'monitoring' | 'documentation';
    tags: string[];
    points: number;
  };
  resources: {
    docs?: string[];
    videos?: string[];
    examples?: string[];
  };
  execution: {
    type: 'manual' | 'automated' | 'hybrid';
    validation: {
      type: 'checklist' | 'test' | 'output' | 'confirmation' | 'file-exists' | 'criteria';
      criteria: string[];
    };
  };
  progress: {
    attempts: number;
    notes: string[];
    artifacts: string[];
  };
}

// Type guard to check if a step is enhanced
export function isEnhancedQuestStep(step: QuestStep | EnhancedQuestStep): step is EnhancedQuestStep {
  return 'title' in step && 'metadata' in step && 'resources' in step && 'execution' in step;
}

// Helper function to get step points (legacy compatible)
export function getStepPoints(step: EnhancedQuestStep | LegacyQuestStep): number {
  if (isEnhancedQuestStep(step)) {
    return step.metadata.points;
  }
  // Default points for legacy steps
  return 25;
}

// Helper function to get step difficulty (legacy compatible)
export function getStepDifficulty(step: EnhancedQuestStep | LegacyQuestStep): string {
  if (isEnhancedQuestStep(step)) {
    return step.metadata.difficulty;
  }
  return 'medium';
}
