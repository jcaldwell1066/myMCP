// Enhanced Quest Step Types for myMCP Engine
// Provides rich metadata, resources, execution context, and progress tracking

export interface QuestStepMetadata {
  estimatedDuration?: string;        // "30 minutes", "1 hour"
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'development' | 'coordination' | 'research' | 'testing' | 'security' | 'devops';
  tags: string[];                   // ["javascript", "api", "async"]
  prerequisites?: string[];         // Other step IDs that must be completed first
  points: number;                   // Points awarded for completion
  realWorldSkill?: string;          // The actual skill being learned
}

export interface QuestStepDocumentation {
  title: string;
  url: string;
  type: 'internal' | 'external' | 'generated';
  description?: string;
}

export interface QuestStepTool {
  name: string;
  url?: string;
  command?: string;
  description: string;
  platform?: 'web' | 'cli' | 'desktop';
}

export interface QuestStepTemplate {
  name: string;
  filename: string;
  content: string;
  description?: string;
  language?: string;
}

export interface QuestStepCodeExample {
  language: string;
  filename: string;
  code: string;
  description: string;
}

export interface QuestStepResource {
  documentation?: QuestStepDocumentation[];
  tools?: QuestStepTool[];
  templates?: QuestStepTemplate[];
  codeExamples?: QuestStepCodeExample[];
}

export interface QuestStepLauncher {
  type: 'url' | 'command' | 'file' | 'checklist' | 'editor';
  target?: string;                  // URL, command, or file path
  items?: string[];                 // For checklist type
  workingDirectory?: string;        // For command execution
  environment?: Record<string, string>; // Environment variables
  description?: string;
}

export interface QuestStepValidation {
  type: 'checklist' | 'test' | 'output' | 'confirmation' | 'file-exists';
  criteria: string[];
  automatedCheck?: {
    command: string;
    expectedOutput?: string;
    expectedExitCode?: number;
    timeoutMs?: number;
  };
}

export interface QuestStepExecution {
  type: 'manual' | 'guided' | 'automated' | 'verification';
  launcher?: QuestStepLauncher;
  validation?: QuestStepValidation;
  hints?: string[];                 // Helpful tips for the user
}

export interface QuestStepArtifact {
  type: 'file' | 'screenshot' | 'log' | 'output' | 'note';
  path: string;
  description: string;
  createdAt: Date;
  size?: number;
}

export interface QuestStepProgress {
  startedAt?: Date;
  completedAt?: Date;
  attempts: number;
  timeSpentMs?: number;             // Actual time spent on the step
  notes: string[];                  // User or system notes
  artifacts: QuestStepArtifact[];   // Files, screenshots, etc.
  lastActivityAt?: Date;
}

// Main enhanced quest step interface
export interface EnhancedQuestStep {
  // Basic properties (compatible with existing system)
  id: string;
  description: string;
  completed: boolean;
  
  // Enhanced properties
  title: string;                    // More descriptive than description
  metadata: QuestStepMetadata;
  resources: QuestStepResource;
  execution: QuestStepExecution;
  progress: QuestStepProgress;
}

// Legacy compatibility type
export interface LegacyQuestStep {
  id: string;
  description: string;
  completed: boolean;
}

// Type guard to check if a step is enhanced
export function isEnhancedQuestStep(step: any): step is EnhancedQuestStep {
  return step && typeof step === 'object' && 
         'metadata' in step && 
         'resources' in step && 
         'execution' in step && 
         'progress' in step;
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
