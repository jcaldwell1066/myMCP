// Quest step enhancement definitions
import { EnhancedQuestStep } from '../types/QuestStep';

export interface StepEnhancement {
  title: string;
  metadata: EnhancedQuestStep['metadata'];
  resources: EnhancedQuestStep['resources'];
  execution: EnhancedQuestStep['execution'];
}

// Map of step IDs to their enhancement definitions
const stepEnhancements: Record<string, StepEnhancement> = {
  // Global Meeting Quest Steps
  'find-allies': {
    title: 'Locate Allies Across Realms',
    metadata: {
      difficulty: 'medium',
      category: 'collaboration',
      tags: ['communication', 'scheduling', 'timezones'],
      points: 30
    },
    resources: {
      docs: ['https://www.timeanddate.com/worldclock/'],
      videos: [],
      examples: ['Consider allies in EST, PST, and GMT timezones']
    },
    execution: {
      type: 'manual',
      validation: {
        type: 'criteria',
        criteria: [
          'Identified at least 3 allies in different timezones',
          'Documented each ally\'s availability window'
        ]
      }
    }
  },
  'coordinate-meeting': {
    title: 'Find Optimal Meeting Time',
    metadata: {
      difficulty: 'hard',
      category: 'collaboration',
      tags: ['scheduling', 'optimization', 'problem-solving'],
      points: 40
    },
    resources: {
      docs: ['https://www.worldtimebuddy.com/'],
      videos: [],
      examples: ['UTC is often used as a neutral reference timezone']
    },
    execution: {
      type: 'manual',
      validation: {
        type: 'criteria',
        criteria: [
          'Found a meeting time that works for all allies',
          'Converted time to each ally\'s local timezone'
        ]
      }
    }
  },
  'confirm-attendance': {
    title: 'Confirm Council Attendance',
    metadata: {
      difficulty: 'easy',
      category: 'collaboration',
      tags: ['communication', 'confirmation'],
      points: 30
    },
    resources: {
      docs: [],
      videos: [],
      examples: ['Send meeting invites with clear timezone information']
    },
    execution: {
      type: 'manual',
      validation: {
        type: 'confirmation',
        criteria: ['All allies have confirmed their attendance']
      }
    }
  },

  // Server Health Quest Steps
  'enter-dungeon': {
    title: 'Enter the Server Caverns',
    metadata: {
      difficulty: 'easy',
      category: 'monitoring',
      tags: ['exploration', 'system-access'],
      points: 25
    },
    resources: {
      docs: [],
      videos: [],
      examples: ['Access your monitoring dashboard or terminal']
    },
    execution: {
      type: 'manual',
      validation: {
        type: 'confirmation',
        criteria: ['Successfully accessed the server monitoring system']
      }
    }
  },
  'check-crystals': {
    title: 'Examine Processing Crystals',
    metadata: {
      difficulty: 'medium',
      category: 'monitoring',
      tags: ['diagnostics', 'metrics', 'analysis'],
      points: 35
    },
    resources: {
      docs: [],
      videos: [],
      examples: ['Check CPU, memory, and disk usage metrics']
    },
    execution: {
      type: 'manual',
      validation: {
        type: 'criteria',
        criteria: [
          'Checked CPU usage levels',
          'Verified memory consumption',
          'Examined disk space availability'
        ]
      }
    }
  },
  'report-status': {
    title: 'Document Crystal Conditions',
    metadata: {
      difficulty: 'easy',
      category: 'documentation',
      tags: ['reporting', 'documentation'],
      points: 25
    },
    resources: {
      docs: [],
      videos: [],
      examples: ['Create a health report with all findings']
    },
    execution: {
      type: 'manual',
      validation: {
        type: 'confirmation',
        criteria: ['Created comprehensive health status report']
      }
    }
  },

  // HMAC Security Quest Steps
  'learn-theory': {
    title: 'Study Cryptographic Texts',
    metadata: {
      difficulty: 'medium',
      category: 'security',
      tags: ['cryptography', 'learning', 'theory'],
      points: 40
    },
    resources: {
      docs: ['https://en.wikipedia.org/wiki/HMAC'],
      videos: [],
      examples: ['HMAC = Hash-based Message Authentication Code']
    },
    execution: {
      type: 'manual',
      validation: {
        type: 'criteria',
        criteria: [
          'Understand what HMAC is',
          'Know why HMAC is used for authentication',
          'Can explain the basic HMAC algorithm'
        ]
      }
    }
  },
  'craft-seal': {
    title: 'Create Authentication Seal',
    metadata: {
      difficulty: 'hard',
      category: 'security',
      tags: ['implementation', 'coding', 'cryptography'],
      points: 50
    },
    resources: {
      docs: [],
      videos: [],
      examples: ['const hmac = crypto.createHmac("sha256", secret)']
    },
    execution: {
      type: 'manual',
      validation: {
        type: 'criteria',
        criteria: [
          'Implemented HMAC generation',
          'Used a secure secret key',
          'Can generate HMAC for messages'
        ]
      }
    }
  },
  'verify-seal': {
    title: 'Prove Seal Authenticity',
    metadata: {
      difficulty: 'medium',
      category: 'security',
      tags: ['verification', 'testing', 'cryptography'],
      points: 35
    },
    resources: {
      docs: [],
      videos: [],
      examples: ['Compare generated HMAC with expected value']
    },
    execution: {
      type: 'manual',
      validation: {
        type: 'criteria',
        criteria: [
          'Successfully verified a valid HMAC',
          'Detected an invalid/tampered HMAC',
          'Demonstrated the security properties'
        ]
      }
    }
  }
};

/**
 * Get enhancement definition for a step
 */
export function getStepEnhancement(stepId: string): StepEnhancement | null {
  return stepEnhancements[stepId] || null;
}

/**
 * Get all enhancement definitions
 */
export function getAllStepEnhancements(): Record<string, StepEnhancement> {
  return stepEnhancements;
}

/**
 * Check if a step ID has an enhancement
 */
export function hasStepEnhancement(stepId: string): boolean {
  return stepId in stepEnhancements;
} 