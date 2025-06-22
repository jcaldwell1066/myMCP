import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  SaveIcon,
  EyeIcon,
  CodeBracketIcon,
  PlusIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import JSONEditor from 'jsoneditor-react';
import { QuestTemplate, EnhancedQuestStep } from '@mymcp/types';

const QuestTemplateEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewTemplate = id === 'new';

  // State
  const [template, setTemplate] = useState<QuestTemplate | null>(null);
  const [loading, setLoading] = useState(!isNewTemplate);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [viewMode, setViewMode] = useState<'form' | 'json'>('form');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Load template if editing existing
  useEffect(() => {
    if (!isNewTemplate && id) {
      loadTemplate(id);
    } else {
      // Create new template with defaults
      setTemplate(createDefaultTemplate());
    }
  }, [id, isNewTemplate]);

  const loadTemplate = async (templateId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/quest-templates/${templateId}`);
      const data = await response.json();
      
      if (data.success) {
        setTemplate(data.data);
      } else {
        toast.error('Failed to load quest template');
        navigate('/quests/templates');
      }
    } catch (error) {
      toast.error('Error loading template');
      navigate('/quests/templates');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTemplate = (): QuestTemplate => {
    return {
      id: '',
      name: 'New Quest Template',
      description: 'Description of your quest template',
      version: '1.0.0',
      status: 'draft',
      createdBy: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      category: 'general',
      questDefinition: {
        id: '',
        title: 'New Quest',
        description: 'Quest description goes here',
        realWorldSkill: 'Skill to be learned',
        fantasyTheme: 'Fantasy narrative theme',
        difficulty: 'medium',
        estimatedDuration: '30 minutes',
        category: 'general',
        tags: [],
        steps: [createDefaultStep()],
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
      }
    };
  };

  const createDefaultStep = (): EnhancedQuestStep => {
    return {
      id: `step-${Date.now()}`,
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
  };

  const handleSave = async (publish = false) => {
    if (!template) return;

    try {
      setSaving(true);
      
      // Validate template
      const errors = validateTemplate(template);
      if (errors.length > 0) {
        setValidationErrors(errors);
        toast.error('Please fix validation errors before saving');
        return;
      }

      const url = isNewTemplate 
        ? '/api/admin/quest-templates'
        : `/api/admin/quest-templates/${template.id}`;
      
      const method = isNewTemplate ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      });

      const data = await response.json();
      
      if (data.success) {
        setIsDirty(false);
        setValidationErrors([]);
        
        if (publish) {
          // Publish after saving
          const publishResponse = await fetch(`/api/admin/quest-templates/${data.data.id}/publish`, {
            method: 'POST'
          });
          
          if (publishResponse.ok) {
            toast.success('Template saved and published successfully');
          } else {
            toast.success('Template saved, but publishing failed');
          }
        } else {
          toast.success('Template saved successfully');
        }
        
        if (isNewTemplate) {
          navigate(`/quests/templates/${data.data.id}`);
        }
      } else {
        toast.error('Failed to save template');
      }
    } catch (error) {
      toast.error('Error saving template');
    } finally {
      setSaving(false);
    }
  };

  const validateTemplate = (template: QuestTemplate): string[] => {
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
    });

    return errors;
  };

  const updateTemplate = (updates: Partial<QuestTemplate>) => {
    if (!template) return;
    
    setTemplate({ ...template, ...updates });
    setIsDirty(true);
  };

  const updateQuestDefinition = (updates: any) => {
    if (!template) return;
    
    setTemplate({
      ...template,
      questDefinition: { ...template.questDefinition, ...updates }
    });
    setIsDirty(true);
  };

  const addStep = () => {
    if (!template) return;
    
    const newStep = createDefaultStep();
    updateQuestDefinition({
      steps: [...template.questDefinition.steps, newStep]
    });
  };

  const removeStep = (stepIndex: number) => {
    if (!template) return;
    
    const steps = template.questDefinition.steps.filter((_, index) => index !== stepIndex);
    updateQuestDefinition({ steps });
  };

  const updateStep = (stepIndex: number, stepUpdates: Partial<EnhancedQuestStep>) => {
    if (!template) return;
    
    const steps = template.questDefinition.steps.map((step, index) =>
      index === stepIndex ? { ...step, ...stepUpdates } : step
    );
    updateQuestDefinition({ steps });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Template not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/quests/templates')}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNewTemplate ? 'New Quest Template' : template.name}
            </h1>
            <p className="text-gray-600 mt-1">
              {isNewTemplate ? 'Create a new quest template' : 'Edit quest template'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('form')}
              className={`px-3 py-2 text-sm rounded ${
                viewMode === 'form'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Form
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`px-3 py-2 text-sm rounded ${
                viewMode === 'json'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CodeBracketIcon className="w-4 h-4 inline mr-1" />
              JSON
            </button>
          </div>

          {/* Save Actions */}
          <button
            onClick={() => handleSave(false)}
            disabled={saving || !isDirty}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SaveIcon className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </button>

          {template.status === 'draft' && (
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircleIcon className="w-4 h-4" />
              Save & Publish
            </button>
          )}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            <h3 className="text-sm font-medium text-red-800">Validation Errors</h3>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
          template.status === 'draft' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
          template.status === 'published' ? 'bg-green-100 text-green-800 border-green-200' :
          'bg-gray-100 text-gray-800 border-gray-200'
        } border`}>
          {template.status === 'draft' ? <ClockIcon className="w-3 h-3" /> : <CheckCircleIcon className="w-3 h-3" />}
          {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
        </span>
        <span className="text-sm text-gray-500">v{template.version}</span>
        {isDirty && <span className="text-sm text-orange-600">• Unsaved changes</span>}
      </div>

      {/* Content */}
      {viewMode === 'form' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Template Info */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={template.name}
                    onChange={(e) => updateTemplate({ name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={template.category}
                    onChange={(e) => updateTemplate({ category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="general">General</option>
                    <option value="business">Business</option>
                    <option value="coordination">Coordination</option>
                    <option value="development">Development</option>
                    <option value="devops">DevOps</option>
                    <option value="security">Security</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={template.description}
                    onChange={(e) => updateTemplate({ description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={template.tags.join(', ')}
                    onChange={(e) => updateTemplate({ 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ecommerce, hospitality, business"
                  />
                </div>
              </div>
            </div>

            {/* Quest Definition */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quest Definition</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quest Title
                    </label>
                    <input
                      type="text"
                      value={template.questDefinition.title}
                      onChange={(e) => updateQuestDefinition({ title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={template.questDefinition.difficulty}
                      onChange={(e) => updateQuestDefinition({ difficulty: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Real-World Skill
                    </label>
                    <input
                      type="text"
                      value={template.questDefinition.realWorldSkill}
                      onChange={(e) => updateQuestDefinition({ realWorldSkill: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Duration
                    </label>
                    <input
                      type="text"
                      value={template.questDefinition.estimatedDuration}
                      onChange={(e) => updateQuestDefinition({ estimatedDuration: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="30 minutes"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quest Description
                  </label>
                  <textarea
                    value={template.questDefinition.description}
                    onChange={(e) => updateQuestDefinition({ description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fantasy Theme
                  </label>
                  <input
                    type="text"
                    value={template.questDefinition.fantasyTheme}
                    onChange={(e) => updateQuestDefinition({ fantasyTheme: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="The adventure narrative wrapper"
                  />
                </div>
              </div>
            </div>

            {/* Quest Steps */}
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Quest Steps</h2>
                <button
                  onClick={addStep}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Step
                </button>
              </div>
              
              <div className="space-y-4">
                {template.questDefinition.steps.map((step, index) => (
                  <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        Step {index + 1}
                      </h3>
                      <button
                        onClick={() => removeStep(index)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Step Title
                        </label>
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => updateStep(index, { title: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Points
                        </label>
                        <input
                          type="number"
                          value={step.metadata.points}
                          onChange={(e) => updateStep(index, { 
                            metadata: { ...step.metadata, points: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Step Description
                        </label>
                        <textarea
                          value={step.description}
                          onChange={(e) => updateStep(index, { description: e.target.value })}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <EyeIcon className="w-4 h-4" />
                  {previewMode ? 'Hide Preview' : 'Preview Quest'}
                </button>
                <button
                  onClick={() => toast.info('Validation feature coming soon')}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Validate Template
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Statistics</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Steps:</span>
                  <span className="font-medium">{template.questDefinition.steps.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Points:</span>
                  <span className="font-medium">
                    {template.questDefinition.steps.reduce((sum, step) => sum + step.metadata.points, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Difficulty:</span>
                  <span className="font-medium capitalize">{template.questDefinition.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{template.questDefinition.estimatedDuration}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* JSON Editor */
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">JSON Editor</h2>
            <p className="text-sm text-gray-600 mt-1">
              Advanced editing mode - edit the raw JSON structure
            </p>
          </div>
          <div className="p-4">
            <div style={{ height: '600px' }}>
              <JSONEditor
                value={template}
                onChange={(value) => {
                  setTemplate(value);
                  setIsDirty(true);
                }}
                mode="code"
                search={true}
                history={true}
                navigationBar={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestTemplateEditor;