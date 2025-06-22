import { QuestTemplate, QuestTemplateStatus, EnhancedQuestStep } from '@mymcp/types';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import * as path from 'path';

export class QuestTemplateService {
  private templatesDir: string;
  private templateCache: Map<string, QuestTemplate> = new Map();

  constructor(templatesDir: string = './quest-templates') {
    this.templatesDir = templatesDir;
    this.ensureTemplatesDirectory();
    this.loadTemplatesFromDisk();
  }

  private async ensureTemplatesDirectory() {
    try {
      await fs.mkdir(this.templatesDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create templates directory:', error);
    }
  }

  private async loadTemplatesFromDisk() {
    try {
      const files = await fs.readdir(this.templatesDir);
      const templateFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of templateFiles) {
        try {
          const content = await fs.readFile(path.join(this.templatesDir, file), 'utf8');
          const template = JSON.parse(content) as QuestTemplate;
          this.templateCache.set(template.id, template);
        } catch (error) {
          console.error(`Failed to load template ${file}:`, error);
        }
      }
      
      console.log(`Loaded ${this.templateCache.size} quest templates`);
    } catch (error) {
      console.error('Failed to load templates from disk:', error);
    }
  }

  async getAllTemplates(
    page: number = 1, 
    limit: number = 10, 
    status?: QuestTemplateStatus,
    category?: string,
    tags?: string[]
  ): Promise<{ templates: QuestTemplate[]; pagination: any }> {
    let templates = Array.from(this.templateCache.values());

    // Apply filters
    if (status) {
      templates = templates.filter(t => t.status === status);
    }
    if (category) {
      templates = templates.filter(t => t.category === category);
    }
    if (tags && tags.length > 0) {
      templates = templates.filter(t => 
        tags.some(tag => t.tags.includes(tag))
      );
    }

    // Sort by updatedAt desc
    templates.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    // Pagination
    const total = templates.length;
    const pages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginatedTemplates = templates.slice(start, start + limit);

    return {
      templates: paginatedTemplates,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    };
  }

  async getTemplateById(id: string): Promise<QuestTemplate | null> {
    return this.templateCache.get(id) || null;
  }

  async createTemplate(templateData: Partial<QuestTemplate>, createdBy: string): Promise<QuestTemplate> {
    const id = uuidv4();
    const now = new Date();

    const template: QuestTemplate = {
      id,
      name: templateData.name || 'Untitled Quest',
      description: templateData.description || '',
      version: '1.0.0',
      status: 'draft',
      createdBy,
      createdAt: now,
      updatedAt: now,
      tags: templateData.tags || [],
      category: templateData.category || 'general',
      questDefinition: templateData.questDefinition || this.createDefaultQuestDefinition()
    };

    // Validate template
    const validationErrors = this.validateTemplate(template);
    if (validationErrors.length > 0) {
      throw new Error(`Template validation failed: ${validationErrors.join(', ')}`);
    }

    // Save to cache and disk
    this.templateCache.set(id, template);
    await this.saveTemplateToDisk(template);

    return template;
  }

  async updateTemplate(id: string, updates: Partial<QuestTemplate>): Promise<QuestTemplate> {
    const existing = this.templateCache.get(id);
    if (!existing) {
      throw new Error(`Template ${id} not found`);
    }

    const updated: QuestTemplate = {
      ...existing,
      ...updates,
      id, // Preserve ID
      updatedAt: new Date()
    };

    // Validate updated template
    const validationErrors = this.validateTemplate(updated);
    if (validationErrors.length > 0) {
      throw new Error(`Template validation failed: ${validationErrors.join(', ')}`);
    }

    // Save to cache and disk
    this.templateCache.set(id, updated);
    await this.saveTemplateToDisk(updated);

    return updated;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const template = this.templateCache.get(id);
    if (!template) {
      return false;
    }

    // Don't delete published templates, archive them instead
    if (template.status === 'published') {
      await this.updateTemplate(id, { status: 'archived' });
      return true;
    }

    // Remove from cache and disk
    this.templateCache.delete(id);
    try {
      await fs.unlink(path.join(this.templatesDir, `${id}.json`));
    } catch (error) {
      console.error(`Failed to delete template file ${id}:`, error);
    }

    return true;
  }

  async publishTemplate(id: string): Promise<QuestTemplate> {
    const template = this.templateCache.get(id);
    if (!template) {
      throw new Error(`Template ${id} not found`);
    }

    // Validate template is ready for publishing
    const validationErrors = this.validateTemplateForPublishing(template);
    if (validationErrors.length > 0) {
      throw new Error(`Template not ready for publishing: ${validationErrors.join(', ')}`);
    }

    return await this.updateTemplate(id, { 
      status: 'published',
      version: this.incrementVersion(template.version)
    });
  }

