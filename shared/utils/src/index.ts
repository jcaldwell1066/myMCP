// Shared utility functions for myMCP project

import { GameState, Player, Quest } from '@mymcp/types';

/**
 * Validates a game state object
 */
export function validateGameState(state: any): state is GameState {
  return (
    state &&
    typeof state === 'object' &&
    state.player &&
    state.quests &&
    state.inventory &&
    state.session &&
    state.metadata
  );
}

/**
 * Creates a new player with default values
 */
export function createDefaultPlayer(id: string, name: string): Player {
  return {
    id,
    name,
    score: 0,
    level: 'novice',
    status: 'idle',
    location: 'town',
  };
}

/**
 * Calculates timezone offset for meeting coordination
 */
export function calculateTimezoneOffset(timezone: string): number {
  // Simple timezone offset calculation for demo
  const offsets: Record<string, number> = {
    'GMT-8': -8,
    'GMT-5': -5,
    'GMT+0': 0,
    'GMT+1': 1,
    'GMT+8': 8,
  };
  return offsets[timezone] || 0;
}

/**
 * Finds optimal meeting time across timezones
 */
export function findOptimalMeetingTime(
  timezones: string[],
  workingHours = { start: 9, end: 17 }
): string | null {
  // Simplified algorithm for demo
  const offsets = timezones.map(tz => calculateTimezoneOffset(tz));
  
  // Find a time that works for all zones (simplified)
  for (let hour = workingHours.start; hour <= workingHours.end; hour++) {
    const allValidTimes = offsets.every(offset => {
      const localHour = (hour + offset + 24) % 24;
      return localHour >= workingHours.start && localHour <= workingHours.end;
    });
    
    if (allValidTimes) {
      return `${hour}:00 UTC`;
    }
  }
  
  return null;
}

/**
 * Generates a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formats score for display
 */
export function formatScore(score: number): string {
  if (score >= 1000) {
    return `${(score / 1000).toFixed(1)}k`;
  }
  return score.toString();
}

/**
 * Determines player level based on score
 */
export function calculatePlayerLevel(score: number): Player['level'] {
  if (score >= 1000) return 'master';
  if (score >= 500) return 'expert';
  if (score >= 100) return 'apprentice';
  return 'novice';
}

/**
 * Checks if a quest is available to start
 */
export function isQuestAvailable(quest: Quest, playerLevel: Player['level']): boolean {
  // Simple level-based quest availability
  const levelOrder = ['novice', 'apprentice', 'expert', 'master'];
  const playerLevelIndex = levelOrder.indexOf(playerLevel);
  
  // For demo, all quests are available to all levels
  return quest.status === 'available';
}

/**
 * Simple logging utility
 */
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || '');
    }
  },
};
