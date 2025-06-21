# myMCP Shell Tools

This directory contains shell utilities and aliases for managing the myMCP ecosystem.

## Quick Setup

Add this line to your `~/.bashrc` or `~/.bash_profile`:

```bash
source ~/vibe/sub-modules/myMCP/tools/shell/mymcp-aliases.sh
```

Or if your myMCP is in a different location:

```bash
export MYMCP_HOME="/path/to/your/myMCP"
source $MYMCP_HOME/tools/shell/mymcp-aliases.sh
```

Then reload your shell:

```bash
source ~/.bashrc
```

## Available Commands

### 🚀 Service Management

- `mcp-engine-start` - Start the game engine in background
- `mcp-engine-stop` - Stop the game engine
- `mcp-engine-restart` - Restart the game engine
- `mcp-engine-debug` - Start engine in foreground (for debugging)
- `mcp-server-start` - Start the MCP server
- `mcp-slack-start` - Start Slack integration

### 🔍 Health & Status

- `mcp-health` - Full health check with all details
- `mcp-status` - Quick status summary
- `mcp-smoke-test` - Run comprehensive smoke tests
- `mcp-ps` - Show all myMCP processes

### 🎯 Game Queries

- `mcp-player [playerId]` - Get full player state
- `mcp-player-summary [playerId]` - Get player summary
- `mcp-players` - List all players
- `mcp-quests` - Show quest catalog
- `mcp-quest-active [playerId]` - Show active quest details
- `mcp-quests-available [playerId]` - Show available quests

### 🎮 Game Actions

- `mcp-start-quest <questId> [playerId]` - Start a quest
- `mcp-complete-step <stepId> [playerId]` - Complete a quest step

### 🔧 Development

- `mcp-build-all` - Build all packages
- `mcp-test-all` - Run all tests
- `mcp-clean-build` - Clean and rebuild everything
- `mcp-dev` - Start development mode with watch

### 🛠️ Utilities

- `mcp-env` - Show environment configuration
- `mcp-help` - Show command reference
- `mcp-kill-all` - Kill all myMCP processes

## Environment Variables

You can customize behavior with these environment variables:

- `MYMCP_HOME` - Base directory for myMCP (default: `~/vibe/sub-modules/myMCP`)
- `MCP_ENGINE_PORT` - Engine port (default: 3456)
- `NODE_ENV` - Node environment (default: development)

## Examples

### Quick Health Check
```bash
$ mcp-health
{
  "status": "ok",
  "message": "myMCP Engine is running strong!",
  "timestamp": "2025-06-21T13:24:24.504Z",
  "version": "1.0.0",
  "activeStates": 14,
  "wsConnections": 0,
  "llm": {
    "enabled": true,
    "providers": {
      "anthropic": true
    }
  }
}
```

### Run Smoke Tests
```bash
$ mcp-smoke-test
🔍 Running myMCP Smoke Tests...

1️⃣ Engine Health Check:
   ✅ Engine is healthy

2️⃣ API Endpoints:
   ✅ /api/players
   ✅ /api/quest-catalog
   ✅ /api/state/jcadwell-mcp

3️⃣ Running Processes:
   📦 jcaldwell 4092 node dist/index.js
```

### Start a Quest
```bash
$ mcp-start-quest global-meeting
{
  "success": true,
  "data": {
    "quest": "Council of Three Realms",
    "status": "started"
  }
}
```

### Complete a Quest Step
```bash
$ mcp-complete-step find-allies
{
  "success": true,
  "data": {
    "step": "Locate suitable allies in different time zones",
    "completed": true
  }
}
```

## Tips

1. Most commands default to player ID `jcadwell-mcp` but accept an optional player ID
2. Use `mcp-env` to verify your configuration
3. Use `mcp-smoke-test` after starting services to ensure everything is running
4. The aliases support tab completion for better usability

## Troubleshooting

If commands aren't working:

1. Check that the engine is running: `mcp-ps`
2. Verify the port: `echo $MCP_ENGINE_PORT`
3. Check health: `mcp-health`
4. Look at processes: `ps aux | grep node`

## Future Additions

As new services are added (Discord integration, etc.), new aliases will be added to manage them. 