import React, { useState, useEffect } from 'react';
import { Quest } from './Quest';
import { PlayerStats } from './PlayerStats';
import { QuickActions } from './QuickActions';

interface Tool {
  name: string;
  description?: string;
  inputSchema?: any;
}

interface PlayerDashboardProps {
  tools: Tool[];
  callTool: (name: string, args?: Record<string, unknown>) => Promise<any>;
}

export const PlayerDashboard: React.FC<PlayerDashboardProps> = ({ tools, callTool }) => {
  const [playerState, setPlayerState] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load player data on mount
  useEffect(() => {
    loadPlayerData();
  }, [tools]);

  const loadPlayerData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use MCP tools to get player state
      const getStateTool = tools.find(t => t.name === 'get_game_state');
      if (getStateTool) {
        const result = await callTool('get_game_state', {});
        setPlayerState(result);
      } else {
        // Fallback: try to get player data through other tools
        console.warn('get_game_state tool not found, using fallback methods');
        setPlayerState({ 
          player: { name: 'Player', level: 1, score: 0 },
          quests: { available: [], active: null, completed: [] }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load player data');
      console.error('Error loading player data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToolCall = async (toolName: string, args: Record<string, unknown>) => {
    try {
      const result = await callTool(toolName, args);
      // Refresh player data after any action
      await loadPlayerData();
      return result;
    } catch (err: any) {
      setError(err.message || `Failed to execute ${toolName}`);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading player data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading player data</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={loadPlayerData}
              className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Player Stats */}
      <PlayerStats 
        player={playerState?.player} 
        onRefresh={loadPlayerData}
      />

      {/* Quick Actions */}
      <QuickActions 
        tools={tools}
        onToolCall={handleToolCall}
      />

      {/* Active Quest */}
      {playerState?.quests?.active && (
        <Quest 
          quest={playerState.quests.active}
          tools={tools}
          onToolCall={handleToolCall}
        />
      )}

      {/* Available Tools Debug (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Available MCP Tools</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {tools.map(tool => (
              <div key={tool.name} className="text-xs bg-white p-2 rounded border">
                <div className="font-medium text-gray-900">{tool.name}</div>
                <div className="text-gray-500 truncate">{tool.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};