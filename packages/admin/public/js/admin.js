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
        
        // CLI Console functionality
        this.initializeCLIConsole();
    }

    initializeApiConsole() {
        const apiMethodSelect = document.getElementById('apiMethodSelect');
        const apiBodyContainer = document.getElementById('apiBodyContainer');
        const apiEndpoint = document.getElementById('apiEndpoint');
        const apiSendBtn = document.getElementById('apiSendBtn');
        const savedApiSelect = document.getElementById('savedApiSelect');
        const runSavedApiBtn = document.getElementById('runSavedApi');
        const addApiBtn = document.getElementById('addApiBtn');
        const clearBtn = document.getElementById('clearApiConsole');

        // Initialize resize functionality
        this.initializeApiResize();

        // Initialize pipeline filters
        this.initializePipelineFilters();

        // Clear button functionality
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const output = document.getElementById('apiOutput');
                output.innerHTML = '<div class="api-welcome">API Console cleared. Ready for new requests.</div>';
                output.scrollTop = 0;
            });
        }

        // Keyboard shortcut for clearing console (Ctrl+L)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'l' && !document.getElementById('api-view').classList.contains('hidden')) {
                e.preventDefault();
                const output = document.getElementById('apiOutput');
                output.innerHTML = '<div class="api-welcome">API Console cleared. Ready for new requests.</div>';
                output.scrollTop = 0;
            }
        });

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

    initializeApiResize() {
        const resizeHandle = document.getElementById('apiResizeHandle');
        const resizableContainer = document.getElementById('apiConsoleResizable');
        const apiConsole = resizableContainer?.querySelector('.api-console');
        
        if (!resizeHandle || !resizableContainer || !apiConsole) return;

        let isResizing = false;
        let startY = 0;
        let startHeight = 0;

        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.clientY;
            startHeight = resizableContainer.offsetHeight;
            document.body.style.cursor = 'nwse-resize';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaY = e.clientY - startY;
            const newHeight = Math.min(Math.max(startHeight + deltaY, 300), window.innerHeight * 0.8);
            
            resizableContainer.style.height = newHeight + 'px';
            apiConsole.style.height = newHeight + 'px';
            
            e.preventDefault();
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                
                // Save the height preference to localStorage
                const height = resizableContainer.offsetHeight;
                localStorage.setItem('apiConsoleHeight', height);
            }
        });

        // Restore saved height if available
        const savedHeight = localStorage.getItem('apiConsoleHeight');
        if (savedHeight) {
            resizableContainer.style.height = savedHeight + 'px';
            apiConsole.style.height = savedHeight + 'px';
        }
    }

    initializePipelineFilters() {
        // Get all pipeline checkboxes and inputs
        const pipelineCheckboxes = document.querySelectorAll('.pipeline-checkbox');
        const pipelineInputs = document.querySelectorAll('.pipeline-input');
        const pipelineHeader = document.getElementById('pipelineHeader');
        const pipelineFilters = document.getElementById('pipelineFilters');

        // Add collapse/expand functionality
        if (pipelineHeader && pipelineFilters) {
            // Load saved state from localStorage
            const isCollapsed = localStorage.getItem('pipelineFiltersCollapsed') === 'true';
            if (isCollapsed) {
                pipelineHeader.classList.add('collapsed');
                pipelineFilters.classList.add('collapsed');
            }

            pipelineHeader.addEventListener('click', () => {
                const isCurrentlyCollapsed = pipelineHeader.classList.contains('collapsed');
                
                if (isCurrentlyCollapsed) {
                    pipelineHeader.classList.remove('collapsed');
                    pipelineFilters.classList.remove('collapsed');
                    localStorage.setItem('pipelineFiltersCollapsed', 'false');
                } else {
                    pipelineHeader.classList.add('collapsed');
                    pipelineFilters.classList.add('collapsed');
                    localStorage.setItem('pipelineFiltersCollapsed', 'true');
                }
            });
        }

        // Add event listeners to checkboxes
        pipelineCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const inputId = e.target.id + 'Query';
                const input = document.getElementById(inputId);
                if (input) {
                    input.disabled = !e.target.checked;
                    if (e.target.checked) {
                        input.focus();
                    }
                }
                
                // Update active filter count
                this.updatePipelineActiveCount();
            });
        });

        // Initial count update
        this.updatePipelineActiveCount();

        // Add example queries on focus for better UX
        document.getElementById('pipeJqQuery').addEventListener('focus', function() {
            if (this.value === '.') {
                this.placeholder = 'Examples: .data | .player.name | .[] | keys';
            }
        });

        document.getElementById('pipeGrepQuery').addEventListener('focus', function() {
            if (!this.value) {
                this.placeholder = 'Examples: error | -v "debug" | -i "player"';
            }
        });

        document.getElementById('pipeSedQuery').addEventListener('focus', function() {
            if (!this.value) {
                this.placeholder = 'Examples: s/localhost/127.0.0.1/g | s/"//g';
            }
        });

        document.getElementById('pipeCustomQuery').addEventListener('focus', function() {
            if (!this.value) {
                this.placeholder = 'Examples: awk \'{print $1}\' | sort | uniq -c';
            }
        });
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
            case 'cli':
                this.loadCLICommands();
                // Auto-focus the CLI input
                setTimeout(() => {
                    const cliInput = document.getElementById('cliCommand');
                    if (cliInput) cliInput.focus();
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

    // Redis Syntax Highlighter
    highlightRedis(data, dataType = 'auto') {
        // Handle different Redis response types
        if (data === null || data === undefined) {
            return '<span class="redis-nil">(nil)</span>';
        }
        
        if (typeof data === 'string') {
            // Check if it's a Redis INFO response
            if (data.includes('\r\n') && data.includes(':')) {
                return this.highlightRedisInfo(data);
            }
            // Check if it's a number
            if (!isNaN(data) && !isNaN(parseFloat(data))) {
                return `<span class="redis-number">${data}</span>`;
            }
            // Regular string
            return `<span class="redis-string">"${this.escapeHtml(data)}"</span>`;
        }
        
        if (typeof data === 'number') {
            return `<span class="redis-number">${data}</span>`;
        }
        
        if (Array.isArray(data)) {
            return this.highlightRedisArray(data);
        }
        
        if (typeof data === 'object') {
            // Could be a hash or other structure
            return this.highlightRedisObject(data);
        }
        
        return this.escapeHtml(String(data));
    }

    highlightRedisInfo(info) {
        const sections = info.split('\r\n\r\n').filter(s => s.trim());
        const highlighted = sections.map(section => {
            const lines = section.split('\r\n').filter(l => l.trim());
            const sectionName = lines[0];
            
            if (sectionName.startsWith('#')) {
                // Section header
                const sectionHtml = lines.slice(1).map(line => {
                    const [key, value] = line.split(':');
                    if (key && value) {
                        return `<div class="redis-line"><span class="redis-info-key">${key}</span>:<span class="redis-info-value">${value}</span></div>`;
                    }
                    return `<div class="redis-line">${line}</div>`;
                }).join('');
                
                return `<div class="redis-info-section">
                    <div class="redis-section-header">${sectionName}</div>
                    ${sectionHtml}
                </div>`;
            }
            
            return section;
        }).join('');
        
        return `<div class="redis-syntax">${highlighted}</div>`;
    }

    highlightRedisArray(arr) {
        if (arr.length === 0) {
            return '<span class="redis-nil">(empty array)</span>';
        }
        
        const items = arr.map((item, index) => {
            const highlighted = this.highlightRedis(item);
            return `<div class="redis-line">
                <span class="redis-list-index">${index + 1})</span>
                ${highlighted}
            </div>`;
        }).join('');
        
        return `<div class="redis-syntax">
            <div class="redis-array-bracket">[</div>
            <div style="margin-left: 1rem;">${items}</div>
            <div class="redis-array-bracket">]</div>
        </div>`;
    }

    highlightRedisObject(obj) {
        const entries = Object.entries(obj).map(([key, value]) => {
            const highlightedValue = this.highlightRedis(value);
            return `<div class="redis-line">
                <span class="redis-hash-field">${this.escapeHtml(key)}</span> → ${highlightedValue}
            </div>`;
        }).join('');
        
        return `<div class="redis-syntax">${entries}</div>`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    displayRedisResult(result) {
        const output = document.getElementById('redisOutput');
        
        if (result.success) {
            let resultData = result.result.result || result.result;
            let formattedResult;
            
            // Use the Redis highlighter
            formattedResult = this.highlightRedis(resultData);
            
            const resultDiv = document.createElement('div');
            resultDiv.className = 'redis-result';
            resultDiv.innerHTML = formattedResult;
            output.lastElementChild.appendChild(resultDiv);
        } else {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'redis-result';
            errorDiv.innerHTML = `<span class="redis-error">Error: ${this.escapeHtml(result.error)}</span>`;
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
                <div class="redis-syntax">
                    <div class="redis-section">
                        <div class="redis-section-header">Available commands:</div>
                        <div class="redis-line"><span class="redis-key">help</span> - Show this help message</div>
                        <div class="redis-line"><span class="redis-key">clear</span> - Clear the console</div>
                    </div>
                    
                    <div class="redis-section">
                        <div class="redis-section-header">Common Redis commands:</div>
                        <div class="redis-line"><span class="redis-key">KEYS</span> <span class="redis-string">pattern</span> - Find all keys matching pattern</div>
                        <div class="redis-line"><span class="redis-key">GET</span> <span class="redis-string">key</span> - Get the value of a key</div>
                        <div class="redis-line"><span class="redis-key">SET</span> <span class="redis-string">key</span> <span class="redis-string">value</span> - Set a key to a value</div>
                        <div class="redis-line"><span class="redis-key">EXISTS</span> <span class="redis-string">key</span> - Check if a key exists</div>
                        <div class="redis-line"><span class="redis-key">DEL</span> <span class="redis-string">key</span> - Delete a key</div>
                        <div class="redis-line"><span class="redis-key">INFO</span> - Get server information</div>
                        <div class="redis-line"><span class="redis-key">DBSIZE</span> - Get number of keys in database</div>
                    </div>
                    
                    <div class="redis-section">
                        <div class="redis-section-header">Player commands:</div>
                        <div class="redis-line"><span class="redis-key">SMEMBERS</span> <span class="redis-string">game:players</span> - List all players</div>
                        <div class="redis-line"><span class="redis-key">GET</span> <span class="redis-string">player:&lt;id&gt;</span> - Get player data</div>
                        <div class="redis-line"><span class="redis-key">ZREVRANGE</span> <span class="redis-string">game:leaderboard:score</span> <span class="redis-number">0</span> <span class="redis-number">9</span> - Top 10 leaderboard</div>
                    </div>
                    
                    <div style="margin-top: 1rem; color: #999; font-size: 0.875rem;">
                        Use the saved queries panel for quick access to common queries.
                    </div>
                </div>
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
                endpoint: '/health',
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
                endpoint: '/api/state/jcadwell-mcp',
                description: 'Get state for a specific player'
            },
            {
                id: 'all-players',
                name: 'List All Players',
                method: 'GET',
                endpoint: '/api/players',
                description: 'Get all players'
            },
            {
                id: 'default-state',
                name: 'Get Default State',
                method: 'GET',
                endpoint: '/api/state',
                description: 'Get default player state'
            },
            {
                id: 'start-quest',
                name: 'Start Quest',
                method: 'POST',
                endpoint: '/api/actions/jcadwell-mcp',
                body: JSON.stringify({
                    type: 'START_QUEST',
                    payload: {
                        questId: 'global-meeting'
                    },
                    playerId: 'jcadwell-mcp'
                }, null, 2),
                description: 'Start a quest for a player'
            },
            {
                id: 'complete-step',
                name: 'Complete Quest Step',
                method: 'POST',
                endpoint: '/api/actions/jcadwell-mcp',
                body: JSON.stringify({
                    type: 'COMPLETE_QUEST_STEP',
                    payload: {
                        stepId: 'find-allies'
                    },
                    playerId: 'jcadwell-mcp'
                }, null, 2),
                description: 'Complete a quest step'
            },
            {
                id: 'chat-message',
                name: 'Send Chat Message',
                method: 'POST',
                endpoint: '/api/actions/jcadwell-mcp',
                body: JSON.stringify({
                    type: 'CHAT',
                    payload: {
                        message: 'Hello, what quests are available?'
                    },
                    playerId: 'jcadwell-mcp'
                }, null, 2),
                description: 'Send a chat message and get AI response'
            },
            {
                id: 'get-completions',
                name: 'Get Completions',
                method: 'GET',
                endpoint: '/api/context/completions?prefix=quest',
                description: 'Get command completions'
            },
            {
                id: 'quest-catalog',
                name: 'Quest Catalog',
                method: 'GET',
                endpoint: '/api/quest-catalog',
                description: 'Get all available quest definitions'
            },
            {
                id: 'game-stats',
                name: 'Game Statistics',
                method: 'GET',
                endpoint: '/api/stats',
                description: 'Get overall game statistics'
            },
            {
                id: 'llm-status',
                name: 'LLM Status',
                method: 'GET',
                endpoint: '/api/llm/status',
                description: 'Check LLM provider status'
            },
            {
                id: 'multiplayer-status',
                name: 'Multiplayer Status',
                method: 'GET',
                endpoint: '/api/multiplayer/status',
                description: 'Get multiplayer service status'
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

    // JSON Syntax Highlighter
    highlightJSON(json) {
        if (typeof json !== 'string') {
            json = JSON.stringify(json, null, 2);
        }
        
        // Escape HTML
        json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Regular expressions for different JSON parts
        const patterns = [
            // Keys with quotes
            { regex: /"([^"]+)"(\s*):/, replacement: '<span class="json-key">"$1"</span><span class="json-punctuation">$2:</span>' },
            // String values
            { regex: /: "([^"]*)"/g, replacement: ': <span class="json-string">"$1"</span>' },
            // Numbers
            { regex: /: (-?\d+\.?\d*)/g, replacement: ': <span class="json-number">$1</span>' },
            // Booleans
            { regex: /: (true|false)/g, replacement: ': <span class="json-boolean">$1</span>' },
            // Null
            { regex: /: (null)/g, replacement: ': <span class="json-null">$1</span>' },
            // Array/object brackets and commas
            { regex: /([{}\[\],])/g, replacement: '<span class="json-punctuation">$1</span>' }
        ];
        
        // Apply patterns
        patterns.forEach(pattern => {
            json = json.replace(pattern.regex, pattern.replacement);
        });
        
        // Add line wrapping for better readability
        const lines = json.split('\n');
        const wrappedLines = lines.map((line, index) => {
            return `<div class="json-line" data-line="${index + 1}">${line}</div>`;
        });
        
        return `<div class="json-syntax">${wrappedLines.join('')}</div>`;
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
        requestDiv.innerHTML = `<div class="api-request-header"><span class="api-timestamp">[${timestamp}]</span> <span class="api-method">${method}</span> <span class="api-endpoint">${endpoint}</span> <span style="color: #666;">→ ${target}</span></div>`;
        
        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
            // Highlight request body if it's JSON
            let highlightedBody = body;
            try {
                const parsedBody = JSON.parse(body);
                highlightedBody = this.highlightJSON(parsedBody);
            } catch (e) {
                // Not JSON, display as plain text
                highlightedBody = `<pre style="margin: 0.25rem 0; color: #999; font-size: 0.8rem;">${body}</pre>`;
            }
            requestDiv.innerHTML += `<div style="margin-left: 1rem; margin-bottom: 0.5rem;"><div style="color: #666; font-size: 0.8rem;">Request Body:</div>${highlightedBody}</div>`;
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

            // Use the proxy endpoint to avoid CORS issues
            const proxyEndpoint = `/api/proxy${endpoint}?target=${encodeURIComponent(target)}`;
            
            const startTime = Date.now();
            const response = await fetch(proxyEndpoint, options);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            let jsonData;
            try {
                jsonData = await response.json();
                
                // Process through pipeline if any filters are enabled
                jsonData = await this.processPipeline(jsonData);
            } catch (e) {
                jsonData = await response.text();
            }

            const responseDiv = document.createElement('div');
            responseDiv.className = 'api-response';
            
            // Format the response based on content type
            let formattedResponse;
            if (typeof jsonData === 'string') {
                formattedResponse = `<pre style="margin: 0; color: ${response.ok ? '#d4d4d4' : '#e74c3c'};">${jsonData}</pre>`;
            } else {
                formattedResponse = this.highlightJSON(jsonData);
            }
            
            // Add pipeline indicator if filters are active
            const activeFilters = [];
            if (document.getElementById('pipeJq').checked) activeFilters.push('jq');
            if (document.getElementById('pipeGrep').checked) activeFilters.push('grep');
            if (document.getElementById('pipeSed').checked) activeFilters.push('sed');
            if (document.getElementById('pipeCustom').checked) activeFilters.push('custom');
            
            const pipelineInfo = activeFilters.length > 0 
                ? `<div class="api-pipeline-info">📊 Filtered through: ${activeFilters.join(' | ')}</div>`
                : '';
            
            responseDiv.innerHTML = `<div class="api-status ${response.ok ? 'success' : 'error'}">${response.status} ${response.statusText} (${responseTime}ms)</div><div class="api-headers">Content-Type: ${response.headers.get('content-type') || 'unknown'}</div>${pipelineInfo}<div class="api-result">${formattedResponse}</div>`;
            
            requestDiv.appendChild(responseDiv);
        } catch (error) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'api-response';
            errorDiv.innerHTML = `<div class="api-status error">Request Failed</div><div class="api-result"><pre style="margin: 0; color: #e74c3c;">${error.message}</pre></div>`;
            requestDiv.appendChild(errorDiv);
        }
        
        output.scrollTop = output.scrollHeight;
    }

    // Process the API response through the enabled pipeline filters
    async processPipeline(data) {
        let result = data;
        
        // Check which filters are enabled and build the pipeline
        const filters = [];
        
        if (document.getElementById('pipeJq').checked) {
            const query = document.getElementById('pipeJqQuery').value || '.';
            filters.push({ type: 'jq', query });
        }
        
        if (document.getElementById('pipeGrep').checked) {
            const query = document.getElementById('pipeGrepQuery').value;
            if (query) {
                filters.push({ type: 'grep', query });
            }
        }
        
        if (document.getElementById('pipeSed').checked) {
            const query = document.getElementById('pipeSedQuery').value;
            if (query) {
                filters.push({ type: 'sed', query });
            }
        }
        
        if (document.getElementById('pipeCustom').checked) {
            const query = document.getElementById('pipeCustomQuery').value;
            if (query) {
                filters.push({ type: 'custom', query });
            }
        }
        
        // Apply filters in sequence
        for (const filter of filters) {
            try {
                result = await this.applyFilter(result, filter);
            } catch (error) {
                console.error(`Pipeline filter error (${filter.type}):`, error);
                // Return error message but continue with other filters
                result = { 
                    pipelineError: `Filter '${filter.type}' failed: ${error.message}`,
                    originalData: result 
                };
            }
        }
        
        return result;
    }

    // Apply individual filter based on type
    async applyFilter(data, filter) {
        const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
        
        switch (filter.type) {
            case 'jq':
                return this.applyJqFilter(data, filter.query);
                
            case 'grep':
                return this.applyGrepFilter(jsonString, filter.query);
                
            case 'sed':
                return this.applySedFilter(jsonString, filter.query);
                
            case 'custom':
                // For custom filters, we'll just return the data with a note
                // In a real implementation, this could call a server-side endpoint
                return {
                    customFilter: filter.query,
                    data: data,
                    note: 'Custom filters would be processed server-side for security'
                };
                
            default:
                return data;
        }
    }

    // Simple jq-like filter implementation
    applyJqFilter(data, query) {
        if (query === '.') {
            return data;
        }
        
        try {
            // Basic jq query support
            let result = data;
            const parts = query.split('|').map(p => p.trim());
            
            for (const part of parts) {
                if (part === '.') {
                    continue;
                } else if (part === 'keys') {
                    result = Object.keys(result);
                } else if (part === '.[]') {
                    result = Array.isArray(result) ? result : Object.values(result);
                } else if (part.startsWith('.')) {
                    // Property access like .data or .player.name
                    const path = part.substring(1).split('.');
                    for (const key of path) {
                        if (result && typeof result === 'object' && key in result) {
                            result = result[key];
                        } else {
                            throw new Error(`Property '${key}' not found`);
                        }
                    }
                }
            }
            
            return result;
        } catch (error) {
            throw new Error(`jq filter error: ${error.message}`);
        }
    }

    // Simple grep-like filter
    applyGrepFilter(text, pattern) {
        const lines = text.split('\n');
        let filtered;
        
        if (pattern.startsWith('-v ')) {
            // Inverse match
            const searchPattern = pattern.substring(3);
            filtered = lines.filter(line => !line.includes(searchPattern));
        } else if (pattern.startsWith('-i ')) {
            // Case insensitive
            const searchPattern = pattern.substring(3).toLowerCase();
            filtered = lines.filter(line => line.toLowerCase().includes(searchPattern));
        } else {
            // Normal match
            filtered = lines.filter(line => line.includes(pattern));
        }
        
        return filtered.join('\n');
    }

    // Simple sed-like filter
    applySedFilter(text, pattern) {
        if (!pattern.startsWith('s/')) {
            throw new Error('Only substitution (s///) is supported');
        }
        
        const parts = pattern.split('/');
        if (parts.length < 4) {
            throw new Error('Invalid sed pattern');
        }
        
        const search = parts[1];
        const replace = parts[2];
        const flags = parts[3] || '';
        
        if (flags.includes('g')) {
            return text.replace(new RegExp(search, 'g'), replace);
        } else {
            return text.replace(search, replace);
        }
    }

    updatePipelineActiveCount() {
        const activeCheckboxes = document.querySelectorAll('.pipeline-checkbox:checked');
        const count = activeCheckboxes.length;
        const countElement = document.getElementById('pipelineActiveCount');
        const headerElement = document.getElementById('pipelineHeader');
        
        if (countElement) {
            countElement.textContent = count.toString();
        }
        
        if (headerElement) {
            if (count > 0) {
                headerElement.classList.add('has-active-filters');
            } else {
                headerElement.classList.remove('has-active-filters');
            }
        }
    }
    
    // CLI Console Methods
    initializeCLIConsole() {
        const cliCommand = document.getElementById('cliCommand');
        const clearBtn = document.getElementById('clearCliConsole');
        const modeSelect = document.getElementById('cliModeSelect');
        const savedCliSelect = document.getElementById('savedCliSelect');
        const runSavedCliBtn = document.getElementById('runSavedCli');
        const addCliBtn = document.getElementById('addCliBtn');
        
        // Initialize resize functionality
        this.initializeCLIResize();
        
        // Initialize pipeline filters
        this.initializeCLIPipelineFilters();
        
        // Initialize command history
        this.cliHistory = [];
        this.cliHistoryIndex = -1;
        
        // Clear button functionality
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearCLIConsole());
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'l' && !document.getElementById('cli-view').classList.contains('hidden')) {
                e.preventDefault();
                this.clearCLIConsole();
            }
        });
        
        // Command input handling
        if (cliCommand) {
            cliCommand.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.executeCLICommand();
                }
            });
            
            // Command history navigation
            cliCommand.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateCLIHistory(-1);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateCLIHistory(1);
                } else if (e.key === 'Tab') {
                    e.preventDefault();
                    this.showCLISuggestions();
                }
            });
            
            // Auto-complete suggestions
            cliCommand.addEventListener('input', (e) => {
                this.updateCLISuggestions(e.target.value);
            });
        }
        
        // Saved commands functionality
        if (savedCliSelect) {
            savedCliSelect.addEventListener('change', (e) => {
                runSavedCliBtn.disabled = !e.target.value;
            });
        }
        
        if (runSavedCliBtn) {
            runSavedCliBtn.addEventListener('click', () => {
                const selectedId = savedCliSelect.value;
                if (selectedId) {
                    const command = this.getCLICommand(selectedId);
                    if (command) {
                        document.getElementById('cliCommand').value = command.command;
                        this.executeCLICommand();
                    }
                }
            });
        }
        
        if (addCliBtn) {
            addCliBtn.addEventListener('click', () => {
                this.addCurrentCLICommand();
            });
        }
        
        // Load saved commands
        this.loadCLICommands();
    }
    
    initializeCLIResize() {
        const resizeHandle = document.getElementById('cliResizeHandle');
        const resizableContainer = document.getElementById('cliConsoleResizable');
        const cliConsole = resizableContainer?.querySelector('.api-console');
        
        if (!resizeHandle || !resizableContainer || !cliConsole) return;
        
        let isResizing = false;
        let startY = 0;
        let startHeight = 0;
        
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.clientY;
            startHeight = resizableContainer.offsetHeight;
            document.body.style.cursor = 'nwse-resize';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaY = e.clientY - startY;
            const newHeight = Math.min(Math.max(startHeight + deltaY, 300), window.innerHeight * 0.8);
            
            resizableContainer.style.height = newHeight + 'px';
            cliConsole.style.height = newHeight + 'px';
            
            e.preventDefault();
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                
                // Save the height preference
                const height = resizableContainer.offsetHeight;
                localStorage.setItem('cliConsoleHeight', height);
            }
        });
        
        // Restore saved height
        const savedHeight = localStorage.getItem('cliConsoleHeight');
        if (savedHeight) {
            resizableContainer.style.height = savedHeight + 'px';
            cliConsole.style.height = savedHeight + 'px';
        }
    }
    
    initializeCLIPipelineFilters() {
        const pipelineHeader = document.getElementById('cliPipelineHeader');
        const pipelineFilters = document.getElementById('cliPipelineFilters');
        const checkboxes = document.querySelectorAll('#cliPipelineContainer .pipeline-checkbox');
        
        // Collapse/expand functionality
        if (pipelineHeader && pipelineFilters) {
            const isCollapsed = localStorage.getItem('cliPipelineFiltersCollapsed') === 'true';
            if (isCollapsed) {
                pipelineHeader.classList.add('collapsed');
                pipelineFilters.classList.add('collapsed');
            }
            
            pipelineHeader.addEventListener('click', () => {
                const isCurrentlyCollapsed = pipelineHeader.classList.contains('collapsed');
                
                if (isCurrentlyCollapsed) {
                    pipelineHeader.classList.remove('collapsed');
                    pipelineFilters.classList.remove('collapsed');
                    localStorage.setItem('cliPipelineFiltersCollapsed', 'false');
                } else {
                    pipelineHeader.classList.add('collapsed');
                    pipelineFilters.classList.add('collapsed');
                    localStorage.setItem('cliPipelineFiltersCollapsed', 'true');
                }
            });
        }
        
        // Enable/disable inputs based on checkbox state
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const inputId = e.target.id + 'Query';
                const input = document.getElementById(inputId);
                if (input) {
                    input.disabled = !e.target.checked;
                    if (e.target.checked) {
                        input.focus();
                    }
                }
                
                // Update active filter count
                this.updateCLIPipelineActiveCount();
            });
        });
        
        // Initial count update
        this.updateCLIPipelineActiveCount();
    }
    
    updateCLIPipelineActiveCount() {
        const activeCheckboxes = document.querySelectorAll('#cliPipelineContainer .pipeline-checkbox:checked');
        const count = activeCheckboxes.length;
        const countElement = document.getElementById('cliPipelineActiveCount');
        
        if (countElement) {
            countElement.textContent = count.toString();
            countElement.style.display = count > 0 ? 'inline-block' : 'none';
            
            // Add visual indicator
            if (count > 0) {
                countElement.style.background = '#4CAF50';
                countElement.style.color = 'white';
                countElement.style.padding = '0 0.5rem';
                countElement.style.borderRadius = '10px';
                countElement.style.fontSize = '0.75rem';
                countElement.style.marginLeft = '0.5rem';
            }
        }
    }
    
    clearCLIConsole() {
        const output = document.getElementById('cliOutput');
        output.innerHTML = '<div class="api-welcome">CLI Console cleared. Ready for new commands.</div>';
        output.scrollTop = 0;
    }
    
    navigateCLIHistory(direction) {
        const input = document.getElementById('cliCommand');
        if (!input || this.cliHistory.length === 0) return;
        
        if (direction === -1 && this.cliHistoryIndex < this.cliHistory.length - 1) {
            this.cliHistoryIndex++;
        } else if (direction === 1 && this.cliHistoryIndex > -1) {
            this.cliHistoryIndex--;
        }
        
        if (this.cliHistoryIndex === -1) {
            input.value = '';
        } else {
            input.value = this.cliHistory[this.cliHistory.length - 1 - this.cliHistoryIndex];
        }
    }
    
    async updateCLISuggestions(value) {
        const suggestionsDiv = document.getElementById('cliSuggestions');
        if (!value) {
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        try {
            const response = await fetch(`/cli/suggestions?prefix=${encodeURIComponent(value)}`);
            const data = await response.json();
            
            if (data.suggestions && data.suggestions.length > 0) {
                suggestionsDiv.innerHTML = data.suggestions.map((cmd, index) => `
                    <div class="suggestion-item ${index === 0 ? 'selected' : ''}" data-command="${cmd.command}">
                        <span class="suggestion-command">${cmd.command}</span>
                        <span class="suggestion-description">${cmd.description}</span>
                        ${cmd.requiresArgs ? '<span class="suggestion-args">requires args</span>' : ''}
                    </div>
                `).join('');
                
                suggestionsDiv.style.display = 'block';
                
                // Add click handlers
                suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
                    item.addEventListener('click', () => {
                        document.getElementById('cliCommand').value = item.dataset.command;
                        suggestionsDiv.style.display = 'none';
                        document.getElementById('cliCommand').focus();
                    });
                });
            } else {
                suggestionsDiv.style.display = 'none';
            }
        } catch (error) {
            console.error('Failed to fetch CLI suggestions:', error);
            suggestionsDiv.style.display = 'none';
        }
    }
    
    showCLISuggestions() {
        const input = document.getElementById('cliCommand');
        const suggestionsDiv = document.getElementById('cliSuggestions');
        
        if (suggestionsDiv.style.display === 'block') {
            // Navigate through suggestions
            const items = suggestionsDiv.querySelectorAll('.suggestion-item');
            const selected = suggestionsDiv.querySelector('.suggestion-item.selected');
            
            if (selected && items.length > 0) {
                const currentIndex = Array.from(items).indexOf(selected);
                const nextIndex = (currentIndex + 1) % items.length;
                
                selected.classList.remove('selected');
                items[nextIndex].classList.add('selected');
                
                // Auto-complete with selected suggestion
                input.value = items[nextIndex].dataset.command;
            }
        } else {
            // Show suggestions
            this.updateCLISuggestions(input.value);
        }
    }
    
    async executeCLICommand() {
        const input = document.getElementById('cliCommand');
        const command = input.value.trim();
        
        if (!command) return;
        
        // Hide suggestions
        document.getElementById('cliSuggestions').style.display = 'none';
        
        // Add to history
        this.cliHistory.push(command);
        this.cliHistoryIndex = -1;
        
        // Clear input
        input.value = '';
        
        // Clear welcome message
        const welcome = document.querySelector('#cliOutput .api-welcome');
        if (welcome) welcome.remove();
        
        // Display command
        const output = document.getElementById('cliOutput');
        const timestamp = new Date().toLocaleTimeString();
        const commandDiv = document.createElement('div');
        commandDiv.className = 'cli-command-line';
        commandDiv.innerHTML = `<span style="color: #666;">[${timestamp}]</span> <span style="color: #4CAF50;">mycli&gt;</span> ${this.escapeHtml(command)}`;
        output.appendChild(commandDiv);
        
        // Parse command and arguments
        const parts = this.parseCommand(command);
        const mode = document.getElementById('cliModeSelect').value;
        
        try {
            const response = await fetch('/cli/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    command: parts.command,
                    args: parts.args,
                    mode: mode
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                let outputText = result.output || '';
                
                // Apply pipeline filters if any are enabled
                outputText = await this.processCLIPipeline(outputText);
                
                // Convert ANSI colors to HTML if not stripped
                if (!document.getElementById('cliPipeStripAnsi').checked) {
                    outputText = this.convertAnsiToHtml(outputText);
                }
                
                const outputDiv = document.createElement('div');
                outputDiv.className = 'cli-output-section';
                outputDiv.innerHTML = outputText;
                output.appendChild(outputDiv);
            } else {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'cli-error';
                errorDiv.innerHTML = `Error: ${result.error}`;
                if (result.details) {
                    errorDiv.innerHTML += `<br><small>${result.details}</small>`;
                }
                if (result.errorOutput) {
                    errorDiv.innerHTML += `<pre style="margin-top: 0.5rem;">${this.escapeHtml(result.errorOutput)}</pre>`;
                }
                output.appendChild(errorDiv);
            }
        } catch (error) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'cli-error';
            errorDiv.innerHTML = `Failed to execute command: ${error.message}`;
            output.appendChild(errorDiv);
        }
        
        output.scrollTop = output.scrollHeight;
    }
    
    parseCommand(commandString) {
        // Simple command parsing that handles quoted arguments
        const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
        const parts = [];
        let match;
        
        while ((match = regex.exec(commandString)) !== null) {
            parts.push(match[1] || match[2] || match[0]);
        }
        
        return {
            command: parts[0] || '',
            args: parts.slice(1)
        };
    }
    
    convertAnsiToHtml(text) {
        // Basic ANSI escape code to HTML conversion
        const ansiRegex = /\x1b\[([0-9;]+)m/g;
        const colorMap = {
            '30': 'ansi-black',
            '31': 'ansi-red',
            '32': 'ansi-green',
            '33': 'ansi-yellow',
            '34': 'ansi-blue',
            '35': 'ansi-magenta',
            '36': 'ansi-cyan',
            '37': 'ansi-white',
            '90': 'ansi-bright-black',
            '91': 'ansi-bright-red',
            '92': 'ansi-bright-green',
            '93': 'ansi-bright-yellow',
            '94': 'ansi-bright-blue',
            '95': 'ansi-bright-magenta',
            '96': 'ansi-bright-cyan',
            '97': 'ansi-bright-white',
            '1': 'ansi-bold',
            '2': 'ansi-dim',
            '3': 'ansi-italic',
            '4': 'ansi-underline'
        };
        
        let openSpans = [];
        
        return text.replace(ansiRegex, (match, codes) => {
            if (codes === '0') {
                // Reset
                const closeTags = openSpans.map(() => '</span>').join('');
                openSpans = [];
                return closeTags;
            }
            
            const codeList = codes.split(';');
            const classes = codeList.map(code => colorMap[code]).filter(Boolean);
            
            if (classes.length > 0) {
                openSpans.push(...classes);
                return classes.map(cls => `<span class="${cls}">`).join('');
            }
            
            return '';
        }) + openSpans.map(() => '</span>').join('');
    }
    
    async processCLIPipeline(text) {
        let result = text;
        
        // Strip ANSI codes if enabled
        if (document.getElementById('cliPipeStripAnsi').checked) {
            result = result.replace(/\x1b\[[0-9;]+m/g, '');
        }
        
        // Apply grep filter
        if (document.getElementById('cliPipeGrep').checked) {
            const pattern = document.getElementById('cliPipeGrepQuery').value;
            if (pattern) {
                result = this.applyGrepFilter(result, pattern);
            }
        }
        
        // Apply sed filter
        if (document.getElementById('cliPipeSed').checked) {
            const pattern = document.getElementById('cliPipeSedQuery').value;
            if (pattern) {
                try {
                    result = this.applySedFilter(result, pattern);
                } catch (error) {
                    console.error('Sed filter error:', error);
                }
            }
        }
        
        // Extract JSON if enabled
        if (document.getElementById('cliPipeJson').checked) {
            const jsonMatches = result.match(/\{[\s\S]*\}|\[[\s\S]*\]/g);
            if (jsonMatches) {
                try {
                    const jsonData = JSON.parse(jsonMatches[0]);
                    result = this.highlightJSON(jsonData);
                } catch (error) {
                    // Not valid JSON, keep original
                }
            }
        }
        
        return result;
    }
    
    loadCLICommands() {
        // Predefined CLI commands
        const predefinedCommands = [
            { id: 'status', name: 'Player Status', command: 'status' },
            { id: 'health', name: 'Health Check', command: 'health' },
            { id: 'quests', name: 'List Quests', command: 'quests' },
            { id: 'score', name: 'Get Score', command: 'get-score' },
            { id: 'chat-hello', name: 'Chat Hello', command: 'chat "Hello there!"' },
            { id: 'progress', name: 'Quest Progress', command: 'progress' },
            { id: 'history', name: 'Chat History', command: 'history 10' }
        ];
        
        // Load custom commands from localStorage
        this.customCLICommands = this.loadCustomCLICommands();
        
        // Update the select dropdown
        const select = document.getElementById('savedCliSelect');
        if (select) {
            select.innerHTML = '<option value="">Select a command...</option>';
            
            // Add predefined commands
            predefinedCommands.forEach(cmd => {
                const option = document.createElement('option');
                option.value = cmd.id;
                option.textContent = cmd.name;
                select.appendChild(option);
            });
            
            // Add custom commands
            if (this.customCLICommands.length > 0) {
                const separator = document.createElement('option');
                separator.disabled = true;
                separator.textContent = '── Custom Commands ──';
                select.appendChild(separator);
                
                this.customCLICommands.forEach(cmd => {
                    const option = document.createElement('option');
                    option.value = cmd.id;
                    option.textContent = cmd.name;
                    select.appendChild(option);
                });
            }
        }
        
        // Store predefined commands for reference
        this.predefinedCLICommands = predefinedCommands;
        this.updateSavedCLIList();
    }
    
    updateSavedCLIList() {
        const listContainer = document.getElementById('savedCliList');
        if (!listContainer) return;
        
        const allCommands = [
            ...this.predefinedCLICommands,
            ...this.customCLICommands
        ];
        
        if (allCommands.length === 0) {
            listContainer.innerHTML = '<p style="color: #999; font-size: 0.875rem;">No saved commands</p>';
            return;
        }
        
        listContainer.innerHTML = allCommands.map(cmd => {
            const isCustom = cmd.id.startsWith('custom-');
            return `
                <div class="saved-query-item ${isCustom ? 'custom' : ''}">
                    <div class="query-info">
                        <strong>${cmd.name}</strong>
                        <div class="query-command">${cmd.command}</div>
                    </div>
                    ${isCustom ? `<button class="delete-btn" onclick="dashboard.deleteCustomCLICommand('${cmd.id}')" title="Delete">×</button>` : ''}
                </div>
            `;
        }).join('');
    }
    
    getCLICommand(id) {
        const predefined = this.predefinedCLICommands.find(c => c.id === id);
        if (predefined) return predefined;
        
        return this.customCLICommands.find(c => c.id === id);
    }
    
    loadCustomCLICommands() {
        const stored = localStorage.getItem('customCLICommands');
        return stored ? JSON.parse(stored) : [];
    }
    
    saveCustomCLICommands() {
        localStorage.setItem('customCLICommands', JSON.stringify(this.customCLICommands));
    }
    
    addCurrentCLICommand() {
        const input = document.getElementById('cliCommand');
        const command = input?.value.trim() || this.cliHistory[this.cliHistory.length - 1];
        
        if (!command) {
            alert('Please enter a CLI command first');
            return;
        }
        
        const name = prompt('Enter a name for this command:', command);
        if (!name) return;
        
        const customCommand = {
            id: `custom-${Date.now()}`,
            name: name,
            command: command
        };
        
        this.customCLICommands.push(customCommand);
        this.saveCustomCLICommands();
        this.loadCLICommands();
        
        // Select the newly added command
        const select = document.getElementById('savedCliSelect');
        if (select) {
            select.value = customCommand.id;
            document.getElementById('runSavedCli').disabled = false;
        }
    }
    
    deleteCustomCLICommand(id) {
        if (confirm('Delete this custom command?')) {
            this.customCLICommands = this.customCLICommands.filter(c => c.id !== id);
            this.saveCustomCLICommands();
            this.loadCLICommands();
        }
    }
}

// Initialize dashboard on page load
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new AdminDashboard();
}); 