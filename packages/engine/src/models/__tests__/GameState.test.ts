import { GameState, Player, Quest, Inventory, GameSession } from '@mymcp/types';
import { v4 as uuidv4 } from 'uuid';

describe('GameState Model Tests', () => {
  describe('GameState Creation', () => {
    test('should create a valid complete game state', () => {
      const gameState: GameState = createTestGameState();

      expect(gameState.player).toBeDefined();
      expect(gameState.quests).toBeDefined();
      expect(gameState.inventory).toBeDefined();
      expect(gameState.session).toBeDefined();
      expect(gameState.metadata).toBeDefined();
      expect(gameState.metadata.version).toBe('1.0.0');
    });

    test('should create game state with specific player data', () => {
      const player: Player = {
        id: 'test-player',
        name: 'Hero',
        score: 250,
        level: 'apprentice',
        status: 'in-quest',
        location: 'forest',
        currentQuest: 'quest-1'
      };

      const gameState = createTestGameState({ player });
      expect(gameState.player).toEqual(player);
    });
  });

  describe('GameState Validation', () => {
    test('should validate complete game state', () => {
      const validState = createTestGameState();
      expect(isValidGameState(validState)).toBe(true);
    });

    test('should detect invalid game states', () => {
      const invalidStates = [
        { ...createTestGameState(), player: null },
        { ...createTestGameState(), quests: null },
        { ...createTestGameState(), inventory: null },
        { ...createTestGameState(), session: null },
        { ...createTestGameState(), metadata: null }
      ];

      invalidStates.forEach(state => {
        expect(isValidGameState(state as any)).toBe(false);
      });
    });

    test('should validate quest consistency', () => {
      const gameState = createTestGameState({
        player: { ...createDefaultPlayer(), currentQuest: 'quest-1' },
        quests: {
          available: [],
          active: { id: 'quest-1', title: 'Active Quest' } as Quest,
          completed: []
        }
      });

      expect(isQuestStateConsistent(gameState)).toBe(true);

      // Inconsistent state - player has currentQuest but no active quest
      const inconsistentState = createTestGameState({
        player: { ...createDefaultPlayer(), currentQuest: 'quest-1' },
        quests: { available: [], active: null, completed: [] }
      });

      expect(isQuestStateConsistent(inconsistentState)).toBe(false);
    });
  });

  describe('GameState Transitions', () => {
    test('should transition from idle to quest state', () => {
      const initialState = createTestGameState({
        player: { ...createDefaultPlayer(), status: 'idle' }
      });

      const quest: Quest = {
        id: 'new-quest',
        title: 'New Quest',
        description: 'Start a new adventure',
        realWorldSkill: 'Problem Solving',
        fantasyTheme: 'Dragon Quest',
        status: 'available',
        steps: [{ id: 'step-1', description: 'First step', completed: false }],
        reward: { score: 100 }
      };

      const newState = startQuest(initialState, quest);
      
      expect(newState.player.status).toBe('in-quest');
      expect(newState.player.currentQuest).toBe('new-quest');
      expect(newState.quests.active).toEqual({ ...quest, status: 'active' });
      expect(newState.quests.available).not.toContain(quest);
    });

    test('should complete quest and update state', () => {
      const activeQuest: Quest = {
        id: 'active-quest',
        title: 'Active Quest',
        description: 'Complete this quest',
        realWorldSkill: 'Testing',
        fantasyTheme: 'Adventure',
        status: 'active',
        steps: [
          { id: 'step-1', description: 'Step 1', completed: true },
          { id: 'step-2', description: 'Step 2', completed: true }
        ],
        reward: { score: 200, items: ['sword'] }
      };

      const initialState = createTestGameState({
        player: { 
          ...createDefaultPlayer(), 
          status: 'in-quest',
          currentQuest: 'active-quest',
          score: 100
        },
        quests: {
          available: [],
          active: activeQuest,
          completed: []
        }
      });

      const newState = completeQuest(initialState);
      
      expect(newState.player.status).toBe('completed-quest');
      expect(newState.player.currentQuest).toBeUndefined();
      expect(newState.player.score).toBe(300); // 100 + 200 reward
      expect(newState.quests.active).toBeNull();
      expect(newState.quests.completed).toContainEqual({
        ...activeQuest,
        status: 'completed'
      });
      expect(newState.inventory.items).toHaveLength(1);
      expect(newState.inventory.items[0].name).toBe('sword');
    });
  });

  describe('GameState Queries', () => {
    test('should calculate overall progress', () => {
      const gameState = createTestGameState({
        quests: {
          available: [createTestQuest(), createTestQuest()],
          active: createTestQuest(),
          completed: [createTestQuest(), createTestQuest(), createTestQuest()]
        }
      });

      const progress = calculateOverallProgress(gameState);
      expect(progress.totalQuests).toBe(6);
      expect(progress.completedQuests).toBe(3);
      expect(progress.completionPercentage).toBe(50);
    });

    test('should check if player can start new quest', () => {
      const idleState = createTestGameState({
        player: { ...createDefaultPlayer(), status: 'idle' }
      });
      expect(canStartNewQuest(idleState)).toBe(true);

      const busyState = createTestGameState({
        player: { ...createDefaultPlayer(), status: 'in-quest' },
        quests: { ...idleState.quests, active: createTestQuest() }
      });
      expect(canStartNewQuest(busyState)).toBe(false);
    });

    test('should get next available quest', () => {
      const gameState = createTestGameState({
        quests: {
          available: [
            createTestQuest({ id: 'quest-1', title: 'First Quest' }),
            createTestQuest({ id: 'quest-2', title: 'Second Quest' })
          ],
          active: null,
          completed: []
        }
      });

      const nextQuest = getNextAvailableQuest(gameState);
      expect(nextQuest).toBeDefined();
      expect(nextQuest?.id).toBe('quest-1');
    });
  });

  describe('GameState Serialization', () => {
    test('should serialize and deserialize game state', () => {
      const originalState = createTestGameState({
        player: {
          ...createDefaultPlayer(),
          score: 500,
          level: 'expert'
        }
      });

      const serialized = serializeGameState(originalState);
      expect(typeof serialized).toBe('string');

      const deserialized = deserializeGameState(serialized);
      expect(deserialized.player.score).toBe(500);
      expect(deserialized.player.level).toBe('expert');
      expect(deserialized.metadata.lastUpdated).toBeInstanceOf(Date);
      expect(deserialized.session.startTime).toBeInstanceOf(Date);
    });

    test('should handle serialization errors gracefully', () => {
      const invalidJson = '{ invalid json }';
      const result = deserializeGameState(invalidJson);
      expect(result).toBeNull();
    });
  });

  describe('GameState Merging', () => {
    test('should merge partial state updates', () => {
      const baseState = createTestGameState();
      const updates: Partial<GameState> = {
        player: {
          ...baseState.player,
          score: 999,
          level: 'master'
        }
      };

      const mergedState = mergeGameState(baseState, updates);
      expect(mergedState.player.score).toBe(999);
      expect(mergedState.player.level).toBe('master');
      expect(mergedState.quests).toEqual(baseState.quests);
    });

    test('should deep merge nested updates', () => {
      const baseState = createTestGameState();
      const updates: Partial<GameState> = {
        quests: {
          ...baseState.quests,
          completed: [createTestQuest({ id: 'completed-1' })]
        }
      };

      const mergedState = mergeGameState(baseState, updates);
      expect(mergedState.quests.completed).toHaveLength(1);
      expect(mergedState.quests.available).toEqual(baseState.quests.available);
    });
  });
});

