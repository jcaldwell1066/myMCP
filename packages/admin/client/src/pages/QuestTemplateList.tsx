import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ClockIcon,
  TagIcon,
  FunnelIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { QuestTemplate, QuestTemplateStatus } from '@mymcp/types';

interface QuestTemplateListProps {}

const QuestTemplateList: React.FC<QuestTemplateListProps> = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<QuestTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<QuestTemplateStatus | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, [selectedStatus, selectedCategory, currentPage]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/admin/quest-templates?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTemplates(data.data.templates);
        setTotalPages(data.data.pagination.pages);
      } else {
        toast.error('Failed to load quest templates');
      }
    } catch (error) {
      toast.error('Error loading templates');
      console.error('Load templates error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/quest-templates/${templateId}/publish`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Template published successfully');
        loadTemplates();
      } else {
        toast.error('Failed to publish template');
      }
    } catch (error) {
      toast.error('Error publishing template');
    }
  };

  const handleUnpublish = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/quest-templates/${templateId}/unpublish`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Template unpublished successfully');
        loadTemplates();
      } else {
        toast.error('Failed to unpublish template');
      }
    } catch (error) {
      toast.error('Error unpublishing template');
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/quest-templates/${templateId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Template deleted successfully');
        loadTemplates();
      } else {
        toast.error('Failed to delete template');
      }
    } catch (error) {
      toast.error('Error deleting template');
    }
  };

  const handleDuplicate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/quest-templates/${templateId}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Copy of Template`
        })
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Template duplicated successfully');
        loadTemplates();
      } else {
        toast.error('Failed to duplicate template');
      }
    } catch (error) {
      toast.error('Error duplicating template');
    }
  };

  const getStatusBadge = (status: QuestTemplateStatus) => {
    const styles = {
      draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      published: 'bg-green-100 text-green-800 border-green-200',
      archived: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const icons = {
      draft: <ClockIcon className="w-3 h-3" />,
      published: <CheckCircleIcon className="w-3 h-3" />,
      archived: <TagIcon className="w-3 h-3" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded-full ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getDifficultyBadge = (difficulty: string) => {
    const styles = {
      easy: 'bg-blue-100 text-blue-800',
      medium: 'bg-orange-100 text-orange-800',
      hard: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[difficulty] || 'bg-gray-100 text-gray-800'}`}>
        {difficulty}
      </span>
    );
  };

  // Filter templates by search term
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quest Templates</h1>
          <p className="text-gray-600 mt-1">
            Manage and edit quest templates for the myMCP system
          </p>
        </div>
        <Link
          to="/quests/templates/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          New Template
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          {/* Search */}
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as QuestTemplateStatus | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="business">Business</option>
            <option value="coordination">Coordination</option>
            <option value="development">Development</option>
            <option value="devops">DevOps</option>
            <option value="security">Security</option>
          </select>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-lg border shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No quest templates found</p>
            <Link
              to="/quests/templates/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              Create First Template
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {template.name}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {template.description}
                        </div>
                        <div className="flex gap-2 mt-2">
                          {getDifficultyBadge(template.questDefinition.difficulty)}
                          <span className="text-xs text-gray-500">
                            v{template.version}
                          </span>
                        </div>
                        {template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {template.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {template.tags.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{template.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(template.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {template.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View/Edit */}
                        <button
                          onClick={() => navigate(`/quests/templates/${template.id}`)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit Template"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>

                        {/* Duplicate */}
                        <button
                          onClick={() => handleDuplicate(template.id)}
                          className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                          title="Duplicate Template"
                        >
                          <DocumentDuplicateIcon className="w-4 h-4" />
                        </button>

                        {/* Publish/Unpublish */}
                        {template.status === 'draft' ? (
                          <button
                            onClick={() => handlePublish(template.id)}
                            className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
                          >
                            Publish
                          </button>
                        ) : template.status === 'published' ? (
                          <button
                            onClick={() => handleUnpublish(template.id)}
                            className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
                          >
                            Unpublish
                          </button>
                        ) : null}

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(template.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Template"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <nav className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm rounded ${
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};

export default QuestTemplateList;