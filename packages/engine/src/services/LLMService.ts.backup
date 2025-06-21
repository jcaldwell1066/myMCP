// packages/engine/src/services/LLMService.ts

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import NodeCache from 'node-cache';
import crypto from 'crypto';
import { GameState, ChatMessage } from '@mymcp/types';

export type LLMProvider = 'openai' | 'anthropic' | 'ollama' | 'fallback';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
  apiKey?: string;
  baseURL?: string;
}

export interface LLMResponse {
  text: string;
  metadata: {
    provider: LLMProvider;
    model: string;
    tokensUsed: number;
    responseTime: number;
    cached: boolean;
    confidence: number;
    contentFiltered: boolean;
  };
}

export interface NarrativeContext {
  player: {
    name: string;
    level: string;
    score: number;
    location: string;
    status: string;
  };
  quest?: {
    title: string;
    description: string;
    progress: string;
    nextStep?: string;
  };
  conversation: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  inventory: string[];
  timeOfDay: string;
  mood: string;
}

class ContextWindowManager {
  private maxTokens: number;

  constructor(maxTokens: number = 4000) {
    this.maxTokens = maxTokens;
  }

  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  trimContext(context: NarrativeContext, maxTokens: number): NarrativeContext {
    const trimmedContext = { ...context };
    
    // Prioritize: current quest > recent messages > older history
    let currentTokens = this.estimateTokens(JSON.stringify(trimmedContext));
    
    if (currentTokens <= maxTokens) {
      return trimmedContext;
    }

    // Trim conversation history from oldest first
    while (currentTokens > maxTokens && trimmedContext.conversation.length > 2) {
      trimmedContext.conversation.splice(1, 1); // Keep first and last message
      currentTokens = this.estimateTokens(JSON.stringify(trimmedContext));
    }

    return trimmedContext;
  }
}

export class LLMService {
  private openaiClient?: OpenAI;
  private anthropicClient?: Anthropic;
  private cache: NodeCache;
  private contextManager: ContextWindowManager;
  private configs: Map<LLMProvider, LLMConfig>;

  constructor() {
    this.cache = new NodeCache({ stdTTL: 300 }); // 5 minutes
    this.contextManager = new ContextWindowManager();
    this.configs = new Map();
    this.initializeProviders();
  }

  private initializeProviders() {
    console.log('🤖 Initializing LLM providers...');
    console.log('🔍 Current working directory:', process.cwd());
    console.log('🔍 Environment check:');
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
    console.log('  - ANTHROPIC_API_KEY present:', !!process.env.ANTHROPIC_API_KEY);
    console.log('  - ANTHROPIC_API_KEY length:', process.env.ANTHROPIC_API_KEY?.length || 0);
    console.log('  - OPENAI_API_KEY present:', !!process.env.OPENAI_API_KEY);
    
    // OpenAI Configuration
    if (process.env.OPENAI_API_KEY) {
      console.log('✅ OpenAI API key found, initializing...');
      this.openaiClient = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.configs.set('openai', {
        provider: 'openai',
        model: 'gpt-4',
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 30000,
      });
    } else {
      console.log('❌ OpenAI API key not found');
    }

    // Anthropic Configuration
    if (process.env.ANTHROPIC_API_KEY) {
      console.log('✅ Anthropic API key found, initializing...');
      this.anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      this.configs.set('anthropic', {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 30000,
      });
    } else {
      console.log('❌ Anthropic API key not found');
    }

    // Ollama Configuration
    if (process.env.OLLAMA_API_KEY || process.env.OLLAMA_BASE_URL) {
      console.log('✅ Ollama configuration found, initializing...');
      this.configs.set('ollama', {
        provider: 'ollama',
        model: 'llama2',
        maxTokens: 1000,
        temperature: 0.7,
        timeout: 30000,
        baseURL: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      });
    }

    const providerCount = this.configs.size;
    console.log(`🎯 Initialized ${providerCount} LLM provider(s): ${Array.from(this.configs.keys()).join(', ')}`);
  }