// Helper functions
function createTestGameState(overrides: Partial<GameState> = {}): GameState {
  const now = new Date();
  return {
    player: createDefaultPlayer(),
    quests: {
      available: [createTestQuest()],
      active: null,
      completed: []
    },
    inventory: {
      items: [],
      capacity: 10,
      status: 'empty'
    },
    session: {
      id: uuidv4(),
      startTime: now,
      lastAction: now,
      turnCount: 0,
      conversationHistory: []
    },
    metadata: {
      version: '1.0.0',
      lastUpdated: now
    },
    ...overrides
  };
}

function createDefaultPlayer(): Player {
  return {
    id: uuidv4(),
    name: 'Test Player',
    score: 0,
    level: 'novice',
    status: 'idle',
    location: 'town'
  };
}

function createTestQuest(overrides: Partial<Quest> = {}): Quest {
  return {
    id: uuidv4(),
    title: 'Test Quest',
    description: 'A test quest',
    realWorldSkill: 'Testing',
    fantasyTheme: 'Adventure',
    status: 'available',
    steps: [
      { id: 'step-1', description: 'First step', completed: false }
    ],
    reward: { score: 100 },
    ...overrides
  };
}

function isValidGameState(state: GameState): boolean {
  return !!(
    state?.player &&
    state?.quests &&
    state?.inventory &&
    state?.session &&
    state?.metadata
  );
}

