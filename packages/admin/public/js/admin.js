// Admin Dashboard Client
class AdminDashboard {
    constructor() {
        this.socket = io();
        this.currentView = 'dashboard';
        this.data = {};
        this.customQueries = [];
        this.customApiRequests = [];
        this.initializeSocket();
        this.initializeUI();
        this.subscribeToUpdates();
    }

    initializeSocket() {
        this.socket.on('connect', () => {
            console.log('Connected to admin server');
            this.updateConnectionStatus(true);
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from admin server');
            this.updateConnectionStatus(false);
        });

        this.socket.on('dashboard:initial', (data) => {
            this.data.dashboard = data;
            this.updateDashboard(data);
        });

        this.socket.on('dashboard:update', (data) => {
            this.data.dashboard = data;
            if (this.currentView === 'dashboard') {
                this.updateDashboard(data);
            }
        });

        this.socket.on('health:update', (data) => {
            this.data.health = data;
            if (this.currentView === 'health') {
                this.updateHealth(data);
            }
        });

        this.socket.on('metrics:update', (data) => {
            this.data.metrics = data;
            if (this.currentView === 'metrics') {
                this.updateMetrics(data);
            }
        });

        this.socket.on('leaderboard:update', (data) => {
            this.data.leaderboard = data;
            if (this.currentView === 'leaderboard') {
                this.updateLeaderboard(data);
            }
        });

        this.socket.on('admin:event', (event) => {
            this.addEvent(event);
        });

        this.socket.on('redis:result', (result) => {
            this.displayRedisResult(result);
        });
    }

