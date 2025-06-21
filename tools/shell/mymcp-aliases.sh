#!/bin/bash
# myMCP Ecosystem Bash Aliases
# Add this to your ~/.bashrc or ~/.bash_profile:
# source ~/vibe/sub-modules/myMCP/tools/shell/mymcp-aliases.sh

# Set the base directory for myMCP (adjust this path as needed)
export MYMCP_HOME="${MYMCP_HOME:-$HOME/vibe/sub-modules/myMCP}"

# ========================================
# Engine Management Aliases
# ========================================

# Engine health check
alias mcp-health='curl -s http://localhost:${MCP_ENGINE_PORT:-3456}/health | jq'

# Engine status with key metrics
alias mcp-status='curl -s http://localhost:${MCP_ENGINE_PORT:-3456}/health | jq "{status, activeStates, wsConnections, llm}"'

# Start engine (background)
alias mcp-engine-start='cd $MYMCP_HOME/packages/engine && PORT=${MCP_ENGINE_PORT:-3456} node dist/index.js &'

# Start engine (foreground for debugging)
alias mcp-engine-debug='cd $MYMCP_HOME/packages/engine && PORT=${MCP_ENGINE_PORT:-3456} node dist/index.js'

# Stop engine
alias mcp-engine-stop='pkill -f "node.*packages/engine/dist/index.js"'

# Restart engine
alias mcp-engine-restart='mcp-engine-stop && sleep 2 && mcp-engine-start'

# Engine logs (if using PM2 or similar)
alias mcp-engine-logs='tail -f $MYMCP_HOME/packages/engine/logs/*.log 2>/dev/null || echo "No log files found"'

# ========================================
# MCP Server Management
# ========================================

# Start MCP server
alias mcp-server-start='cd $MYMCP_HOME/packages/mcpserver && node dist/index.js'

# Build MCP server
alias mcp-server-build='cd $MYMCP_HOME/packages/mcpserver && npm run build'

# ========================================
# Game State & Quest Queries
# ========================================

# Get player state (usage: mcp-player [playerId])
mcp-player() {
    local player_id="${1:-jcadwell-mcp}"
    curl -s "http://localhost:${MCP_ENGINE_PORT:-3456}/api/state/$player_id" | jq
}

# Get player summary (usage: mcp-player-summary [playerId])
mcp-player-summary() {
    local player_id="${1:-jcadwell-mcp}"
    curl -s "http://localhost:${MCP_ENGINE_PORT:-3456}/api/state/$player_id" | \
    jq '.data | {player: .player, activeQuest: .quests.active.title, score: .player.score, level: .player.level}'
}

# List all players
alias mcp-players='curl -s http://localhost:${MCP_ENGINE_PORT:-3456}/api/players | jq .data'

# Get quest catalog
alias mcp-quests='curl -s http://localhost:${MCP_ENGINE_PORT:-3456}/api/quest-catalog | jq ".data.quests[] | {id, title, reward}"'

# Get player's available quests (usage: mcp-quests-available [playerId])
mcp-quests-available() {
    local player_id="${1:-jcadwell-mcp}"
    curl -s "http://localhost:${MCP_ENGINE_PORT:-3456}/api/quests/$player_id" | \
    jq '.data.available[] | {id, title, description}'
}

# Get active quest details (usage: mcp-quest-active [playerId])
mcp-quest-active() {
    local player_id="${1:-jcadwell-mcp}"
    curl -s "http://localhost:${MCP_ENGINE_PORT:-3456}/api/state/$player_id" | \
    jq '.data.quests.active | {title, steps: .steps | map({description, completed})}'
}

# Save current game conversation
mcp-save-conversation() {
    local player_id="${1:-jcadwell-mcp}"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local dir="$MYMCP_HOME/conversations"
    
    mkdir -p "$dir"
    
    # Get conversation and save as JSON
    curl -s "http://localhost:${MCP_ENGINE_PORT:-3456}/api/state/$player_id" | \
    jq '.data.session.conversationHistory' > "$dir/conversation_${player_id}_${timestamp}.json"
    
    echo "✅ Saved to: $dir/conversation_${player_id}_${timestamp}.json"
}

