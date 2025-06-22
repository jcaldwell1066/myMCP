import React from 'react';
import { useMcp } from 'use-mcp/react';
import { PlayerDashboard } from './components/PlayerDashboard';
import { ConnectionStatus } from './components/ConnectionStatus';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const {
    state,
    tools,
    error,
    callTool,
    retry,
    authenticate,
    clearStorage,
    log
  } = useMcp({
    url: process.env.REACT_APP_MCP_SERVER_URL || 'http://localhost:3000/mcp',
    clientName: 'myMCP Player Dashboard',
    clientUri: window.location.origin,
    autoReconnect: true,
    debug: process.env.NODE_ENV === 'development'
  });

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-gray-900">
                  myMCP Player Dashboard
                </h1>
              </div>
              <ConnectionStatus 
                state={state} 
                error={error}
                onRetry={retry}
                onAuthenticate={authenticate}
                onClearStorage={clearStorage}
              />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {state === 'ready' ? (
            <PlayerDashboard 
              tools={tools}
              callTool={callTool}
            />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">
                  {state === 'connecting' && 'Connecting to myMCP server...'}
                  {state === 'authenticating' && 'Authenticating...'}
                  {state === 'loading' && 'Loading player data...'}
                  {state === 'failed' && `Connection failed: ${error}`}
                </p>
              </div>
            </div>
          )}
        </main>

        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 right-4 max-w-sm">
            <details className="bg-gray-900 text-white text-xs p-2 rounded">
              <summary className="cursor-pointer">Debug Log ({log.length})</summary>
              <div className="mt-2 max-h-64 overflow-y-auto">
                {log.slice(-10).map((entry, i) => (
                  <div key={i} className="mb-1">
                    <span className="text-gray-400">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                    {' '}
                    <span className={`text-${entry.level === 'error' ? 'red' : entry.level === 'warn' ? 'yellow' : 'green'}-400`}>
                      [{entry.level}]
                    </span>
                    {' '}
                    {entry.message}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;