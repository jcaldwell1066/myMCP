// JavaScript version of Enhanced Quest Step types for immediate use
// This file provides the same interfaces as the TypeScript version but in plain JavaScript

/**
 * Type guard to check if a step is enhanced
 * @param {any} step - The step to check
 * @returns {boolean} - True if the step is enhanced
 */
function isEnhancedQuestStep(step) {
  return step && typeof step === 'object' && 
         'metadata' in step && 
         'resources' in step && 
         'execution' in step && 
         'progress' in step;
}

/**
 * Get step points (legacy compatible)
 * @param {object} step - Enhanced or legacy quest step
 * @returns {number} - Points for the step
 */
function getStepPoints(step) {
  if (isEnhancedQuestStep(step)) {
    return step.metadata.points;
  }
  // Default points for legacy steps
  return 25;
}

/**
 * Get step difficulty (legacy compatible)
 * @param {object} step - Enhanced or legacy quest step
 * @returns {string} - Difficulty level
 */
function getStepDifficulty(step) {
  if (isEnhancedQuestStep(step)) {
    return step.metadata.difficulty;
  }
  return 'medium';
}

/**
 * Create a sample enhanced quest step for testing
 * @param {string} id - Step ID
 * @param {string} title - Step title
 * @param {string} description - Step description
 * @returns {object} - Enhanced quest step
 */
function createSampleEnhancedStep(id, title, description) {
  return {
    // Basic properties (legacy compatible)
    id: id,
    description: description,
    completed: false,
    
    // Enhanced properties
    title: title,
    metadata: {
      difficulty: 'medium',
      category: 'development',
      tags: ['sample', 'test'],
      points: 25,
      estimatedDuration: '15 minutes'
    },
    resources: {
      documentation: [],
      tools: [],
      templates: [],
      codeExamples: []
    },
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

/**
 * Example enhanced quest step with full features
 */
const SAMPLE_ENHANCED_STEP = {
  // Basic properties
  id: 'find-allies',
  description: 'Locate suitable allies in different time zones',
  completed: false,
  
  // Enhanced properties
  title: 'Locate Global Team Members',
  metadata: {
    estimatedDuration: '15 minutes',
    difficulty: 'easy',
    category: 'coordination',
    tags: ['timezone', 'team-building', 'communication'],
    points: 25,
    realWorldSkill: 'Global team coordination'
  },
  resources: {
    documentation: [
      {
        title: 'World Time Zones Reference',
        url: 'https://www.worldtimezone.com/',
        type: 'external',
        description: 'Visual timezone map'
      }
    ],
    tools: [
      {
        name: 'World Clock',
        url: 'https://time.is/',
        description: 'Check current time in multiple zones',
        platform: 'web'
      }
    ],
    templates: [
      {
        name: 'Team Contact Template',
        filename: 'team-contacts.md',
        content: '# Team Member Information\n\n- Name:\n- Timezone:\n- Contact Hours:',
        description: 'Template for documenting team members'
      }
    ]
  },
  execution: {
    type: 'guided',
    launcher: {
      type: 'checklist',
      items: [
        'Identify team members in different continents',
        'Document their local time zones',
        'Record their available hours',
        'Test communication channels'
      ]
    },
    validation: {
      type: 'checklist',
      criteria: [
        'At least 3 team members identified',
        'Spans at least 2 time zones',
        'Contact information verified'
      ]
    },
    hints: [
      'Consider colleagues from different offices',
      'Include people from Americas, Europe, and Asia if possible'
    ]
  },
  progress: {
    attempts: 0,
    notes: [],
    artifacts: []
  }
};

module.exports = {
  isEnhancedQuestStep,
  getStepPoints,
  getStepDifficulty,
  createSampleEnhancedStep,
  SAMPLE_ENHANCED_STEP
};