# Export conversation as markdown
mcp-export-conversation() {
    local player_id="${1:-jcadwell-mcp}"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local dir="$MYMCP_HOME/conversations"
    
    mkdir -p "$dir"
    
    # Create markdown file
    {
        echo "# myMCP Conversation Export"
        echo "Player: $player_id"
        echo "Date: $(date)"
        echo ""
        
        curl -s "http://localhost:${MCP_ENGINE_PORT:-3456}/api/state/$player_id" | \
        jq -r '.data.session.conversationHistory[] | 
            "## \(.sender | ascii_upcase) - \(.timestamp)\n\n\(.message)\n\n---\n"'
    } > "$dir/conversation_${player_id}_${timestamp}.md"
    
    echo "✅ Exported to: $dir/conversation_${player_id}_${timestamp}.md"
}
# ========================================
# Testing & Debugging
# ========================================

# Quick smoke test - checks all core endpoints
mcp-smoke-test() {
    echo "🔍 Running myMCP Smoke Tests..."
    echo
    
    # Engine health
    echo "1️⃣ Engine Health Check:"
    if curl -s "http://localhost:${MCP_ENGINE_PORT:-3456}/health" | jq -e '.status == "ok"' > /dev/null; then
        echo "   ✅ Engine is healthy"
    else
        echo "   ❌ Engine health check failed"
    fi
    echo
    
    # API endpoints
    echo "2️⃣ API Endpoints:"
    local endpoints=("/api/players" "/api/quest-catalog" "/api/state/jcadwell-mcp")
    for endpoint in "${endpoints[@]}"; do
        if curl -s "http://localhost:${MCP_ENGINE_PORT:-3456}$endpoint" | jq -e '.success' > /dev/null 2>&1; then
            echo "   ✅ $endpoint"
        else
            echo "   ❌ $endpoint"
        fi
    done
    echo
    
    # Check for running processes
    echo "3️⃣ Running Processes:"
    ps aux | grep -E "node.*(engine|mcpserver)" | grep -v grep | while read line; do
        echo "   📦 $line" | cut -c1-80
    done
}

# Test all game actions
mcp-test-actions() {
    local player_id="${1:-test-player-$(date +%s)}"
    echo "🎮 Testing game actions for player: $player_id"
    
    # Get initial state
    echo "1. Getting initial state..."
    mcp-player "$player_id" | jq '.data.player'
    
    # Add more action tests as needed
}

# ========================================
# Slack Integration
# ========================================

# Start Slack integration
alias mcp-slack-start='cd $MYMCP_HOME/packages/slack-integration && npm start'

# Test Slack connection
alias mcp-slack-test='cd $MYMCP_HOME/packages/slack-integration && npm run test'

# ========================================
# Development Helpers
# ========================================

# Build all packages
alias mcp-build-all='cd $MYMCP_HOME && npm run build:all'

# Run all tests
alias mcp-test-all='cd $MYMCP_HOME && npm test'

# Clean and rebuild
alias mcp-clean-build='cd $MYMCP_HOME && npm run clean && npm run build:all'

# Watch mode for development
alias mcp-dev='cd $MYMCP_HOME/packages/engine && npm run dev'

# ========================================
# Process Management
# ========================================

# Show all myMCP related processes
alias mcp-ps='ps aux | grep -E "node.*(mymcp|engine|mcpserver|slack)" | grep -v grep'

# Kill all myMCP processes
alias mcp-kill-all='pkill -f "node.*(mymcp|engine|mcpserver|slack)"'

# ========================================
# Quick Actions
# ========================================

