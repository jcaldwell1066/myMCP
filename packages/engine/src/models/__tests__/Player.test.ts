import { Player, PlayerLevel, PlayerStatus, LocationStatus } from '@mymcp/types';
import { v4 as uuidv4 } from 'uuid';

describe('Player Model Tests', () => {
  describe('Player Creation', () => {
    test('should create a valid player with all required fields', () => {
      const player: Player = {
        id: uuidv4(),
        name: 'Test Hero',
        score: 0,
        level: 'novice',
        status: 'idle',
        location: 'town'
      };

      expect(player.id).toBeDefined();
      expect(player.name).toBe('Test Hero');
      expect(player.score).toBe(0);
      expect(player.level).toBe('novice');
      expect(player.status).toBe('idle');
      expect(player.location).toBe('town');
    });

    test('should create a player with optional currentQuest', () => {
      const player: Player = {
        id: uuidv4(),
        name: 'Quest Hero',
        score: 100,
        level: 'apprentice',
        status: 'in-quest',
        location: 'forest',
        currentQuest: 'global-meeting'
      };

      expect(player.currentQuest).toBe('global-meeting');
    });
  });

  describe('Player Level Progression', () => {
    const levelThresholds = [
      { score: 0, expectedLevel: 'novice' },
      { score: 99, expectedLevel: 'novice' },
      { score: 100, expectedLevel: 'apprentice' },
      { score: 499, expectedLevel: 'apprentice' },
      { score: 500, expectedLevel: 'expert' },
      { score: 999, expectedLevel: 'expert' },
      { score: 1000, expectedLevel: 'master' },
      { score: 5000, expectedLevel: 'master' }
    ];

    test.each(levelThresholds)(
      'player with score $score should be level $expectedLevel',
      ({ score, expectedLevel }) => {
        const level = calculatePlayerLevel(score);
        expect(level).toBe(expectedLevel);
      }
    );
  });

  describe('Player Status Transitions', () => {
    const validTransitions = [
      { from: 'idle', to: 'chatting', valid: true },
      { from: 'idle', to: 'in-quest', valid: true },
      { from: 'chatting', to: 'idle', valid: true },
      { from: 'chatting', to: 'in-quest', valid: true },
      { from: 'in-quest', to: 'completed-quest', valid: true },
      { from: 'in-quest', to: 'idle', valid: true },
      { from: 'completed-quest', to: 'idle', valid: true }
    ];

    test.each(validTransitions)(
      'should allow transition from $from to $to',
      ({ from, to, valid }) => {
        const result = isValidStatusTransition(from as PlayerStatus, to as PlayerStatus);
        expect(result).toBe(valid);
      }
    );
  });

  describe('Player Location Validation', () => {
    const locations: LocationStatus[] = ['town', 'forest', 'cave', 'shop'];
    
    test.each(locations)('should accept valid location: %s', (location) => {
      const player: Player = createTestPlayer({ location });
      expect(player.location).toBe(location);
    });

    test('should validate location transitions', () => {
      const transitions = [
        { from: 'town', to: 'forest', distance: 1 },
        { from: 'town', to: 'shop', distance: 0 },
        { from: 'forest', to: 'cave', distance: 1 },
        { from: 'cave', to: 'town', distance: 2 }
      ];

      transitions.forEach(({ from, to, distance }) => {
        const result = getLocationDistance(from as LocationStatus, to as LocationStatus);
        expect(result).toBe(distance);
      });
    });
  });

  describe('Player Validation', () => {
    test('should validate player name constraints', () => {
      const validNames = ['Hero', 'Dark Knight', 'Alice-123', 'Bob_456'];
      const invalidNames = ['', 'a', 'a'.repeat(51), '<script>', 'admin@hack'];

      validNames.forEach(name => {
        expect(isValidPlayerName(name)).toBe(true);
      });

      invalidNames.forEach(name => {
        expect(isValidPlayerName(name)).toBe(false);
      });
    });

    test('should validate score boundaries', () => {
      expect(isValidScore(-1)).toBe(false);
      expect(isValidScore(0)).toBe(true);
      expect(isValidScore(9999)).toBe(true);
      expect(isValidScore(10000)).toBe(true);
      expect(isValidScore(Number.MAX_SAFE_INTEGER)).toBe(true);
    });
  });
});

// Helper functions that would be in the actual implementation
function calculatePlayerLevel(score: number): PlayerLevel {
  if (score >= 1000) return 'master';
  if (score >= 500) return 'expert';
  if (score >= 100) return 'apprentice';
  return 'novice';
}

function isValidStatusTransition(from: PlayerStatus, to: PlayerStatus): boolean {
  const transitions: Record<PlayerStatus, PlayerStatus[]> = {
    'idle': ['chatting', 'in-quest'],
    'chatting': ['idle', 'in-quest'],
    'in-quest': ['idle', 'completed-quest'],
    'completed-quest': ['idle']
  };
  return transitions[from]?.includes(to) ?? false;
}

function createTestPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: uuidv4(),
    name: 'Test Player',
    score: 0,
    level: 'novice',
    status: 'idle',
    location: 'town',
    ...overrides
  };
}

function getLocationDistance(from: LocationStatus, to: LocationStatus): number {
  const distances: Record<string, Record<string, number>> = {
    'town': { 'town': 0, 'forest': 1, 'cave': 2, 'shop': 0 },
    'forest': { 'town': 1, 'forest': 0, 'cave': 1, 'shop': 2 },
    'cave': { 'town': 2, 'forest': 1, 'cave': 0, 'shop': 3 },
    'shop': { 'town': 0, 'forest': 2, 'cave': 3, 'shop': 0 }
  };
  return distances[from]?.[to] ?? -1;
}

function isValidPlayerName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 50) return false;
  return /^[a-zA-Z0-9_\- ]+$/.test(name);
}

function isValidScore(score: number): boolean {
  return Number.isInteger(score) && score >= 0 && score <= Number.MAX_SAFE_INTEGER;
} 