  private buildContext(gameState: GameState): NarrativeContext {
    const currentTime = new Date();
    const hour = currentTime.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    
    // Determine mood based on quest progress and score
    let mood = 'neutral';
    if (gameState.quests.active) {
      const progress = gameState.quests.active.steps.filter((s: any) => s.completed).length;
      const total = gameState.quests.active.steps.length;
      mood = progress / total > 0.5 ? 'encouraging' : 'motivating';
    } else if (gameState.player.score > 500) {
      mood = 'accomplished';
    }

    const context: NarrativeContext = {
      player: {
        name: gameState.player.name,
        level: gameState.player.level,
        score: gameState.player.score,
        location: gameState.player.location,
        status: gameState.player.status,
      },
      conversation: gameState.session.conversationHistory.slice(-10).map((msg: ChatMessage) => ({
        role: msg.sender === 'player' ? 'user' : 'assistant',
        content: msg.message,
        timestamp: msg.timestamp,
      })),
      inventory: gameState.inventory.items.map((item: any) => item.name),
      timeOfDay,
      mood,
    };

    // Add quest context if active
    if (gameState.quests.active) {
      const quest = gameState.quests.active;
      const completedSteps = quest.steps.filter((s: any) => s.completed).length;
      const nextStep = quest.steps.find((s: any) => !s.completed);
      
      context.quest = {
        title: quest.title,
        description: quest.description,
        progress: `${completedSteps}/${quest.steps.length} steps completed`,
        nextStep: nextStep?.description,
      };
    }

    return context;
  }

  private buildPrompt(context: NarrativeContext, userMessage: string): string {
    const systemPrompt = `You are a wise and mystical guide in a fantasy realm, helping adventurers on their quests. You speak with warmth and ancient wisdom, using fantasy-themed language while being genuinely helpful.

CURRENT CONTEXT:
- Adventurer: ${context.player.name} (Level: ${context.player.level})
- Location: ${context.player.location}
- Score: ${context.player.score} points
- Time: ${context.timeOfDay}
- Mood: ${context.mood}
${context.quest ? `- Active Quest: "${context.quest.title}" - ${context.quest.progress}` : '- No active quest'}
${context.quest?.nextStep ? `- Next Step: ${context.quest.nextStep}` : ''}
${context.inventory.length > 0 ? `- Items: ${context.inventory.join(', ')}` : '- No items'}

PERSONALITY GUIDELINES:
- Maintain fantasy character voice (use "thee," "thy," archaic phrasing)
- Reference the adventurer's current situation naturally
- Provide helpful guidance for quests when relevant
- Be encouraging but not overly verbose
- Stay in character while being genuinely useful
- Adapt your tone to match the player's level and mood

CONVERSATION HISTORY:
${context.conversation.slice(-3).map(msg => `${msg.role}: ${msg.content}`).join('\n')}

Respond to the adventurer's message with wisdom and personality:`;

    return systemPrompt;
  }

