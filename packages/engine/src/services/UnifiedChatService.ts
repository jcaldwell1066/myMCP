// Enhanced LLM Service with Intent Recognition and Action Execution
// packages/engine/src/services/UnifiedChatService.ts

import { LLMService, LLMResponse } from './LLMService';
import { GameState, GameAction } from '@mymcp/types';
import { v4 as uuidv4 } from 'uuid';

export interface ChatIntent {
  type: 'START_QUEST' | 'COMPLETE_STEP' | 'COMPLETE_QUEST' | 'GET_STATUS' | 'LIST_QUESTS' | 'GET_HELP' | 'GENERAL_CHAT';
  confidence: number;
  parameters?: {
    questId?: string;
    questName?: string;
    stepId?: string;
    stepDescription?: string;
  };
}

export interface UnifiedChatResponse extends LLMResponse {
  actions?: GameAction[];
  intents?: ChatIntent[];
  gameStateUpdated?: boolean;
}

export class UnifiedChatService {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  private analyzeIntent(userMessage: string, gameState: GameState): ChatIntent[] {
    const message = userMessage.toLowerCase();
    const intents: ChatIntent[] = [];

    // Quest starting intents
    if (this.matchesPatterns(message, [
      'start quest', 'begin quest', 'take quest', 'accept quest',
      'new quest', 'want quest', 'ready for quest', 'give me quest'
    ])) {
      const questMatch = this.findQuestReference(message, gameState.quests.available);
      intents.push({
        type: 'START_QUEST',
        confidence: 0.9,
        parameters: questMatch ? { questId: questMatch.id, questName: questMatch.title } : undefined
      });
    }

    // Step completion intents
    if (this.matchesPatterns(message, [
      'completed', 'finished', 'done with', 'found allies', 'coordinated meeting',
      'checked crystals', 'learned theory', 'crafted seal', 'verified seal'
    ])) {
      if (gameState.quests.active) {
        const stepMatch = this.findStepReference(message, gameState.quests.active);
        intents.push({
          type: 'COMPLETE_STEP',
          confidence: 0.8,
          parameters: stepMatch ? { stepId: stepMatch.id, stepDescription: stepMatch.description } : undefined
        });
      }
    }

    // Quest completion intents
    if (this.matchesPatterns(message, [
      'finish quest', 'complete quest', 'done with quest', 'quest complete'
    ])) {
      if (gameState.quests.active) {
        intents.push({
          type: 'COMPLETE_QUEST',
          confidence: 0.9
        });
      }
    }

    // Status inquiry intents
    if (this.matchesPatterns(message, [
      'how am i doing', 'my status', 'my progress', 'my score', 'what level',
      'current status', 'check progress'
    ])) {
      intents.push({
        type: 'GET_STATUS',
        confidence: 0.9
      });
    }

    // Quest listing intents
    if (this.matchesPatterns(message, [
      'available quests', 'what quests', 'show quests', 'list quests',
      'what can i do', 'what adventures'
    ])) {
      intents.push({
        type: 'LIST_QUESTS',
        confidence: 0.9
      });
    }

    // Help intents
    if (this.matchesPatterns(message, [
      'help', 'how to', 'what should i do', 'guide me', 'confused'
    ])) {
      intents.push({
        type: 'GET_HELP',
        confidence: 0.8
      });
    }

    // Default to general chat if no specific intents found
    if (intents.length === 0) {
      intents.push({
        type: 'GENERAL_CHAT',
        confidence: 0.5
      });
    }

    return intents.sort((a, b) => b.confidence - a.confidence);
  }

  private matchesPatterns(message: string, patterns: string[]): boolean {
    return patterns.some(pattern => message.includes(pattern));
  }

  private findQuestReference(message: string, availableQuests: any[]): any | null {
    for (const quest of availableQuests) {
      const questTerms = [
        quest.title.toLowerCase(),
        quest.id.toLowerCase(),
        'council', 'meeting', 'diplomatic',
        'server', 'dungeon', 'crystals',
        'hmac', 'crypto', 'security'
      ];
      
      if (questTerms.some(term => message.includes(term))) {
        return quest;
      }
    }
    return null;
  }

  private findStepReference(message: string, activeQuest: any): any | null {
    for (const step of activeQuest.steps) {
      if (!step.completed) {
        const stepTerms = [
          step.id.toLowerCase(),
          step.description.toLowerCase().split(' ').slice(0, 3).join(' ')
        ];
        
        if (stepTerms.some(term => message.includes(term))) {
          return step;
        }
      }
    }
    return activeQuest.steps.find((s: any) => !s.completed); // Return next incomplete step
  }