# Start a quest (usage: mcp-start-quest questId [playerId])
mcp-start-quest() {
    local quest_id="$1"
    local player_id="${2:-jcadwell-mcp}"
    
    if [ -z "$quest_id" ]; then
        echo "Usage: mcp-start-quest <questId> [playerId]"
        echo "Available quests:"
        mcp-quests
        return 1
    fi
    
    curl -X POST "http://localhost:${MCP_ENGINE_PORT:-3456}/api/actions/$player_id" \
        -H "Content-Type: application/json" \
        -d "{\"type\": \"START_QUEST\", \"payload\": {\"questId\": \"$quest_id\"}, \"playerId\": \"$player_id\"}" | jq
}

# Complete a quest step (usage: mcp-complete-step stepId [playerId])
mcp-complete-step() {
    local step_id="$1"
    local player_id="${2:-jcadwell-mcp}"
    
    if [ -z "$step_id" ]; then
        echo "Usage: mcp-complete-step <stepId> [playerId]"
        echo "Current quest steps:"
        mcp-quest-active "$player_id"
        return 1
    fi
    
    curl -X POST "http://localhost:${MCP_ENGINE_PORT:-3456}/api/actions/$player_id" \
        -H "Content-Type: application/json" \
        -d "{\"type\": \"COMPLETE_QUEST_STEP\", \"payload\": {\"stepId\": \"$step_id\"}, \"playerId\": \"$player_id\"}" | jq
}

# ========================================
# Environment Info
# ========================================

# Show myMCP environment configuration
mcp-env() {
    echo "🔧 myMCP Environment Configuration"
    echo "=================================="
    echo "MYMCP_HOME: $MYMCP_HOME"
    echo "MCP_ENGINE_PORT: ${MCP_ENGINE_PORT:-3456}"
    echo "NODE_ENV: ${NODE_ENV:-development}"
    echo
    echo "📦 Package Locations:"
    echo "  Engine: $MYMCP_HOME/packages/engine"
    echo "  MCP Server: $MYMCP_HOME/packages/mcpserver"
    echo "  Slack Integration: $MYMCP_HOME/packages/slack-integration"
    echo
    echo "🔗 Service URLs:"
    echo "  Engine API: http://localhost:${MCP_ENGINE_PORT:-3456}/api"
    echo "  Health Check: http://localhost:${MCP_ENGINE_PORT:-3456}/health"
}

# ========================================
# Help Command
# ========================================

# Show all myMCP commands
mcp-help() {
    echo "🎮 myMCP Command Reference"
    echo "========================="
    echo
    echo "🚀 Service Management:"
    echo "  mcp-engine-start    - Start the game engine"
    echo "  mcp-engine-stop     - Stop the game engine"
    echo "  mcp-engine-restart  - Restart the game engine"
    echo "  mcp-server-start    - Start the MCP server"
    echo "  mcp-slack-start     - Start Slack integration"
    echo
    echo "🔍 Status & Health:"
    echo "  mcp-health          - Check engine health"
    echo "  mcp-status          - Show engine status"
    echo "  mcp-smoke-test      - Run smoke tests"
    echo "  mcp-ps              - Show all myMCP processes"
    echo
    echo "🎯 Game Queries:"
    echo "  mcp-player [id]     - Get player state"
    echo "  mcp-players         - List all players"
    echo "  mcp-quests          - Show quest catalog"
    echo "  mcp-quest-active    - Show active quest"
    echo
    echo "🎮 Game Actions:"
    echo "  mcp-start-quest     - Start a quest"
    echo "  mcp-complete-step   - Complete a quest step"
    echo
    echo "🔧 Development:"
    echo "  mcp-build-all       - Build all packages"
    echo "  mcp-test-all        - Run all tests"
    echo "  mcp-dev             - Start dev mode"
    echo
    echo "ℹ️  Other:"
    echo "  mcp-env             - Show environment info"
    echo "  mcp-help            - Show this help"
}


# Welcome message when sourcing
echo "🎮 myMCP aliases loaded! Type 'mcp-help' for available commands." 
