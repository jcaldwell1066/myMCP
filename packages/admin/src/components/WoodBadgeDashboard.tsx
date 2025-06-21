import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface TrainingParticipant {
  id: string;
  name: string;
  currentStep: string;
  completedSteps: number;
  totalSteps: number;
  patrol: string;
  role: string;
}

interface WoodBadgeStats {
  totalParticipants: number;
  activeParticipants: number;
  completedTraining: number;
  averageProgress: number;
  currentPhase: string;
}

export const WoodBadgeDashboard: React.FC = () => {
  const [participants, setParticipants] = useState<TrainingParticipant[]>([]);
  const [stats, setStats] = useState<WoodBadgeStats>({
    totalParticipants: 0,
    activeParticipants: 0,
    completedTraining: 0,
    averageProgress: 0,
    currentPhase: 'Foundation Knowledge'
  });

  useEffect(() => {
    // Simulate loading training data
    const mockParticipants: TrainingParticipant[] = [
      {
        id: 'wb-001',
        name: 'Sarah Mitchell',
        currentStep: 'CLI Training Command Center',
        completedSteps: 2,
        totalSteps: 8,
        patrol: 'Eagle',
        role: 'Assistant Scoutmaster'
      },
      {
        id: 'wb-002',
        name: 'Mike Rodriguez',
        currentStep: 'Smart Training Dashboard',
        completedSteps: 3,
        totalSteps: 8,
        patrol: 'Bear',
        role: 'Den Leader'
      },
      {
        id: 'wb-003',
        name: 'Jennifer Park',
        currentStep: 'Wood Badge Foundation Mastery',
        completedSteps: 1,
        totalSteps: 8,
        patrol: 'Fox',
        role: 'Committee Chair'
      }
    ];

    setParticipants(mockParticipants);
    setStats({
      totalParticipants: mockParticipants.length,
      activeParticipants: mockParticipants.filter(p => p.completedSteps < p.totalSteps).length,
      completedTraining: mockParticipants.filter(p => p.completedSteps === p.totalSteps).length,
      averageProgress: Math.round(mockParticipants.reduce((acc, p) => acc + (p.completedSteps / p.totalSteps * 100), 0) / mockParticipants.length),
      currentPhase: 'Multi-Modal Integration'
    });
  }, []);

  const WoodBadgeASCIIArt = () => (
    <div className="font-mono text-sm text-center mb-6">
      <div className="text-yellow-600">
        <pre>{`
     ⚜️
    ╱│╲
   ╱ │ ╲
  ╱  │  ╲
 ╱   │   ╲
╱    │    ╲`}</pre>
      </div>
      <div className="text-blue-800 font-bold mt-2">
        WOOD BADGE TRAINING 2025
      </div>
      <div className="text-green-700 text-xs mt-1">
        Central Florida Council
      </div>
    </div>
  );

  const PatrolBadgeASCII = ({ patrol }: { patrol: string }) => {
    const badges = {
      Eagle: '🦅',
      Bear: '🐻', 
      Fox: '🦊',
      Wolf: '🐺',
      Beaver: '🦫',
      Owl: '🦉'
    };
    
    return (
      <div className="font-mono text-xs">
        <pre>{`
┌─────────┐
│   ${badges[patrol as keyof typeof badges] || '⚜️'}   │
│ ${patrol.padEnd(7)} │
└─────────┘`}</pre>
      </div>
    );
  };

  const StaffBadgeASCII = () => (
    <div className="font-mono text-xs text-center text-blue-800">
      <pre>{`
┌─────────────┐
│  ⚜️ STAFF ⚜️  │
│   TRAINER   │
│  WOOD BADGE │
└─────────────┘`}</pre>
    </div>
  );

  const TrainingPhaseIndicator = () => (
    <div className="font-mono text-xs text-center">
      <div className="flex justify-center space-x-4 mb-2">
        <div className="text-green-600">{'█'.repeat(3)}</div>
        <div className="text-yellow-600">{'█'.repeat(2)}</div>
        <div className="text-gray-400">{'░'.repeat(3)}</div>
      </div>
      <div className="text-xs text-gray-600">
        Phase 1: Foundation | Phase 2: Skills | Phase 3: Implementation
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gradient-to-br from-blue-50 to-green-50 min-h-screen">
      <WoodBadgeASCIIArt />
      
      {/* Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{stats.totalParticipants}</div>
            <div className="text-xs text-gray-500">Staff Trainees</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Training</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeParticipants}</div>
            <div className="text-xs text-gray-500">In Progress</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.completedTraining}</div>
            <div className="text-xs text-gray-500">Ready for Staff</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.averageProgress}%</div>
            <div className="text-xs text-gray-500">Overall</div>
          </CardContent>
        </Card>
      </div>

      {/* Current Phase Indicator */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Training Phase Progress</span>
            <Badge variant="outline" className="text-blue-800">
              {stats.currentPhase}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrainingPhaseIndicator />
        </CardContent>
      </Card>

      {/* Participant Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span>Participant Progress</span>
              <div className="ml-auto">
                <StaffBadgeASCII />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {participants.map((participant) => (
                <div key={participant.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{participant.name}</h4>
                      <p className="text-sm text-gray-600">{participant.role}</p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        {participant.patrol} Patrol
                      </Badge>
                    </div>
                    <div className="text-right">
                      <PatrolBadgeASCII patrol={participant.patrol} />
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Current Step: {participant.currentStep}</span>
                      <span>{participant.completedSteps}/{participant.totalSteps}</span>
                    </div>
                    <Progress 
                      value={(participant.completedSteps / participant.totalSteps) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Multi-Modal Integration Status */}
        <Card>
          <CardHeader>
            <CardTitle>Multi-Modal Integration Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium">CLI Interface</span>
                </div>
                <Badge variant="default" className="bg-green-500">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium">Web Dashboard</span>
                </div>
                <Badge variant="default" className="bg-blue-500">Live</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium">MCP Integration</span>
                </div>
                <Badge variant="default" className="bg-purple-500">Connected</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm font-medium">Slack Integration</span>
                </div>
                <Badge variant="default" className="bg-yellow-500">Synced</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                  <span className="text-sm font-medium">Discord Community</span>
                </div>
                <Badge variant="outline">Setup</Badge>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-900 text-white rounded-lg font-mono text-xs">
              <div className="text-center mb-2">🏕️ CAMP LA-NO-CHE STATUS 🏕️</div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div>Weather: ☀️ Clear</div>
                  <div>Temp: 72°F</div>
                </div>
                <div>
                  <div>Participants: {stats.totalParticipants}</div>
                  <div>Staff: Ready</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Training Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <div className="flex items-center text-sm p-2 bg-green-50 rounded">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              <span className="text-gray-600 text-xs mr-2">15:34</span>
              <span>Sarah Mitchell completed "CLI Training Command Center" ✅</span>
            </div>
            <div className="flex items-center text-sm p-2 bg-blue-50 rounded">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
              <span className="text-gray-600 text-xs mr-2">15:28</span>
              <span>Mike Rodriguez started "Smart Training Dashboard" 🎯</span>
            </div>
            <div className="flex items-center text-sm p-2 bg-yellow-50 rounded">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
              <span className="text-gray-600 text-xs mr-2">15:22</span>
              <span>New participant joined: Jennifer Park (Fox Patrol) 👋</span>
            </div>
            <div className="flex items-center text-sm p-2 bg-purple-50 rounded">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
              <span className="text-gray-600 text-xs mr-2">15:15</span>
              <span>MCP server health check: All systems operational 🟢</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer with Wood Badge motto */}
      <div className="mt-8 text-center font-mono text-sm text-gray-600">
        <div className="border-t pt-4">
          ⚜️ "Back to Gilwell, Happy Land" ⚜️
          <br />
          <span className="text-xs">Central Florida Council • Wood Badge Course 16-83-25</span>
        </div>
      </div>
    </div>
  );
};

export default WoodBadgeDashboard;