  async unpublishTemplate(id: string): Promise<QuestTemplate> {
    return await this.updateTemplate(id, { status: 'draft' });
  }

  async duplicateTemplate(id: string, newName?: string): Promise<QuestTemplate> {
    const original = this.templateCache.get(id);
    if (!original) {
      throw new Error(`Template ${id} not found`);
    }

    const duplicate = {
      ...original,
      name: newName || `${original.name} (Copy)`,
      status: 'draft' as QuestTemplateStatus,
      questDefinition: {
        ...original.questDefinition,
        id: uuidv4() // New quest ID
      }
    };

    return await this.createTemplate(duplicate, original.createdBy);
  }

  private async saveTemplateToDisk(template: QuestTemplate): Promise<void> {
    try {
      const filePath = path.join(this.templatesDir, `${template.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(template, null, 2));
    } catch (error) {
      console.error(`Failed to save template ${template.id}:`, error);
      throw error;
    }
  }

  private validateTemplate(template: QuestTemplate): string[] {
    const errors: string[] = [];

    if (!template.name?.trim()) {
      errors.push('Template name is required');
    }

    if (!template.questDefinition?.title?.trim()) {
      errors.push('Quest title is required');
    }

    if (!template.questDefinition?.description?.trim()) {
      errors.push('Quest description is required');
    }

    if (!template.questDefinition?.steps || template.questDefinition.steps.length === 0) {
      errors.push('Quest must have at least one step');
    }

    // Validate each step
    template.questDefinition?.steps?.forEach((step, index) => {
      if (!step.title?.trim()) {
        errors.push(`Step ${index + 1}: Title is required`);
      }
      if (!step.description?.trim()) {
        errors.push(`Step ${index + 1}: Description is required`);
      }
      if (!step.execution?.validation?.criteria || step.execution.validation.criteria.length === 0) {
        errors.push(`Step ${index + 1}: At least one validation criterion is required`);
      }
    });

    return errors;
  }

  private validateTemplateForPublishing(template: QuestTemplate): string[] {
    const errors = this.validateTemplate(template);

    // Additional validation for publishing
    if (!template.questDefinition?.realWorldSkill?.trim()) {
      errors.push('Real-world skill mapping is required for publishing');
    }

    if (!template.questDefinition?.fantasyTheme?.trim()) {
      errors.push('Fantasy theme is required for publishing');
    }

    if (template.questDefinition?.steps?.some(step => !step.metadata?.realWorldSkill)) {
      errors.push('All steps must have real-world skill mapping for publishing');
    }

    return errors;
  }

  private createDefaultQuestDefinition() {
    return {
      id: uuidv4(),
      title: 'New Quest',
      description: 'Quest description goes here',
      realWorldSkill: 'Skill to be learned',
      fantasyTheme: 'Fantasy narrative theme',
      difficulty: 'medium' as const,
      estimatedDuration: '30 minutes',
      category: 'general',
      tags: [],
      steps: [
        this.createDefaultStep()
      ],
      rewards: {
        points: 50,
        achievements: [],
        items: []
      },
      metadata: {
        totalPoints: 50,
        skillsLearned: [],
        realWorldApplications: []
      }
    };
  }

  private createDefaultStep(): EnhancedQuestStep {
    return {
      id: uuidv4(),
      title: 'New Step',
      description: 'Step description goes here',
      completed: false,
      metadata: {
        difficulty: 'medium',
        category: 'development',
        tags: [],
        points: 25
      },
      resources: {
        docs: [],
        tools: [],
        examples: []
      },
      execution: {
        type: 'manual',
        validation: {
          type: 'checklist',
          criteria: ['Complete the task successfully']
        }
      },
      progress: {
        attempts: 0,
        notes: [],
        artifacts: []
      }
    };
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  // Get templates by status for dashboard metrics
  async getTemplateMetrics() {
    const templates = Array.from(this.templateCache.values());
    return {
      total: templates.length,
      published: templates.filter(t => t.status === 'published').length,
      drafts: templates.filter(t => t.status === 'draft').length,
      archived: templates.filter(t => t.status === 'archived').length
    };
  }

  // Get published templates for quest catalog
  async getPublishedTemplates(): Promise<QuestTemplate[]> {
    return Array.from(this.templateCache.values())
      .filter(t => t.status === 'published');
  }
}