    initializeUI() {
        // Navigation
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                this.switchView(view);
            });
        });

        // Redis console
        const redisInput = document.getElementById('redisCommand');
        if (redisInput) {
            redisInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const command = e.target.value.trim();
                    if (command) {
                        if (command.toLowerCase() === 'help') {
                            this.showRedisHelp();
                        } else if (command.toLowerCase() === 'clear') {
                            this.clearRedisConsole();
                        } else {
                            this.executeRedisCommand(command);
                        }
                        e.target.value = '';
                    }
                }
            });

            // Auto-focus on Redis console when switching to it
            redisInput.addEventListener('focus', () => {
                redisInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        }

        // Saved queries functionality
        const savedQuerySelect = document.getElementById('savedQuerySelect');
        const runSavedQueryBtn = document.getElementById('runSavedQuery');
        const addQueryBtn = document.getElementById('addQueryBtn');

        if (savedQuerySelect) {
            savedQuerySelect.addEventListener('change', (e) => {
                runSavedQueryBtn.disabled = !e.target.value;
            });
        }

        if (runSavedQueryBtn) {
            runSavedQueryBtn.addEventListener('click', () => {
                const selectedId = savedQuerySelect.value;
                if (selectedId) {
                    if (selectedId.startsWith('custom-')) {
                        // Run custom query
                        const customQuery = this.getCustomQuery(selectedId);
                        if (customQuery) {
                            const fullCommand = `${customQuery.command} ${customQuery.args.join(' ')}`;
                            this.executeRedisCommand(fullCommand);
                        }
                    } else {
                        // Run predefined query
                        this.executeSavedQuery(selectedId);
                    }
                }
            });
        }

        if (addQueryBtn) {
            addQueryBtn.addEventListener('click', () => {
                this.addCurrentCommandAsQuery();
            });
        }

        // Player search
        const playerSearch = document.getElementById('playerSearch');
        if (playerSearch) {
            let searchTimeout;
            playerSearch.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.searchPlayers(e.target.value);
                }, 300);
            });
        }

        // API Console functionality
        this.initializeApiConsole();
    }

    initializeApiConsole() {
        const apiMethodSelect = document.getElementById('apiMethodSelect');
        const apiBodyContainer = document.getElementById('apiBodyContainer');
        const apiEndpoint = document.getElementById('apiEndpoint');
        const apiSendBtn = document.getElementById('apiSendBtn');
        const savedApiSelect = document.getElementById('savedApiSelect');
        const runSavedApiBtn = document.getElementById('runSavedApi');
        const addApiBtn = document.getElementById('addApiBtn');

        // Show/hide body field based on method
        if (apiMethodSelect) {
            apiMethodSelect.addEventListener('change', (e) => {
                const method = e.target.value;
                if (['POST', 'PUT', 'PATCH'].includes(method)) {
                    apiBodyContainer.classList.remove('hidden');
                } else {
                    apiBodyContainer.classList.add('hidden');
                }
            });
        }

        // Send API request
        if (apiSendBtn) {
            apiSendBtn.addEventListener('click', () => {
                this.sendApiRequest();
            });
        }

        // Handle Enter key in endpoint input
        if (apiEndpoint) {
            apiEndpoint.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendApiRequest();
                }
            });
        }

        // Saved API requests functionality
        if (savedApiSelect) {
            savedApiSelect.addEventListener('change', (e) => {
                runSavedApiBtn.disabled = !e.target.value;
            });
        }

        if (runSavedApiBtn) {
            runSavedApiBtn.addEventListener('click', () => {
                const selectedId = savedApiSelect.value;
                if (selectedId) {
                    const request = this.getApiRequest(selectedId);
                    if (request) {
                        // Load the request into the form
                        document.getElementById('apiMethodSelect').value = request.method;
                        document.getElementById('apiEndpoint').value = request.endpoint;
                        document.getElementById('apiTargetSelect').value = request.target || 'http://localhost:3001';
                        
                        if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
                            apiBodyContainer.classList.remove('hidden');
                            document.getElementById('apiBody').value = request.body || '';
                        } else {
                            apiBodyContainer.classList.add('hidden');
                        }
                        
                        // Send the request
                        this.sendApiRequest();
                    }
                }
            });
        }

        if (addApiBtn) {
            addApiBtn.addEventListener('click', () => {
                this.addCurrentApiRequest();
            });
        }
    }

    subscribeToUpdates() {
        this.socket.emit('subscribe', ['dashboard', 'health', 'metrics', 'leaderboard']);
    }

    switchView(view) {
        // Update navigation
        document.querySelectorAll('.sidebar-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === view);
        });

        // Hide all views
        document.querySelectorAll('.view').forEach(v => {
            v.classList.add('hidden');
        });

        // Show selected view
        const viewElement = document.getElementById(`${view}-view`);
        if (viewElement) {
            viewElement.classList.remove('hidden');
        }

        this.currentView = view;

        // Load view-specific data
        this.loadViewData(view);
    }

    async loadViewData(view) {
        switch (view) {
            case 'dashboard':
                const dashboardData = await this.fetchData('/api/dashboard');
                this.updateDashboard(dashboardData);
                break;
            case 'health':
                const healthData = await this.fetchData('/api/health');
                this.updateHealth(healthData);
                break;
            case 'engines':
                const enginesData = await this.fetchData('/api/health/engines');
                this.updateEngines(enginesData);
                break;
            case 'players':
                const playersData = await this.fetchData('/api/players');
                this.updatePlayers(playersData);
                break;
            case 'leaderboard':
                const leaderboardData = await this.fetchData('/api/leaderboard');
                this.updateLeaderboard(leaderboardData);
                break;
            case 'redis':
                const savedQueries = await this.fetchData('/api/redis/saved-queries');
                this.updateSavedQueries(savedQueries);
                // Auto-focus the Redis input
                setTimeout(() => {
                    const redisInput = document.getElementById('redisCommand');
                    if (redisInput) redisInput.focus();
                }, 100);
                break;
            case 'api':
                this.loadApiRequests();
                // Auto-focus the API endpoint input
                setTimeout(() => {
                    const apiInput = document.getElementById('apiEndpoint');
                    if (apiInput) apiInput.focus();
                }, 100);
                break;
            case 'events':
                const eventsData = await this.fetchData('/api/events');
                this.updateEvents(eventsData);
                break;
            case 'metrics':
                const metricsData = await this.fetchData('/api/metrics');
                this.updateMetrics(metricsData);
                break;
        }
    }

    async fetchData(url) {
        try {
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch data:', error);
            return null;
        }
    }

    updateConnectionStatus(connected) {
        const indicator = document.getElementById('connectionStatus');
        const text = document.getElementById('connectionText');
        
        if (connected) {
            indicator.className = 'status-indicator status-healthy';
            text.textContent = 'Connected';
        } else {
            indicator.className = 'status-indicator status-critical';
            text.textContent = 'Disconnected';
        }
    }

    updateDashboard(data) {
        if (!data) return;

        // Update overview metrics
        document.getElementById('overallHealth').textContent = data.overview.systemHealth;
        document.getElementById('activeEngines').textContent = 
            `${data.overview.engines.filter(e => e.status === 'online').length}/${data.overview.engines.length}`;
        document.getElementById('redisStatus').textContent = data.redisInfo.connected ? 'Connected' : 'Disconnected';
        
        document.getElementById('totalPlayers').textContent = data.overview.totalPlayers;
        document.getElementById('activePlayers').textContent = data.overview.activePlayers;
        document.getElementById('questsCompleted').textContent = data.overview.completedQuests;

        // Update top players
        const topPlayersList = document.getElementById('topPlayersList');
        if (data.topPlayers && data.topPlayers.length > 0) {
            topPlayersList.innerHTML = data.topPlayers.slice(0, 5).map((player, index) => `
                <div class="metric">
                    <span>${index + 1}. ${player.playerName}</span>
                    <span class="metric-value">${player.score}</span>
                </div>
            `).join('');
        } else {
            topPlayersList.innerHTML = '<p>No players yet</p>';
        }

        // Update recent events
        const eventsList = document.getElementById('recentEventsList');
        if (data.recentEvents && data.recentEvents.length > 0) {
            eventsList.innerHTML = data.recentEvents.slice(0, 5).map(event => `
                <div class="event-item event-${event.type}">
                    <small>${new Date(event.timestamp).toLocaleTimeString()}</small>
                    <div>${event.message}</div>
                </div>
            `).join('');
        } else {
            eventsList.innerHTML = '<p>No recent events</p>';
        }
    }

    updateHealth(data) {
        if (!data) return;

        const healthChecks = document.getElementById('healthChecks');
        healthChecks.innerHTML = data.checks.map(check => `
            <div class="metric">
                <span>${check.name}</span>
                <span class="status-indicator status-${check.status}"></span>
                <span>${check.message || check.status}</span>
            </div>
        `).join('');

        const systemResources = document.getElementById('systemResources');
        systemResources.innerHTML = `
            <div class="metric">
                <span>CPU Usage</span>
                <span class="metric-value">${data.system.cpu[0].toFixed(1)}%</span>
            </div>
            <div class="metric">
                <span>Memory Usage</span>
                <span class="metric-value">${data.system.memory.percentage.toFixed(1)}%</span>
            </div>
            <div class="metric">
                <span>Load Average</span>
                <span class="metric-value">${data.system.loadAverage[0].toFixed(2)}</span>
            </div>
            <div class="metric">
                <span>Uptime</span>
                <span class="metric-value">${Math.floor(data.system.uptime / 3600)}h</span>
            </div>
        `;
    }

    updateEngines(engines) {
        if (!engines) return;

        const enginesList = document.getElementById('enginesList');
        enginesList.innerHTML = engines.map(engine => `
            <li class="engine-item">
                <div>
                    <strong>${engine.engineId}</strong>
                    <br>
                    <small>${engine.url}</small>
                </div>
                <div>
                    <span class="status-indicator status-${engine.status === 'online' ? 'healthy' : 'critical'}"></span>
                    ${engine.status} (${engine.role})
                    ${engine.responseTime ? `<br><small>${engine.responseTime}ms</small>` : ''}
                </div>
            </li>
        `).join('');
    }

    updatePlayers(players) {
        if (!players) return;

        const playersList = document.getElementById('playersList');
        if (players.length > 0) {
            playersList.innerHTML = `
                <table class="leaderboard-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Score</th>
                            <th>Level</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${players.map(player => `
                            <tr>
                                <td>${player.id}</td>
                                <td>${player.name}</td>
                                <td>${player.score}</td>
                                <td>${player.level}</td>
                                <td>${player.status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            playersList.innerHTML = '<p>No players found</p>';
        }
    }

    updateLeaderboard(data) {
        if (!data) return;

        const leaderboardBody = document.getElementById('leaderboardBody');
        if (data.length > 0) {
            leaderboardBody.innerHTML = data.map(entry => `
                <tr>
                    <td>${entry.rank}</td>
                    <td>${entry.playerName}</td>
                    <td>${entry.score}</td>
                    <td>${entry.level}</td>
                    <td>${entry.questsCompleted}</td>
                </tr>
            `).join('');
        } else {
            leaderboardBody.innerHTML = '<tr><td colspan="5">No leaderboard data</td></tr>';
        }
    }

    updateSavedQueries(queries) {
        if (!queries) return;

        // Store the queries data for later use
        this.data.savedQueries = queries;

        // Get custom queries from localStorage
        this.customQueries = this.loadCustomQueries();

        // Update the select dropdown
        const select = document.getElementById('savedQuerySelect');
        if (select) {
            select.innerHTML = '<option value="">Select a query...</option>';
            
            // Add predefined queries
            queries.forEach(query => {
                const option = document.createElement('option');
                option.value = query.id;
                option.textContent = query.name;
                select.appendChild(option);
            });

            // Add separator if there are custom queries
            if (this.customQueries.length > 0) {
                const separator = document.createElement('option');
                separator.disabled = true;
                separator.textContent = '── Custom Queries ──';
                select.appendChild(separator);

                // Add custom queries
                this.customQueries.forEach(query => {
                    const option = document.createElement('option');
                    option.value = query.id;
                    option.textContent = query.name;
                    select.appendChild(option);
                });
            }
        }

        // Update the list display
        this.updateSavedQueriesList();
    }

    updateSavedQueriesList() {
        const listContainer = document.getElementById('savedQueriesList');
        if (!listContainer) return;

        const allQueries = [
            ...(this.data.savedQueries || []),
            ...this.customQueries
        ];

        if (allQueries.length === 0) {
            listContainer.innerHTML = '<p style="color: #999; font-size: 0.875rem;">No saved queries</p>';
            return;
        }

        listContainer.innerHTML = allQueries.map(query => {
            const isCustom = query.id.startsWith('custom-');
            return `
                <div class="saved-query-item ${isCustom ? 'custom' : ''}">
                    <div class="query-info">
                        <strong>${query.name}</strong>
                        <div class="query-command">${query.command} ${query.args ? query.args.join(' ') : ''}</div>
                    </div>
                    ${isCustom ? `<button class="delete-btn" onclick="dashboard.deleteCustomQuery('${query.id}')" title="Delete">×</button>` : ''}
                </div>
            `;
        }).join('');
    }

    loadCustomQueries() {
        const stored = localStorage.getItem('redisCustomQueries');
        return stored ? JSON.parse(stored) : [];
    }

    saveCustomQueries() {
        localStorage.setItem('redisCustomQueries', JSON.stringify(this.customQueries));
    }

    getCustomQuery(id) {
        return this.customQueries.find(q => q.id === id);
    }

    addCurrentCommandAsQuery() {
        const input = document.getElementById('redisCommand');
        const command = input?.value.trim();
        
        if (!command) {
            alert('Please enter a Redis command first');
            return;
        }

        const name = prompt('Enter a name for this query:', command);
        if (!name) return;

        const parts = command.split(' ');
        const customQuery = {
            id: `custom-${Date.now()}`,
            name: name,
            command: parts[0].toUpperCase(),
            args: parts.slice(1),
            description: `Custom query: ${command}`
        };

        this.customQueries.push(customQuery);
        this.saveCustomQueries();
        this.updateSavedQueries(this.data.savedQueries);
        
        // Clear the input
        input.value = '';
        
        // Select the newly added query
        const select = document.getElementById('savedQuerySelect');
        if (select) {
            select.value = customQuery.id;
            document.getElementById('runSavedQuery').disabled = false;
        }
    }

    deleteCustomQuery(id) {
        if (confirm('Delete this custom query?')) {
            this.customQueries = this.customQueries.filter(q => q.id !== id);
            this.saveCustomQueries();
            this.updateSavedQueries(this.data.savedQueries);
        }
    }

    updateEvents(events) {
        if (!events) return;

        const eventLog = document.getElementById('eventLog');
        eventLog.innerHTML = events.map(event => `
            <div class="event-item event-${event.type}">
                <small>${new Date(event.timestamp).toLocaleString()}</small>
                <div><strong>${event.source}</strong>: ${event.message}</div>
                ${event.details ? `<pre>${JSON.stringify(event.details, null, 2)}</pre>` : ''}
            </div>
        `).join('');
    }

    updateMetrics(data) {
        if (!data) return;

        const currentMetrics = document.getElementById('currentMetrics');
        currentMetrics.innerHTML = `
            <div class="metric">
                <span>CPU Usage</span>
                <span class="metric-value">${data.cpu.usage.toFixed(1)}%</span>
            </div>
            <div class="metric">
                <span>Memory</span>
                <span class="metric-value">${(data.memory.used / 1024 / 1024 / 1024).toFixed(1)}GB / ${(data.memory.total / 1024 / 1024 / 1024).toFixed(1)}GB</span>
            </div>
            <div class="metric">
                <span>Process Heap</span>
                <span class="metric-value">${(data.process.memory.heapUsed / 1024 / 1024).toFixed(1)}MB</span>
            </div>
            <div class="metric">
                <span>Uptime</span>
                <span class="metric-value">${Math.floor(data.uptime / 3600)}h ${Math.floor((data.uptime % 3600) / 60)}m</span>
            </div>
        `;
    }

    executeRedisCommand(command) {
        if (!command) return;

        // Clear welcome message if it exists
        const welcome = document.querySelector('.redis-welcome');
        if (welcome) welcome.remove();

        // Display the command being executed
        const output = document.getElementById('redisOutput');
        const timestamp = new Date().toLocaleTimeString();
        const commandDiv = document.createElement('div');
        commandDiv.innerHTML = `
            <div style="margin-bottom: 0.5rem;">
                <span class="redis-timestamp">[${timestamp}]</span>
                <span class="redis-command">&gt; ${command}</span>
            </div>
        `;
        output.appendChild(commandDiv);

        const parts = command.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);

        this.socket.emit('redis:query', {
            id: Date.now(),
            command: cmd,
            args: args
        });
    }

    displayRedisResult(result) {
        const output = document.getElementById('redisOutput');
        
        if (result.success) {
            let resultData = result.result.result || result.result;
            let formattedResult;
            
            // Format the result based on type
            if (typeof resultData === 'string') {
                // Handle multi-line strings (like INFO command)
                if (resultData.includes('\r\n')) {
                    formattedResult = resultData.split('\r\n').join('\n');
                } else {
                    formattedResult = resultData;
                }
            } else if (Array.isArray(resultData)) {
                if (resultData.length === 0) {
                    formattedResult = '(empty array)';
                } else if (resultData.length > 20) {
                    formattedResult = JSON.stringify(resultData.slice(0, 20), null, 2) + `\n... and ${resultData.length - 20} more items`;
                } else {
                    formattedResult = JSON.stringify(resultData, null, 2);
                }
            } else if (typeof resultData === 'object' && resultData !== null) {
                formattedResult = JSON.stringify(resultData, null, 2);
            } else {
                formattedResult = String(resultData);
            }
            
            const resultDiv = document.createElement('div');
            resultDiv.className = 'redis-result';
            resultDiv.innerHTML = `<pre style="margin: 0; color: #d4d4d4;">${formattedResult}</pre>`;
            output.lastElementChild.appendChild(resultDiv);
        } else {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'redis-result redis-error';
            errorDiv.textContent = `Error: ${result.error}`;
            output.lastElementChild.appendChild(errorDiv);
        }
        
        output.scrollTop = output.scrollHeight;
    }

    async executeSavedQuery(queryId) {
        try {
            // Find the saved query
            const savedQuery = this.data.savedQueries?.find(q => q.id === queryId);
            if (!savedQuery) {
                throw new Error('Saved query not found');
            }

            // Clear welcome message if it exists
            const welcome = document.querySelector('.redis-welcome');
            if (welcome) welcome.remove();

            // Display the command being executed
            const output = document.getElementById('redisOutput');
            const timestamp = new Date().toLocaleTimeString();
            const commandDiv = document.createElement('div');
            commandDiv.innerHTML = `
                <div style="margin-bottom: 0.5rem;">
                    <span class="redis-timestamp">[${timestamp}]</span>
                    <span class="redis-command">&gt; ${savedQuery.command} ${savedQuery.args.join(' ')}</span>
                </div>
            `;
            output.appendChild(commandDiv);

            // Execute the query
            const response = await fetch(`/api/redis/saved-queries/${queryId}`, { method: 'POST' });
            const result = await response.json();
            
            // Display the result
            this.displayRedisResult({ success: true, result });
        } catch (error) {
            this.displayRedisResult({ success: false, error: error.message });
        }
    }

    searchPlayers(query) {
        this.socket.emit('players:search', query);
        this.socket.once('players:results', (players) => {
            this.updatePlayers(players);
        });
    }

    showRedisHelp() {
        const output = document.getElementById('redisOutput');
        const timestamp = new Date().toLocaleTimeString();
        const helpDiv = document.createElement('div');
        helpDiv.innerHTML = `
            <div style="margin-bottom: 0.5rem;">
                <span class="redis-timestamp">[${timestamp}]</span>
                <span class="redis-command">&gt; help</span>
            </div>
            <div class="redis-result">
                <pre style="margin: 0; color: #d4d4d4;">Available commands:
  help              - Show this help message
  clear             - Clear the console
  
Common Redis commands:
  KEYS pattern      - Find all keys matching pattern
  GET key           - Get the value of a key
  SET key value     - Set a key to a value
  EXISTS key        - Check if a key exists
  DEL key           - Delete a key
  INFO              - Get server information
  DBSIZE            - Get number of keys in database
  
Player commands:
  SMEMBERS game:players                    - List all players
  GET player:&lt;id&gt;                         - Get player data
  ZREVRANGE game:leaderboard:score 0 9     - Top 10 leaderboard
  
Use the saved queries panel for quick access to common queries.</pre>
            </div>
        `;
        output.appendChild(helpDiv);
        output.scrollTop = output.scrollHeight;
    }

    clearRedisConsole() {
        const output = document.getElementById('redisOutput');
        output.innerHTML = '<div class="redis-welcome">Console cleared. Type "help" for available commands.</div>';
    }

    addEvent(event) {
        if (this.currentView === 'events') {
            const eventLog = document.getElementById('eventLog');
            const eventDiv = document.createElement('div');
            eventDiv.className = `event-item event-${event.type}`;
            eventDiv.innerHTML = `
                <small>${new Date(event.timestamp).toLocaleString()}</small>
                <div><strong>${event.source}</strong>: ${event.message}</div>
                ${event.details ? `<pre>${JSON.stringify(event.details, null, 2)}</pre>` : ''}
            `;
            eventLog.insertBefore(eventDiv, eventLog.firstChild);
        }
    }

    // API Console Methods
    loadApiRequests() {
        // Load custom API requests from localStorage
        this.customApiRequests = this.loadCustomApiRequests();
        
        // Predefined API requests from test suite
        const predefinedRequests = [
            {
                id: 'health-check',
                name: 'Health Check',
                method: 'GET',
                endpoint: '/api/health',
                description: 'Check system health status'
            },
            {
                id: 'engine-status',
                name: 'Engine Status',
                method: 'GET',
                endpoint: '/api/status',
                description: 'Get engine status information'
            },
            {
                id: 'player-state',
                name: 'Get Player State',
                method: 'GET',
                endpoint: '/api/state/player/jcadwell-mcp',
                description: 'Get state for a specific player'
            },
            {
                id: 'all-players',
                name: 'List All Players',
                method: 'GET',
                endpoint: '/api/state',
                description: 'Get all player states'
            },
            {
                id: 'start-quest',
                name: 'Start Quest',
                method: 'POST',
                endpoint: '/api/action/start-quest',
                body: JSON.stringify({
                    playerId: 'jcadwell-mcp',
                    questId: 'time-quest'
                }, null, 2),
                description: 'Start a quest for a player'
            },
            {
                id: 'complete-step',
                name: 'Complete Quest Step',
                method: 'POST',
                endpoint: '/api/action/complete-step',
                body: JSON.stringify({
                    playerId: 'jcadwell-mcp',
                    stepId: 'find-clock-tower'
                }, null, 2),
                description: 'Complete a quest step'
            },
            {
                id: 'use-item',
                name: 'Use Item',
                method: 'POST',
                endpoint: '/api/action/use-item',
                body: JSON.stringify({
                    playerId: 'jcadwell-mcp',
                    itemId: 'time-crystal'
                }, null, 2),
                description: 'Use an item from inventory'
            },
            {
                id: 'get-completions',
                name: 'Get Completions',
                method: 'GET',
                endpoint: '/api/completions?prefix=examine',
                description: 'Get command completions'
            },
            {
                id: 'leaderboard',
                name: 'Get Leaderboard',
                method: 'GET',
                endpoint: '/api/leaderboard',
                description: 'Get the player leaderboard'
            }
        ];

        this.data.savedApiRequests = predefinedRequests;
        this.updateSavedApiRequests();
    }

    updateSavedApiRequests() {
        const select = document.getElementById('savedApiSelect');
        const listContainer = document.getElementById('savedApiList');
        
        if (!select) return;

        // Clear and rebuild select
        select.innerHTML = '<option value="">Select a request...</option>';
        
        // Add predefined requests
        this.data.savedApiRequests.forEach(request => {
            const option = document.createElement('option');
            option.value = request.id;
            option.textContent = request.name;
            select.appendChild(option);
        });

        // Add separator if there are custom requests
        if (this.customApiRequests.length > 0) {
            const separator = document.createElement('option');
            separator.disabled = true;
            separator.textContent = '── Custom Requests ──';
            select.appendChild(separator);

            // Add custom requests
            this.customApiRequests.forEach(request => {
                const option = document.createElement('option');
                option.value = request.id;
                option.textContent = request.name;
                select.appendChild(option);
            });
        }

        // Update the list display
        if (listContainer) {
            const allRequests = [
                ...(this.data.savedApiRequests || []),
                ...this.customApiRequests
            ];

            if (allRequests.length === 0) {
                listContainer.innerHTML = '<p style="color: #999; font-size: 0.875rem;">No saved requests</p>';
                return;
            }

            listContainer.innerHTML = allRequests.map(request => {
                const isCustom = request.id.startsWith('custom-');
                return `
                    <div class="saved-query-item ${isCustom ? 'custom' : ''}">
                        <div class="query-info">
                            <strong>${request.name}</strong>
                            <div class="query-command">${request.method} ${request.endpoint}</div>
                        </div>
                        ${isCustom ? `<button class="delete-btn" onclick="dashboard.deleteCustomApiRequest('${request.id}')" title="Delete">×</button>` : ''}
                    </div>
                `;
            }).join('');
        }
    }

    getApiRequest(id) {
        // Check predefined requests
        const predefined = this.data.savedApiRequests?.find(r => r.id === id);
        if (predefined) return predefined;
        
        // Check custom requests
        return this.customApiRequests.find(r => r.id === id);
    }

    loadCustomApiRequests() {
        const stored = localStorage.getItem('customApiRequests');
        return stored ? JSON.parse(stored) : [];
    }

    saveCustomApiRequests() {
        localStorage.setItem('customApiRequests', JSON.stringify(this.customApiRequests));
    }

    addCurrentApiRequest() {
        const method = document.getElementById('apiMethodSelect').value;
        const endpoint = document.getElementById('apiEndpoint').value.trim();
        const target = document.getElementById('apiTargetSelect').value;
        const body = document.getElementById('apiBody').value.trim();
        
        if (!endpoint) {
            alert('Please enter an API endpoint first');
            return;
        }

        const name = prompt('Enter a name for this request:', `${method} ${endpoint}`);
        if (!name) return;

        const customRequest = {
            id: `custom-${Date.now()}`,
            name: name,
            method: method,
            endpoint: endpoint,
            target: target,
            body: body || undefined,
            description: `Custom request: ${method} ${endpoint}`
        };

        this.customApiRequests.push(customRequest);
        this.saveCustomApiRequests();
        this.updateSavedApiRequests();
        
        // Select the newly added request
        const select = document.getElementById('savedApiSelect');
        if (select) {
            select.value = customRequest.id;
            document.getElementById('runSavedApi').disabled = false;
        }
    }

    deleteCustomApiRequest(id) {
        if (confirm('Delete this custom request?')) {
            this.customApiRequests = this.customApiRequests.filter(r => r.id !== id);
            this.saveCustomApiRequests();
            this.updateSavedApiRequests();
        }
    }

    async sendApiRequest() {
        const method = document.getElementById('apiMethodSelect').value;
        const endpoint = document.getElementById('apiEndpoint').value.trim();
        const target = document.getElementById('apiTargetSelect').value;
        const body = document.getElementById('apiBody').value.trim();
        
        if (!endpoint) {
            alert('Please enter an API endpoint');
            return;
        }

        // Clear welcome message if it exists
        const welcome = document.querySelector('.api-welcome');
        if (welcome) welcome.remove();

        // Display the request being sent
        const output = document.getElementById('apiOutput');
        const timestamp = new Date().toLocaleTimeString();
        const requestDiv = document.createElement('div');
        requestDiv.className = 'api-request';
        requestDiv.innerHTML = `
            <div class="api-request-header">
                <span class="api-timestamp">[${timestamp}]</span>
                <span class="api-method">${method}</span>
                <span class="api-endpoint">${endpoint}</span>
                <span style="color: #666;">→ ${target}</span>
            </div>
        `;
        
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
            requestDiv.innerHTML += `
                <div style="margin-left: 1rem; margin-bottom: 0.5rem;">
                    <div style="color: #666; font-size: 0.8rem;">Request Body:</div>
                    <pre style="margin: 0.25rem 0; color: #999; font-size: 0.8rem;">${body}</pre>
                </div>
            `;
        }
        
        output.appendChild(requestDiv);

        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
                options.body = body;
            }

            const startTime = Date.now();
            const response = await fetch(target + endpoint, options);
            const responseTime = Date.now() - startTime;
            
            const responseData = await response.text();
            let jsonData;
            try {
                jsonData = JSON.parse(responseData);
            } catch (e) {
                jsonData = responseData;
            }

            const responseDiv = document.createElement('div');
            responseDiv.className = 'api-response';
            responseDiv.innerHTML = `
                <div class="api-status ${response.ok ? 'success' : 'error'}">
                    ${response.status} ${response.statusText} (${responseTime}ms)
                </div>
                <div class="api-headers">
                    Content-Type: ${response.headers.get('content-type') || 'unknown'}
                </div>
                <div class="api-result">
                    <pre style="margin: 0; color: ${response.ok ? '#d4d4d4' : '#e74c3c'};">${typeof jsonData === 'object' ? JSON.stringify(jsonData, null, 2) : jsonData}</pre>
                </div>
            `;
            
            requestDiv.appendChild(responseDiv);
        } catch (error) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'api-response';
            errorDiv.innerHTML = `
                <div class="api-status error">Request Failed</div>
                <div class="api-result">
                    <pre style="margin: 0; color: #e74c3c;">${error.message}</pre>
                </div>
            `;
            requestDiv.appendChild(errorDiv);
        }
        
        output.scrollTop = output.scrollHeight;
    }
}

// Initialize dashboard on page load
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new AdminDashboard();
}); 