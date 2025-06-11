# MCP Server Inspector 🔍

A tool to inspect Model Context Protocol (MCP) servers and discover their capabilities beyond just tools.

## What This Inspects

### **Tools** 📧 (Functions you can call)
```typescript
await client.request({ method: "tools/call", params: { name: "read_file" } });
```

### **Resources** 📄 (Content accessible via URIs)  
```typescript
await client.request({ method: "resources/read", params: { uri: "file:///path" } });
```

### **Prompts** 💬 (Template workflows)
```typescript  
await client.request({ method: "prompts/get", params: { name: "code-review" } });
```

### **Sampling** 🎯 (LLM inference requests)
```typescript
// Server can request completions from your LLM
```

## Quick Setup

### 1. Directory Already Created ✅
You're in: `/mcp-inspector/`

### 2. Configure Your Servers

Edit the `SERVER_CONFIGS` array in `mcp-inspector.js` to match your actual MCP servers:

```javascript
const SERVER_CONFIGS = [
  {
    name: "task-master",
    command: "task-master",           // Your actual command
    args: ["--mcp"],                  // Your actual args
    description: "Task Master MCP Server"
  },
  {
    name: "filesystem",
    command: "npx", 
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/your/allowed/path"],
    description: "File System MCP Server"
  },
  // Add your other servers here
];
```

### 3. Run the Inspector
```bash
node mcp-inspector.js
```

## Finding Your Server Commands

### For Task Master
```bash
# Check if task-master has MCP mode
task-master --help | grep -i mcp
# or
which task-master-mcp
```

### For Common MCP Servers
```bash
# File system server
npx @modelcontextprotocol/server-filesystem --help

# SQLite server  
npx @modelcontextprotocol/server-sqlite --help

# GitHub server
npx @modelcontextprotocol/server-github --help
```

### For Custom Servers
Check your MCP client configuration (Claude Desktop, etc.):
```bash
# MacOS Claude Desktop config
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windows Claude Desktop config  
cat %APPDATA%/Claude/claude_desktop_config.json

# Linux
cat ~/.config/claude/claude_desktop_config.json
```

## Expected Output

```
🚀 Simple MCP Server Inspector
==================================================

Testing: Task Master MCP Server
Command: task-master --mcp
----------------------------------------
🔍 Testing task-master...
✅ task-master: Connected successfully
  📧 Tools: 15 found
    • get-tasks - Retrieve all tasks
    • add-task - Add a new task  
    • complexity-report - Show complexity analysis
    ... and 12 more
  📄 Resources: 3 found
    • task://project/17 - Task 17 definition
    • guide://dm/proj_management_main - Quest guide
    • report://complexity/latest - Complexity report
  💬 Prompts: 2 found
    • project-planning - Project planning template
    • retrospective - Retrospective analysis
  ⚙️  Server Capabilities:
    • Tools: Supported
    • Resources: Supported  
    • Prompts: Supported

==================================================
📊 SUMMARY
==================================================
Connected: 1/3 servers
✅ Working: task-master
❌ Failed: filesystem, knowledge-graph

💡 Next Steps:
1. For servers with resources, you can access content via URIs
2. For servers with prompts, you can use template-based workflows  
3. Update SERVER_CONFIGS array to match your actual server commands

🎯 For myMCP quest system: Look for servers exposing task/quest resources!
```

## What to Look For

### **🎯 High Value for myMCP Quest System:**

1. **Task Master with Resources**:
   ```
   • task://project/{taskId} - Individual task data
   • guide://dm/proj_management_main - Quest guides  
   • artifact://myMCP/forged - Completed artifacts
   • quest://chapter/2/crossroads - Current quest state
   ```

2. **File System with Resources**:
   ```
   • file:///path/to/.taskmaster/dm_guides/ - Quest definitions
   • file:///path/to/.taskmaster/reports/ - Analysis reports
   • file:///path/to/cli/ - Implementation artifacts
   ```

3. **Knowledge Graph with Resources**:
   ```
   • graph://entity/project-management - Project entities
   • graph://relationship/dependency - Task dependencies
   ```

### **💬 Prompts for Quest System:**
- Project planning templates
- Retrospective analysis prompts  
- Risk assessment workflows
- Demo preparation checklists

## Troubleshooting

### "Connection timeout" or "Command not found"
- Check if the server command exists: `which task-master`
- Verify the server supports MCP mode: `task-master --help`
- Update the command path in SERVER_CONFIGS

### "No resources found" but you expected some
- Server may only expose tools, not resources
- Try the detailed TypeScript inspector for more thorough testing
- Check server documentation for resource support

### Permission errors
- Ensure the inspector script is executable: `chmod +x mcp-inspector.js`
- Check file system server has proper directory permissions

## Advanced Usage

### Custom Server Testing
```javascript
// Add your custom server to SERVER_CONFIGS
{
  name: "my-custom-server",
  command: "/path/to/my-server",
  args: ["--config", "/path/to/config.json"],
  description: "My Custom MCP Server"
}
```

### Resource URI Patterns to Look For
```
file:///          - File system resources
task://           - Task management resources  
guide://          - Documentation/guide resources
quest://          - Quest state resources
graph://          - Knowledge graph resources
calendar://       - Calendar/scheduling resources
http://           - Web-based resources
custom://         - Domain-specific resources
```

## Integration with myMCP

Once you identify servers with resources, you can integrate them into your quest system:

```typescript
// Read current quest state
const questState = await client.request({
  method: "resources/read",
  params: { uri: "quest://myMCP/current-chapter" }
});

// Access quest guides
const dmGuide = await client.request({
  method: "resources/read", 
  params: { uri: "guide://dm/proj_management_main" }
});

// Get task artifacts
const taskData = await client.request({
  method: "resources/read",
  params: { uri: "task://myMCP/17" }
});
```

This opens up powerful possibilities for your gamified project management system! 🎮