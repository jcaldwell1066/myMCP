// Core game state types based on our requirements analysis

export type PlayerStatus = 'idle' | 'chatting' | 'in-quest' | 'completed-quest';
export type QuestStatus = 'available' | 'active' | 'completed' | 'failed';
export type SubQuestStatus = 'locked' | 'available' | 'active' | 'completed';
export type InventoryStatus = 'empty' | 'has-item' | 'full';
export type LocationStatus = 'town' | 'forest' | 'cave' | 'shop';
export type NPCStatus = 'available' | 'busy' | 'questgiver' | 'merchant';
export type PlayerLevel = 'novice' | 'apprentice' | 'expert' | 'master';

export interface Player {
  id: string;
  name: string;
  score: number;
  level: PlayerLevel;
  status: PlayerStatus;
  location: LocationStatus;
  currentQuest?: string;
}

export interface QuestStep {
  id: string;
  description: string;
  completed: boolean;
  data?: Record<string, any>;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  realWorldSkill: string;
  fantasyTheme: string;
  status: QuestStatus;
  steps: QuestStep[];
  reward: {
    score: number;
    items?: string[];
  };
}

export interface Inventory {
  items: Item[];
  capacity: number;
  status: InventoryStatus;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'quest' | 'tool' | 'treasure';
}

export interface GameSession {
  id: string;
  startTime: Date;
  lastAction: Date;
  turnCount: number;
  conversationHistory: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  timestamp: Date;
  sender: 'player' | 'bot';
  message: string;
  type: 'chat' | 'system' | 'quest';
  metadata?: {
    provider?: string;
    model?: string;
    tokensUsed?: number;
    responseTime?: number;
    cached?: boolean;
    confidence?: number;
    contentFiltered?: boolean;
    error?: string;
  };
}

export interface GameState {
  player: Player;
  quests: {
    available: Quest[];
    active: Quest | null;
    completed: Quest[];
  };
  inventory: Inventory;
  session: GameSession;
  metadata: {
    version: string;
    lastUpdated: Date;
  };
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface StateUpdate {
  type: 'FULL_STATE' | 'PARTIAL_UPDATE';
  timestamp: Date;
  version: number;
  data: Partial<GameState>;
}

// Game Actions
export type GameActionType = 
  | 'SET_SCORE' 
  | 'START_QUEST' 
  | 'COMPLETE_QUEST_STEP'
  | 'COMPLETE_QUEST'
  | 'CHAT' 
  | 'USE_ITEM'
  | 'CHANGE_LOCATION'
  | 'UPDATE_PLAYER_STATUS';

export interface GameAction {
  type: GameActionType;
  payload: any;
  timestamp: Date;
  playerId: string;
}

// Quest-specific types for our three main quests

// Quest 1: Global Meeting
export interface GlobalMeetingData {
  allies: Array<{
    id: string;
    name: string;
    kingdom: string;
    timezone: string;
    availability: string;
    selected: boolean;
  }>;
  meetingTime?: {
    utc: string;
    localTime: string;
    alliesConfirmed: string[];
  };
}

// Quest 2: Server Health  
export interface ServerHealthData {
  servers: Array<{
    id: string;
    name: string;
    fantasyName: string;
    status: 'healthy' | 'warning' | 'critical';
    metrics: {
      cpu: number;
      memory: number;
      disk: number;
    };
    lastChecked: Date;
  }>;
  currentDepth: number;
  maxDepth: number;
}

// Quest 3: HMAC Security
export interface HMACSecurityData {
  messages: Array<{
    id: string;
    content: string;
    hmac?: string;
    verified?: boolean;
  }>;
  secretKey: string;
  algorithm: 'SHA256' | 'SHA512';
  currentStep: 'learning' | 'crafting' | 'verifying' | 'completed';
}

// CLI Command types
export interface CLICommand {
  name: string;
  description: string;
  usage: string;
  handler: (args: any) => Promise<void>;
}

// MCP Protocol types
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  handler: (params: any) => Promise<any>;
}

export interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

// Admin Dashboard types
export interface SystemMetrics {
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  activeSessions: number;
  totalQuests: number;
  completedQuests: number;
}

export interface AdminEvent {
  id: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'error';
  source: 'engine' | 'cli' | 'webapp' | 'mcpserver' | 'admin';
  message: string;
  details?: any;
}

// Quest Template and Editor Types
export type QuestTemplateStatus = 'draft' | 'published' | 'archived';

export interface QuestTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  status: QuestTemplateStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  category: string;
  // Quest definition using enhanced format
  questDefinition: {
    id: string;
    title: string;
    description: string;
    realWorldSkill: string;
    fantasyTheme: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedDuration: string;
    category: string;
    tags: string[];
    steps: EnhancedQuestStep[];
    rewards: {
      points: number;
      achievements: string[];
      items?: string[];
    };
    metadata: {
      totalPoints: number;
      skillsLearned: string[];
      realWorldApplications: string[];
    };
  };
}

// Enhanced Quest Step for templates (imported from engine types)
export interface EnhancedQuestStep {
  id: string;
  description: string;
  completed: boolean;
  title: string;
  metadata: {
    difficulty: 'easy' | 'medium' | 'hard';
    category: 'development' | 'coordination' | 'research' | 'testing' | 'security' | 'devops' | 'collaboration' | 'monitoring' | 'documentation';
    tags: string[];
    points: number;
    estimatedDuration?: string;
    prerequisites?: string[];
    realWorldSkill?: string;
  };
  resources: {
    docs?: Array<{
      title: string;
      url?: string;
      filename?: string;
      type: string;
      description: string;
    }>;
    tools?: Array<{
      name: string;
      url?: string;
      type: string;
      description: string;
    }>;
    examples?: Array<{
      name: string;
      type: string;
      description: string;
    }>;
  };
  execution: {
    type: 'manual' | 'automated' | 'hybrid';
    launcher?: {
      type: string;
      phases?: string[];
      items?: string[];
    };
    validation: {
      type: 'checklist' | 'test' | 'output' | 'confirmation' | 'file-exists' | 'criteria';
      criteria: string[];
    };
    hints?: string[];
  };
  progress: {
    attempts: number;
    notes: string[];
    artifacts: string[];
  };
}

// Quest Editor Types
export interface QuestEditorState {
  currentTemplate: QuestTemplate | null;
  templates: QuestTemplate[];
  isEditing: boolean;
  isDirty: boolean;
  validationErrors: string[];
  previewMode: boolean;
}

// Admin Dashboard Types
export interface AdminDashboardData {
  questMetrics: {
    totalTemplates: number;
    publishedTemplates: number;
    draftTemplates: number;
    activeQuests: number;
    completedQuests: number;
  };
  playerMetrics: {
    totalPlayers: number;
    activePlayers: number;
    averageScore: number;
  };
  systemMetrics: SystemMetrics;
}

// API Response Types for Quest Editor
export interface QuestTemplateListResponse {
  success: boolean;
  data: {
    templates: QuestTemplate[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  timestamp: Date;
}

export interface QuestTemplateResponse {
  success: boolean;
  data: QuestTemplate;
  timestamp: Date;
}