  private generateCacheKey(context: NarrativeContext, userMessage: string): string {
    const semanticContext = {
      questId: context.quest?.title,
      playerLevel: context.player.level,
      location: context.player.location,
      messageType: this.classifyMessage(userMessage),
      messageHash: crypto.createHash('md5').update(userMessage.toLowerCase()).digest('hex'),
    };
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(semanticContext))
      .digest('hex');
  }

  private classifyMessage(message: string): string {
    const msg = message.toLowerCase();
    if (msg.includes('quest') || msg.includes('adventure')) return 'quest';
    if (msg.includes('help') || msg.includes('how')) return 'help';
    if (msg.includes('status') || msg.includes('score')) return 'status';
    if (msg.includes('hello') || msg.includes('hi')) return 'greeting';
    return 'general';
  }

  private async callOpenAI(prompt: string, userMessage: string): Promise<string> {
    if (!this.openaiClient) throw new Error('OpenAI not configured');
    
    const response = await this.openaiClient.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || '';
  }

  private async callAnthropic(prompt: string, userMessage: string): Promise<string> {
    if (!this.anthropicClient) throw new Error('Anthropic not configured');
    
    const response = await this.anthropicClient.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        { role: 'user', content: `${prompt}\n\nUser message: ${userMessage}` }
      ],
    });

    const content = response.content[0];
    return content.type === 'text' ? content.text : '';
  }

  private async callOllama(prompt: string, userMessage: string): Promise<string> {
    const config = this.configs.get('ollama');
    if (!config) throw new Error('Ollama not configured');

    const response = await axios.post(`${config.baseURL}/api/generate`, {
      model: config.model,
      prompt: `${prompt}\n\nUser: ${userMessage}\nAssistant:`,
      stream: false,
    }, {
      timeout: config.timeout,
      headers: config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {},
    });

    return response.data.response || '';
  }

  private generateFallbackResponse(context: NarrativeContext, userMessage: string): string {
    const templates = {
      greeting: `Greetings, ${context.player.name}! The mystical energies of ${context.player.location} welcome thee in this ${context.timeOfDay}. How may this humble guide assist thy journey?`,
      quest: context.quest 
        ? `Thy current quest "${context.quest.title}" progresses well, brave ${context.player.name}. ${context.quest.nextStep ? `The next step awaits: ${context.quest.nextStep}` : 'Thou art making excellent progress!'}`
        : `No quest currently binds thee, ${context.player.name}. Perhaps 'tis time to seek new adventures? The realm has many challenges for one of thy ${context.player.level} level.`,
      status: `Thou hast earned ${context.player.score} points in thy adventures, achieving the rank of ${context.player.level}. ${context.inventory.length > 0 ? `Thy possessions include: ${context.inventory.join(', ')}.` : 'Thy inventory awaits treasures from future quests.'}`,
      help: `Fear not, brave adventurer! This guide shall aid thee. Ask about thy quests, check thy status, or simply converse about the mysteries of the realm.`,
      general: `The ancient texts whisper of such things, ${context.player.name}. Tell me more of thy thoughts, that I might offer wisdom gained through countless ages.`,
    };

    const messageType = this.classifyMessage(userMessage);
    return templates[messageType as keyof typeof templates] || templates.general;
  }

  async generateResponse(userMessage: string, gameState: GameState): Promise<LLMResponse> {
    const startTime = Date.now();
    const context = this.buildContext(gameState);
    const trimmedContext = this.contextManager.trimContext(context, 3000);
    
    // Check cache first
    const cacheKey = this.generateCacheKey(trimmedContext, userMessage);
    const cached = this.cache.get<string>(cacheKey);
    
    if (cached) {
      return {
        text: cached,
        metadata: {
          provider: 'openai', // Default for cached
          model: 'cached',
          tokensUsed: 0,
          responseTime: Date.now() - startTime,
          cached: true,
          confidence: 0.9,
          contentFiltered: false,
        },
      };
    }

    const prompt = this.buildPrompt(trimmedContext, userMessage);
    
    // Try providers in order of preference
    const providers: LLMProvider[] = ['anthropic', 'openai', 'ollama'];
    let lastError: Error | null = null;
    
    for (const provider of providers) {
      if (!this.configs.has(provider)) continue;
      
      try {
        console.log(`🔄 Trying ${provider} provider...`);
        let response: string;
        
        switch (provider) {
          case 'openai':
            response = await this.callOpenAI(prompt, userMessage);
            break;
          case 'anthropic':
            response = await this.callAnthropic(prompt, userMessage);
            break;
          case 'ollama':
            response = await this.callOllama(prompt, userMessage);
            break;
          default:
            continue;
        }

        if (response && response.trim()) {
          // Cache successful response
          this.cache.set(cacheKey, response);
          console.log(`✅ ${provider} response generated successfully`);
          
          return {
            text: response.trim(),
            metadata: {
              provider,
              model: this.configs.get(provider)?.model || 'unknown',
              tokensUsed: this.contextManager.estimateTokens(response),
              responseTime: Date.now() - startTime,
              cached: false,
              confidence: 0.8,
              contentFiltered: false,
            },
          };
        }
      } catch (error) {
        console.warn(`❌ LLM provider ${provider} failed:`, error);
        lastError = error as Error;
        continue;
      }
    }

    // All providers failed, use fallback
    console.warn('⚠️  All LLM providers failed, using fallback response');
    const fallbackText = this.generateFallbackResponse(trimmedContext, userMessage);
    
    return {
      text: fallbackText,
      metadata: {
        provider: 'fallback',
        model: 'template-based',
        tokensUsed: 0,
        responseTime: Date.now() - startTime,
        cached: false,
        confidence: 0.3,
        contentFiltered: false,
      },
    };
  }

  // Streaming support for real-time chat
  async *generateResponseStream(userMessage: string, gameState: GameState): AsyncGenerator<string> {
    try {
      const context = this.buildContext(gameState);
      const prompt = this.buildPrompt(context, userMessage);
      
      if (this.openaiClient) {
        const stream = await this.openaiClient.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: userMessage }
          ],
          max_tokens: 1000,
          temperature: 0.7,
          stream: true,
        });

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            yield content;
          }
        }
      }
    } catch (error) {
      console.warn('Streaming failed, falling back to regular response:', error);
      const response = await this.generateResponse(userMessage, gameState);
      yield response.text;
    }
  }

  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.configs.keys());
  }

  getProviderStatus(): Record<LLMProvider, boolean> {
    const status: Record<string, boolean> = {};
    
    for (const provider of this.configs.keys()) {
      switch (provider) {
        case 'openai':
          status[provider] = !!this.openaiClient;
          break;
        case 'anthropic':
          status[provider] = !!this.anthropicClient;
          break;
        case 'ollama':
          status[provider] = !!this.configs.get(provider);
          break;
      }
    }
    
    return status as Record<LLMProvider, boolean>;
  }
}
