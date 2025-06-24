import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Player {
  id: string;
  name: string;
  level: string;
  score: number;
  location: string;
  status: string;
  currentQuest?: string;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  status: string;
  steps: Array<{
    id: string;
    description: string;
    completed: boolean;
  }>;
  reward: {
    score: number;
    items: string[];
  };
}

interface PlayerData {
  player: Player;
  quests: {
    available: Quest[];
    active: Quest | null;
    completed: Quest[];
  };
  inventory: {
    items: any[];
    capacity: number;
    status: string;
  };
}

function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const engineUrl = (import.meta as any).env.VITE_ENGINE_URL || 'http://localhost:3000';

  // Load all players on component mount
  useEffect(() => {
    loadPlayers();
  }, []);

  // Load player data when selection changes
  useEffect(() => {
    if (selectedPlayerId) {
      loadPlayerData(selectedPlayerId);
    }
  }, [selectedPlayerId]);

  const loadPlayers = async () => {
    try {
      const response = await axios.get(`${engineUrl}/api/players`);
      const playerList = (response.data as any).data || [];
      setPlayers(playerList);
      // Auto-select jcadwell-mcp if available
      const defaultPlayer = playerList.find((p: Player) => p.id === 'jcadwell-mcp') || playerList[0];
      if (defaultPlayer) {
        setSelectedPlayerId(defaultPlayer.id);
      }
    } catch (err) {
      setError('Failed to load players');
      console.error('Error loading players:', err);
    }
  };

  const loadPlayerData = async (playerId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${engineUrl}/api/state/${playerId}`);
      setPlayerData((response.data as any).data);
    } catch (err) {
      setError(`Failed to load data for player ${playerId}`);
      console.error('Error loading player data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">myMCP Player Dashboard</h1>
        
        {/* Player Selector - COMPACT VERSION */}
        <div style={{
          backgroundColor: 'white',
          border: '2px solid black',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          maxWidth: '600px'
        }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'black',
            marginBottom: '8px'
          }}>
            🎮 Select Player:
          </label>
          <select 
            value={selectedPlayerId} 
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            style={{
              display: 'block',
              width: '100%',
              maxWidth: '400px',
              padding: '10px 12px',
              border: '2px solid black',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              color: 'black',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="" style={{color: 'black', backgroundColor: 'white'}}>
              🎮 Choose a player...
            </option>
            {players.map(player => (
              <option key={player.id} value={player.id} style={{color: 'black', backgroundColor: 'white', padding: '8px'}}>
                🎯 {player.name} - {player.score} pts - {player.level}
              </option>
            ))}
          </select>
          
          {/* Quick info for selected player - BULLETPROOF */}
          {selectedPlayerId && playerData && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              backgroundColor: '#e8f5e8',
              border: '2px solid #4caf50',
              borderRadius: '5px',
              fontSize: '14px',
              color: 'black',
              fontWeight: 'bold'
            }}>
              <span style={{color: 'black'}}>✅ Selected:</span> 
              <span style={{color: 'black', marginLeft: '5px'}}>{playerData.player.name}</span> | 
              <span style={{color: 'black', marginLeft: '5px'}}>Level: {playerData.player.level}</span> | 
              <span style={{color: 'black', marginLeft: '5px'}}>Score: {playerData.player.score} pts</span> | 
              <span style={{color: 'black', marginLeft: '5px'}}>Status: {playerData.player.status}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button 
              onClick={() => selectedPlayerId ? loadPlayerData(selectedPlayerId) : loadPlayers()}
              className="mt-2 text-red-600 hover:text-red-500 font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800">Loading player data...</p>
          </div>
        )}

        {/* Player Data Display */}
        {playerData && !loading && (
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            
            {/* Player Info - BULLETPROOF VERSION WITH INLINE STYLES */}
            <div style={{
              backgroundColor: 'white', 
              border: '3px solid black', 
              borderRadius: '8px', 
              padding: '20px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
            }}>
              <h2 style={{
                fontSize: '24px', 
                fontWeight: 'bold', 
                color: 'black', 
                marginBottom: '20px',
                borderBottom: '2px solid black',
                paddingBottom: '10px',
                textAlign: 'center'
              }}>
                🎮 PLAYER INFORMATION - DRAGON SLAYER STATS
              </h2>
              
              <div style={{
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '15px'
              }}>
                <div style={{
                  backgroundColor: '#e3f2fd', 
                  border: '2px solid #1976d2', 
                  padding: '15px', 
                  borderRadius: '8px'
                }}>
                  <div style={{fontSize: '14px', color: '#1976d2', fontWeight: 'bold', marginBottom: '8px'}}>
                    ⭐ NAME
                  </div>
                  <div style={{fontSize: '20px', fontWeight: 'bold', color: 'black'}}>
                    {playerData.player.name}
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#e8f5e8', 
                  border: '2px solid #4caf50', 
                  padding: '15px', 
                  borderRadius: '8px'
                }}>
                  <div style={{fontSize: '14px', color: '#4caf50', fontWeight: 'bold', marginBottom: '8px'}}>
                    🏆 SCORE
                  </div>
                  <div style={{fontSize: '20px', fontWeight: 'bold', color: 'black'}}>
                    {playerData.player.score} points
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#f3e5f5', 
                  border: '2px solid #9c27b0', 
                  padding: '15px', 
                  borderRadius: '8px'
                }}>
                  <div style={{fontSize: '14px', color: '#9c27b0', fontWeight: 'bold', marginBottom: '8px'}}>
                    📈 LEVEL
                  </div>
                  <div style={{fontSize: '20px', fontWeight: 'bold', color: 'black'}}>
                    {playerData.player.level}
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#fff3e0', 
                  border: '2px solid #ff9800', 
                  padding: '15px', 
                  borderRadius: '8px'
                }}>
                  <div style={{fontSize: '14px', color: '#ff9800', fontWeight: 'bold', marginBottom: '8px'}}>
                    📍 LOCATION
                  </div>
                  <div style={{fontSize: '20px', fontWeight: 'bold', color: 'black'}}>
                    {playerData.player.location}
                  </div>
                </div>
                
                <div style={{
                  backgroundColor: '#ffebee', 
                  border: '2px solid #f44336', 
                  padding: '15px', 
                  borderRadius: '8px'
                }}>
                  <div style={{fontSize: '14px', color: '#f44336', fontWeight: 'bold', marginBottom: '8px'}}>
                    ⚡ STATUS
                  </div>
                  <div style={{fontSize: '20px', fontWeight: 'bold', color: 'black'}}>
                    {playerData.player.status}
                  </div>
                </div>
                
                {playerData.player.currentQuest && (
                  <div style={{
                    backgroundColor: '#e8eaf6', 
                    border: '2px solid #3f51b5', 
                    padding: '15px', 
                    borderRadius: '8px'
                  }}>
                    <div style={{fontSize: '14px', color: '#3f51b5', fontWeight: 'bold', marginBottom: '8px'}}>
                      🎯 CURRENT QUEST
                    </div>
                    <div style={{fontSize: '20px', fontWeight: 'bold', color: 'black'}}>
                      {playerData.player.currentQuest}
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{
                marginTop: '20px', 
                padding: '15px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px', 
                color: 'black'
              }}>
                <strong>Player ID:</strong> {playerData.player.id} | <strong>Data loaded successfully!</strong>
              </div>
            </div>

            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>

              {/* Active Quest - BULLETPROOF VERSION */}
              <div style={{
                backgroundColor: 'white', 
                border: '3px solid black', 
                borderRadius: '8px', 
                padding: '20px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }}>
                <h2 style={{
                  fontSize: '22px', 
                  fontWeight: 'bold', 
                  color: 'black', 
                  marginBottom: '20px',
                  borderBottom: '2px solid black',
                  paddingBottom: '10px'
                }}>
                  🎯 ACTIVE QUEST
                </h2>
                {playerData.quests.active ? (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    <div style={{
                      padding: '10px',
                      backgroundColor: '#f0f8ff',
                      border: '2px solid #4169e1',
                      borderRadius: '5px'
                    }}>
                      <strong style={{color: 'black', fontSize: '16px'}}>📝 Title:</strong> 
                      <span style={{color: 'black', fontSize: '16px', marginLeft: '10px'}}>{playerData.quests.active.title}</span>
                    </div>
                    
                    <div style={{
                      padding: '10px',
                      backgroundColor: '#f5f5dc',
                      border: '2px solid #daa520',
                      borderRadius: '5px'
                    }}>
                      <strong style={{color: 'black', fontSize: '16px'}}>📋 Description:</strong> 
                      <span style={{color: 'black', fontSize: '16px', marginLeft: '10px'}}>{playerData.quests.active.description}</span>
                    </div>
                    
                    <div style={{
                      padding: '10px',
                      backgroundColor: '#f0fff0',
                      border: '2px solid #32cd32',
                      borderRadius: '5px'
                    }}>
                      <strong style={{color: 'black', fontSize: '16px'}}>🏆 Reward:</strong> 
                      <span style={{color: 'black', fontSize: '16px', marginLeft: '10px'}}>{playerData.quests.active.reward.score} points</span>
                    </div>
                    
                    <div style={{
                      padding: '15px',
                      backgroundColor: '#fffacd',
                      border: '2px solid #ff8c00',
                      borderRadius: '5px'
                    }}>
                      <strong style={{color: 'black', fontSize: '16px', marginBottom: '10px', display: 'block'}}>📊 Quest Progress:</strong>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                        {playerData.quests.active.steps.map(step => (
                          <div key={step.id} style={{
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px',
                            padding: '8px',
                            backgroundColor: step.completed ? '#e8f5e8' : '#fff',
                            border: step.completed ? '2px solid #4caf50' : '2px solid #ddd',
                            borderRadius: '5px'
                          }}>
                            <span style={{
                              width: '12px', 
                              height: '12px', 
                              borderRadius: '50%', 
                              backgroundColor: step.completed ? '#4caf50' : '#ddd',
                              display: 'inline-block'
                            }}></span>
                            <span style={{
                              color: 'black', 
                              fontSize: '14px',
                              textDecoration: step.completed ? 'line-through' : 'none',
                              fontWeight: step.completed ? 'bold' : 'normal'
                            }}>
                              {step.completed ? '✅' : '⏳'} {step.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p style={{
                    color: 'black', 
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: '#f5f5f5',
                    border: '2px solid #999',
                    borderRadius: '5px'
                  }}>
                    🔍 No active quest - Select a quest to begin your adventure!
                  </p>
                )}
              </div>

              {/* Available Quests - BULLETPROOF VERSION */}
              <div style={{
                backgroundColor: 'white', 
                border: '3px solid black', 
                borderRadius: '8px', 
                padding: '20px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }}>
                <h2 style={{
                  fontSize: '22px', 
                  fontWeight: 'bold', 
                  color: 'black', 
                  marginBottom: '20px',
                  borderBottom: '2px solid black',
                  paddingBottom: '10px'
                }}>
                  📋 AVAILABLE QUESTS
                </h2>
                {playerData.quests.available.length > 0 ? (
                  <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                    {playerData.quests.available.map(quest => (
                      <div key={quest.id} style={{
                        borderLeft: '4px solid #2196f3',
                        paddingLeft: '15px',
                        padding: '15px',
                        backgroundColor: '#f8f9fa',
                        border: '2px solid #2196f3',
                        borderRadius: '8px'
                      }}>
                        <div style={{
                          fontWeight: 'bold',
                          fontSize: '16px',
                          color: 'black',
                          marginBottom: '8px'
                        }}>
                          🎯 {quest.title}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: 'black',
                          marginBottom: '8px',
                          lineHeight: '1.4'
                        }}>
                          📖 {quest.description}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: 'black',
                          fontWeight: 'bold',
                          backgroundColor: '#e8f5e8',
                          padding: '5px 10px',
                          borderRadius: '3px',
                          display: 'inline-block'
                        }}>
                          🏆 Reward: {quest.reward.score} points
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{
                    color: 'black', 
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: '#f5f5f5',
                    border: '2px solid #999',
                    borderRadius: '5px'
                  }}>
                    🔍 No available quests
                  </p>
                )}
              </div>

              {/* Inventory - BULLETPROOF VERSION */}
              <div style={{
                backgroundColor: 'white', 
                border: '3px solid black', 
                borderRadius: '8px', 
                padding: '20px',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              }}>
                <h2 style={{
                  fontSize: '22px', 
                  fontWeight: 'bold', 
                  color: 'black', 
                  marginBottom: '20px',
                  borderBottom: '2px solid black',
                  paddingBottom: '10px'
                }}>
                  🎒 INVENTORY
                </h2>
                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  <div style={{
                    padding: '10px',
                    backgroundColor: '#fff3e0',
                    border: '2px solid #ff9800',
                    borderRadius: '5px'
                  }}>
                    <strong style={{color: 'black', fontSize: '16px'}}>📊 Status:</strong> 
                    <span style={{color: 'black', fontSize: '16px', marginLeft: '10px'}}>{playerData.inventory.status}</span>
                  </div>
                  
                  <div style={{
                    padding: '10px',
                    backgroundColor: '#e3f2fd',
                    border: '2px solid #2196f3',
                    borderRadius: '5px'
                  }}>
                    <strong style={{color: 'black', fontSize: '16px'}}>📦 Capacity:</strong> 
                    <span style={{color: 'black', fontSize: '16px', marginLeft: '10px'}}>
                      {playerData.inventory.items.length}/{playerData.inventory.capacity}
                    </span>
                  </div>
                  
                  {playerData.inventory.items.length > 0 ? (
                    <div style={{
                      padding: '15px',
                      backgroundColor: '#f0fff0',
                      border: '2px solid #4caf50',
                      borderRadius: '5px'
                    }}>
                      <strong style={{color: 'black', fontSize: '16px', marginBottom: '10px', display: 'block'}}>
                        🛍️ Items:
                      </strong>
                      <div style={{marginLeft: '20px'}}>
                        {playerData.inventory.items.map((item, index) => (
                          <div key={index} style={{
                            color: 'black', 
                            fontSize: '14px',
                            marginBottom: '5px',
                            padding: '5px',
                            backgroundColor: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '3px'
                          }}>
                            🔸 {JSON.stringify(item)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      color: 'black', 
                      fontSize: '16px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      padding: '20px',
                      backgroundColor: '#f5f5f5',
                      border: '2px solid #999',
                      borderRadius: '5px'
                    }}>
                      📭 No items in inventory - Start questing to earn rewards!
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Raw Data Debug */}
        {playerData && process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Raw Data (Debug)</h3>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(playerData, null, 2)}
            </pre>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;