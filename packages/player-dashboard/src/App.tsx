import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

interface PlayerState {
  playerId: string;
  name: string;
  level: string;
  score: number;
  location: string;
  currentQuest?: string;
}

function App() {
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [engineConnected, setEngineConnected] = useState(false);

  const engineUrl = import.meta.env.VITE_ENGINE_URL || 'http://localhost:3000';
  const playerId = 'dashboard-player';

  useEffect(() => {
    // Try to connect to engine
    loadPlayerState();
  }, []);

  const loadPlayerState = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Test engine connection first
      await axios.get(`${engineUrl}/health`, { timeout: 2000 });
      setEngineConnected(true);
      
      // Initialize socket connection
      const socketInstance = io(engineUrl);
      setSocket(socketInstance);

      // Listen for player updates
      socketInstance.on('playerUpdate', (data) => {
        if (data.playerId === playerId) {
          setPlayerState(data.player);
        }
      });

      // Load player state
      const response = await axios.get(`${engineUrl}/api/state/${playerId}`);
      setPlayerState((response.data as any).data?.player || {
        playerId,
        name: 'Dashboard Player',
        level: 'apprentice',
        score: 0,
        location: 'town'
      });
    } catch (err) {
      setEngineConnected(false);
      setError('Engine not running');
      console.log('Engine connection failed:', err);
      
      // Set demo data when engine is not available
      setPlayerState({
        playerId,
        name: 'Demo Player',
        level: 'apprentice',
        score: 42,
        location: 'demo-town',
        currentQuest: 'Connect to myMCP Engine'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading player dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">
              myMCP Player Dashboard
            </h1>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${engineConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {engineConnected ? 'Connected' : 'Engine Offline'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!engineConnected && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Engine Not Running
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Start the myMCP engine to see live data: <code className="bg-yellow-100 px-1 rounded">npm run start --workspace=@mymcp/engine</code></p>
                </div>
              </div>
            </div>
          </div>
        )}

        {playerState && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Player Info</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Name:</span> {playerState.name}</p>
                <p><span className="font-medium">Level:</span> {playerState.level}</p>
                <p><span className="font-medium">Score:</span> {playerState.score}</p>
                <p><span className="font-medium">Location:</span> {playerState.location}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Quest</h2>
              <p className="text-gray-600">
                {playerState.currentQuest || 'No active quest'}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-2">
                <button 
                  onClick={loadPlayerState}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {engineConnected ? 'Refresh State' : 'Try Reconnect'}
                </button>
                {!engineConnected && (
                  <p className="text-xs text-gray-500 mt-2">
                    Showing demo data. Start the engine for live data.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Getting Started</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>🎮 <strong>myMCP Player Dashboard</strong> - Built with React + Vite + Tailwind CSS</p>
            <p>🔗 <strong>Engine URL:</strong> {engineUrl}</p>
            <p>🚀 <strong>To start the full system:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code className="bg-gray-100 px-1 rounded">npm run start --workspace=@mymcp/engine</code></li>
              <li><code className="bg-gray-100 px-1 rounded">npm run start --workspace=@mymcp/admin</code></li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;