function isQuestStateConsistent(state: GameState): boolean {
  const { player, quests } = state;
  
  if (player.currentQuest && !quests.active) return false;
  if (!player.currentQuest && quests.active) return false;
  if (player.currentQuest && quests.active && player.currentQuest !== quests.active.id) return false;
  
  return true;
}

function startQuest(state: GameState, quest: Quest): GameState {
  const questIndex = state.quests.available.findIndex(q => q.id === quest.id);
  if (questIndex === -1) return state;

  const newAvailable = [...state.quests.available];
  newAvailable.splice(questIndex, 1);

  return {
    ...state,
    player: {
      ...state.player,
      status: 'in-quest',
      currentQuest: quest.id
    },
    quests: {
      ...state.quests,
      available: newAvailable,
      active: { ...quest, status: 'active' }
    }
  };
}

function completeQuest(state: GameState): GameState {
  if (!state.quests.active) return state;

  const completedQuest = { ...state.quests.active, status: 'completed' as const };
  const rewardItems = completedQuest.reward.items || [];
  
  return {
    ...state,
    player: {
      ...state.player,
      status: 'completed-quest',
      currentQuest: undefined,
      score: state.player.score + completedQuest.reward.score
    },
    quests: {
      ...state.quests,
      active: null,
      completed: [...state.quests.completed, completedQuest]
    },
    inventory: {
      ...state.inventory,
      items: [
        ...state.inventory.items,
        ...rewardItems.map(name => ({
          id: uuidv4(),
          name,
          description: `Reward from ${completedQuest.title}`,
          type: 'treasure' as const
        }))
      ],
      status: state.inventory.items.length + rewardItems.length > 0 ? 'has-item' : 'empty'
    }
  };
}

function calculateOverallProgress(state: GameState) {
  const totalQuests = state.quests.available.length + 
                     (state.quests.active ? 1 : 0) + 
                     state.quests.completed.length;
  const completedQuests = state.quests.completed.length;
  const completionPercentage = totalQuests > 0 
    ? Math.round((completedQuests / totalQuests) * 100)
    : 0;

  return { totalQuests, completedQuests, completionPercentage };
}

function canStartNewQuest(state: GameState): boolean {
  return state.player.status === 'idle' && !state.quests.active;
}

function getNextAvailableQuest(state: GameState): Quest | null {
  return state.quests.available[0] || null;
}

function serializeGameState(state: GameState): string {
  return JSON.stringify(state);
}

function deserializeGameState(json: string): GameState | null {
  try {
    const parsed = JSON.parse(json);
    
    // Convert date strings back to Date objects
    parsed.metadata.lastUpdated = new Date(parsed.metadata.lastUpdated);
    parsed.session.startTime = new Date(parsed.session.startTime);
    parsed.session.lastAction = new Date(parsed.session.lastAction);
    parsed.session.conversationHistory.forEach((msg: any) => {
      msg.timestamp = new Date(msg.timestamp);
    });
    
    return parsed;
  } catch (error) {
    return null;
  }
}

function mergeGameState(base: GameState, updates: Partial<GameState>): GameState {
  return {
    ...base,
    ...updates,
    player: updates.player || base.player,
    quests: updates.quests || base.quests,
    inventory: updates.inventory || base.inventory,
    session: updates.session || base.session,
    metadata: {
      ...base.metadata,
      ...updates.metadata,
      lastUpdated: new Date()
    }
  };
} 