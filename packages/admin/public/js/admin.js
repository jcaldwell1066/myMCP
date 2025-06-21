// Admin Dashboard Client
class AdminDashboard {
    constructor() {
        this.socket = io();
        this.currentView = 'dashboard';
        this.data = {};
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
                    this.executeRedisCommand(e.target.value);
                    e.target.value = '';
                }
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

        const savedQueries = document.getElementById('savedQueries');
        savedQueries.innerHTML = queries.map(query => `
            <div class="metric">
                <div>
                    <strong>${query.name}</strong>
                    <br>
                    <small>${query.description || query.command}</small>
                </div>
                <button class="btn" onclick="dashboard.executeSavedQuery('${query.id}')">Run</button>
            </div>
        `).join('');
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
        const timestamp = new Date().toLocaleTimeString();
        
        if (result.success) {
            output.innerHTML += `<div><span style="color: #999">[${timestamp}]</span> ${JSON.stringify(result.result.result, null, 2)}</div>`;
        } else {
            output.innerHTML += `<div><span style="color: #999">[${timestamp}]</span> <span style="color: #f44336">Error: ${result.error}</span></div>`;
        }
        
        output.scrollTop = output.scrollHeight;
    }

    async executeSavedQuery(queryId) {
        try {
            const response = await fetch(`/api/redis/saved-queries/${queryId}`, { method: 'POST' });
            const result = await response.json();
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

    addEvent(event) {
        // Add to events view if visible
        if (this.currentView === 'events') {
            const eventLog = document.getElementById('eventLog');
            const eventHtml = `
                <div class="event-item event-${event.type}">
                    <small>${new Date(event.timestamp).toLocaleString()}</small>
                    <div><strong>${event.source}</strong>: ${event.message}</div>
                </div>
            `;
            eventLog.insertAdjacentHTML('afterbegin', eventHtml);
        }

        // Also update recent events in dashboard
        if (this.currentView === 'dashboard') {
            const recentEventsList = document.getElementById('recentEventsList');
            if (recentEventsList) {
                const eventHtml = `
                    <div class="event-item event-${event.type}">
                        <small>${new Date(event.timestamp).toLocaleTimeString()}</small>
                        <div>${event.message}</div>
                    </div>
                `;
                recentEventsList.insertAdjacentHTML('afterbegin', eventHtml);
                
                // Keep only 5 most recent
                while (recentEventsList.children.length > 5) {
                    recentEventsList.removeChild(recentEventsList.lastChild);
                }
            }
        }
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new AdminDashboard();
}); 