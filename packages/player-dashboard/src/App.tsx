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

  const engineUrl = process.env.REACT_APP_ENGINE_URL || 'http://localhost:3000';
  const playerId = 'dashboard-player';

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(engineUrl);
    setSocket(socketInstance);

    // Load initial player state
    loadPlayerState();

    // Listen for player updates
    socketInstance.on('playerUpdate', (data) => {
      if (data.playerId === playerId) {
        setPlayerState(data.player);
      }
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const loadPlayerState = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${engineUrl}/api/state/${playerId}`);
             setPlayerState((response.data as any).data?.player || {
        playerId,
        name: 'Dashboard Player',
        level: 'apprentice',
        score: 0,
        location: 'town'
      });
      setError(null);
    } catch (err) {
      setError('Failed to load player state');
      console.error('Error loading player state:', err);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">⚠️ {error}</div>
          <button 
            onClick={loadPlayerState}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
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
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Connected</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                  Refresh State
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;