  private buildEnhancedPrompt(gameState: GameState, userMessage: string, intents: ChatIntent[]): string {
    const basePrompt = `You are a wise and mystical guide in a fantasy realm. You can help adventurers not only with conversation but also with actual quest management and game actions.

CURRENT GAME STATE:
- Player: ${gameState.player.name} (Level: ${gameState.player.level}, Score: ${gameState.player.score})
- Location: ${gameState.player.location}
- Status: ${gameState.player.status}

ACTIVE QUEST: ${gameState.quests.active ? 
  `"${gameState.quests.active.title}" - ${gameState.quests.active.steps.filter((s: any) => s.completed).length}/${gameState.quests.active.steps.length} steps completed` : 
  'None'}

AVAILABLE QUESTS:
${gameState.quests.available.map((q: any) => `- ${q.title}: ${q.description}`).join('\n')}

DETECTED INTENTS: ${intents.map(i => `${i.type} (${Math.round(i.confidence * 100)}%)`).join(', ')}

SPECIAL ABILITIES:
You can actually execute game actions through conversation! When the player expresses intent to:
- Start a quest: Acknowledge and confirm which quest they want
- Complete a step: Recognize their progress and mark steps complete  
- Check status: Provide detailed progress information
- Get help: Guide them through available options

PERSONALITY: Maintain your fantasy character voice while being genuinely helpful with game mechanics. Use "thee," "thy," and archaic phrasing, but make game actions feel natural and immersive.

User message: "${userMessage}"

Respond as their wise guide, acknowledging their intent and helping them with both conversation AND actual game actions when appropriate.`;

    return basePrompt;
  }

  async generateUnifiedResponse(userMessage: string, gameState: GameState): Promise<UnifiedChatResponse> {
    // Analyze user intent
    const intents = this.analyzeIntent(userMessage, gameState);
    const primaryIntent = intents[0];

    // Build enhanced prompt with intent awareness
    const prompt = this.buildEnhancedPrompt(gameState, userMessage, intents);

    // Generate LLM response
    const llmResponse = await this.llmService.generateResponse(userMessage, gameState);

    // Prepare game actions based on intents
    const actions: GameAction[] = [];
    let gameStateUpdated = false;

    // Execute actions based on high-confidence intents
    if (primaryIntent.confidence >= 0.8) {
      switch (primaryIntent.type) {
        case 'START_QUEST':
          if (primaryIntent.parameters?.questId) {
            actions.push({
              type: 'START_QUEST',
              payload: { questId: primaryIntent.parameters.questId },
              timestamp: new Date(),
              playerId: gameState.player.id
            });
            gameStateUpdated = true;
          }
          break;

        case 'COMPLETE_STEP':
          if (primaryIntent.parameters?.stepId && gameState.quests.active) {
            actions.push({
              type: 'COMPLETE_QUEST_STEP',
              payload: { stepId: primaryIntent.parameters.stepId },
              timestamp: new Date(),
              playerId: gameState.player.id
            });
            gameStateUpdated = true;
          }
          break;

        case 'COMPLETE_QUEST':
          if (gameState.quests.active) {
            actions.push({
              type: 'COMPLETE_QUEST',
              payload: {},
              timestamp: new Date(),
              playerId: gameState.player.id
            });
            gameStateUpdated = true;
          }
          break;
      }
    }

    return {
      ...llmResponse,
      actions,
      intents,
      gameStateUpdated,
      // Enhanced response that acknowledges actions
      text: this.enhanceResponseWithActions(llmResponse.text, primaryIntent, gameState)
    };
  }

  private enhanceResponseWithActions(originalResponse: string, intent: ChatIntent, gameState: GameState): string {
    // Add action confirmations to the AI response
    let enhancedResponse = originalResponse;

    if (intent.confidence >= 0.8) {
      switch (intent.type) {
        case 'START_QUEST':
          if (intent.parameters?.questName) {
            enhancedResponse += `\n\n*I have officially enrolled thee in the "${intent.parameters.questName}" quest. Thy adventure begins now!*`;
          }
          break;

        case 'COMPLETE_STEP':
          if (intent.parameters?.stepDescription) {
            enhancedResponse += `\n\n*Excellent progress! I have marked "${intent.parameters.stepDescription}" as completed. Well done, brave adventurer!*`;
          }
          break;

        case 'COMPLETE_QUEST':
          if (gameState.quests.active) {
            enhancedResponse += `\n\n*Congratulations! Thou hast completed the "${gameState.quests.active.title}" quest! Thy deeds shall be remembered in the annals of history!*`;
          }
          break;
      }
    }

    return enhancedResponse;
  }

  // Expose the underlying LLM service methods
  getAvailableProviders() {
    return this.llmService.getAvailableProviders();
  }

  getProviderStatus() {
    return this.llmService.getProviderStatus();
  }
}
