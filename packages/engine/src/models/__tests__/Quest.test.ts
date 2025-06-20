import { Quest, QuestStep, QuestStatus } from '@mymcp/types';
import { v4 as uuidv4 } from 'uuid';

describe('Quest Model Tests', () => {
  describe('Quest Creation', () => {
    test('should create a valid quest with all required fields', () => {
      const quest: Quest = {
        id: 'test-quest',
        title: 'Test Quest',
        description: 'A quest for testing',
        realWorldSkill: 'Testing',
        fantasyTheme: 'Dragon Slaying',
        status: 'available',
        steps: [
          {
            id: 'step-1',
            description: 'First step',
            completed: false
          }
        ],
        reward: {
          score: 100,
          items: ['sword', 'shield']
        }
      };

      expect(quest.id).toBe('test-quest');
      expect(quest.title).toBe('Test Quest');
      expect(quest.steps).toHaveLength(1);
      expect(quest.reward.score).toBe(100);
      expect(quest.reward.items).toEqual(['sword', 'shield']);
    });

    test('should create quest without optional reward items', () => {
      const quest: Quest = createTestQuest({
        reward: { score: 50 }
      });

      expect(quest.reward.score).toBe(50);
      expect(quest.reward.items).toBeUndefined();
    });
  });

  describe('Quest Steps', () => {
    test('should handle quest steps with optional data', () => {
      const step: QuestStep = {
        id: 'complex-step',
        description: 'Find three allies',
        completed: false,
        data: {
          alliesFound: ['alice', 'bob'],
          requiredAllies: 3,
          locations: ['forest', 'town']
        }
      };

      expect(step.data).toBeDefined();
      expect(step.data?.alliesFound).toHaveLength(2);
      expect(step.data?.requiredAllies).toBe(3);
    });

    test('should track step completion progress', () => {
      const quest = createTestQuest({
        steps: [
          { id: 'step-1', description: 'Step 1', completed: true },
          { id: 'step-2', description: 'Step 2', completed: true },
          { id: 'step-3', description: 'Step 3', completed: false }
        ]
      });

      const progress = calculateQuestProgress(quest);
      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(3);
      expect(progress.percentage).toBe(66.67);
    });
  });

  describe('Quest Status Transitions', () => {
    const validTransitions = [
      { from: 'available', to: 'active' },
      { from: 'active', to: 'completed' },
      { from: 'active', to: 'failed' },
      { from: 'failed', to: 'available' }
    ];

    test.each(validTransitions)(
      'should allow transition from $from to $to',
      ({ from, to }) => {
        const result = isValidQuestTransition(from as QuestStatus, to as QuestStatus);
        expect(result).toBe(true);
      }
    );

    test('should not allow invalid transitions', () => {
      const invalidTransitions = [
        { from: 'available', to: 'completed' },
        { from: 'completed', to: 'active' },
        { from: 'completed', to: 'failed' }
      ];

      invalidTransitions.forEach(({ from, to }) => {
        const result = isValidQuestTransition(from as QuestStatus, to as QuestStatus);
        expect(result).toBe(false);
      });
    });
  });

  describe('Quest Validation', () => {
    test('should validate quest has at least one step', () => {
      const questWithNoSteps = createTestQuest({ steps: [] });
      expect(isValidQuest(questWithNoSteps)).toBe(false);

      const questWithSteps = createTestQuest({ steps: [createTestStep()] });
      expect(isValidQuest(questWithSteps)).toBe(true);
    });

    test('should validate reward score is positive', () => {
      const questWithNegativeReward = createTestQuest({
        reward: { score: -10 }
      });
      expect(isValidQuestReward(questWithNegativeReward.reward)).toBe(false);

      const questWithPositiveReward = createTestQuest({
        reward: { score: 100 }
      });
      expect(isValidQuestReward(questWithPositiveReward.reward)).toBe(true);
    });

    test('should validate quest completion conditions', () => {
      const incompleteQuest = createTestQuest({
        status: 'active',
        steps: [
          { id: '1', description: 'Step 1', completed: true },
          { id: '2', description: 'Step 2', completed: false }
        ]
      });
      expect(canCompleteQuest(incompleteQuest)).toBe(false);

      const completeQuest = createTestQuest({
        status: 'active',
        steps: [
          { id: '1', description: 'Step 1', completed: true },
          { id: '2', description: 'Step 2', completed: true }
        ]
      });
      expect(canCompleteQuest(completeQuest)).toBe(true);
    });
  });

  describe('Quest Categories', () => {
    test('should categorize quests by real-world skill', () => {
      const quests: Quest[] = [
        createTestQuest({ realWorldSkill: 'Programming' }),
        createTestQuest({ realWorldSkill: 'Programming' }),
        createTestQuest({ realWorldSkill: 'Communication' }),
        createTestQuest({ realWorldSkill: 'Time Management' })
      ];

      const categorized = categorizeQuestsBySkill(quests);
      expect(categorized['Programming']).toHaveLength(2);
      expect(categorized['Communication']).toHaveLength(1);
      expect(categorized['Time Management']).toHaveLength(1);
    });
  });
});

// Helper functions
function createTestQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: uuidv4(),
    title: 'Test Quest',
    description: 'A test quest',
    realWorldSkill: 'Testing',
    fantasyTheme: 'Adventure',
    status: 'available',
    steps: [createTestStep()],
    reward: { score: 100 },
    ...overrides
  };
}

function createTestStep(overrides: Partial<QuestStep> = {}): QuestStep {
  return {
    id: uuidv4(),
    description: 'Test step',
    completed: false,
    ...overrides
  };
}

function calculateQuestProgress(quest: Quest) {
  const completed = quest.steps.filter(step => step.completed).length;
  const total = quest.steps.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100 * 100) / 100 : 0;
  
  return { completed, total, percentage };
}

function isValidQuestTransition(from: QuestStatus, to: QuestStatus): boolean {
  const transitions: Record<QuestStatus, QuestStatus[]> = {
    'available': ['active'],
    'active': ['completed', 'failed'],
    'completed': [],
    'failed': ['available']
  };
  return transitions[from]?.includes(to) ?? false;
}

function isValidQuest(quest: Quest): boolean {
  return quest.steps.length > 0 && 
         quest.title.length > 0 && 
         quest.description.length > 0;
}

function isValidQuestReward(reward: Quest['reward']): boolean {
  return reward.score > 0;
}

function canCompleteQuest(quest: Quest): boolean {
  return quest.status === 'active' && 
         quest.steps.every(step => step.completed);
}

function categorizeQuestsBySkill(quests: Quest[]): Record<string, Quest[]> {
  return quests.reduce((acc, quest) => {
    const skill = quest.realWorldSkill;
    if (!acc[skill]) acc[skill] = [];
    acc[skill].push(quest);
    return acc;
  }, {} as Record<string, Quest[]>);
} 