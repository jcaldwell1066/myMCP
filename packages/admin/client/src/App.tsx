import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';

// Components
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import QuestEditor from './pages/QuestEditor';
import QuestTemplateList from './pages/QuestTemplateList';
import QuestTemplateEditor from './pages/QuestTemplateEditor';
import PlayerManagement from './pages/PlayerManagement';
import SystemMonitoring from './pages/SystemMonitoring';

function App() {
  return (
    <div className="App">
      <Router>
        <Layout>
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Quest Management */}
            <Route path="/quests" element={<Navigate to="/quests/templates" replace />} />
            <Route path="/quests/templates" element={<QuestTemplateList />} />
            <Route path="/quests/templates/new" element={<QuestTemplateEditor />} />
            <Route path="/quests/templates/:id" element={<QuestTemplateEditor />} />
            <Route path="/quests/editor" element={<QuestEditor />} />
            
            {/* Player Management */}
            <Route path="/players" element={<PlayerManagement />} />
            
            {/* System Monitoring */}
            <Route path="/system" element={<SystemMonitoring />} />
            
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      </Router>
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}

export default App;