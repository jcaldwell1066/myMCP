#!/usr/bin/env node

// Enhanced MCP Inspector - shows detailed capabilities
// Usage: node detailed-inspector.js

import { spawn } from 'child_process';

const WORKING_SERVERS = [
  {
    name: "memory",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-memory"],
    description: "The hierarchical db of observations"
  },
  {
    name: "filesystem", 
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-filesystem", "./"],
    description: "File System MCP Server"
  },
	{

    name: "task-master", 
    command: "npx",
    args: ["-y", "--package=task-master-ai", "task-master-ai"],
    description: "File System MCP Server",
	env:{"ANTHROPIC_API_KEY": "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"}
	}

];

class DetailedMCPInspector {
  async inspectServerDetailed(config) {
    console.log(`\n🔍 DETAILED INSPECTION: ${config.name}`);
    console.log("=".repeat(60));
    
    return new Promise((resolve) => {
      const child = spawn(config.command, config.args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let allOutput = '';
      let responded = false;
      const responses = [];

      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        allOutput += chunk;
        
        // Parse each line as potential JSON
        chunk.split('\n').forEach(line => {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line.trim());
              responses.push(parsed);
            } catch (e) {
              // Not JSON, ignore
            }
          }
        });
      });

      child.stderr.on('data', (data) => {
        console.log(`  ⚠️  Stderr: ${data.toString().trim()}`);
      });

      child.on('close', (code) => {
        console.log(`  📋 Analysis Results:`);
        this.analyzeResponses(config.name, responses);
        resolve({ success: true, name: config.name, responses });
      });

      child.on('error', (err) => {
        console.log(`❌ ${config.name}: ${err.message}`);
        resolve({ success: false, name: config.name, error: err.message });
      });

      // Send comprehensive test sequence
      setTimeout(() => {
        const messages = [
          // 1. Initialize
          {
            jsonrpc: "2.0",
            id: 1,
            method: "initialize",
            params: {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: {},
                resources: {},
                prompts: {},
                sampling: {}
              },
              clientInfo: {
                name: "detailed-inspector",
                version: "1.0.0"
              }
            }
          },
          // 2. Get tools
          {
            jsonrpc: "2.0",
            id: 2,
            method: "tools/list",
            params: {}
          },
          // 3. Get resources
          {
            jsonrpc: "2.0",
            id: 3,
            method: "resources/list",
            params: {}
          },
          // 4. Get prompts
          {
            jsonrpc: "2.0",
            id: 4,
            method: "prompts/list",
            params: {}
          }
        ];

        messages.forEach((msg, index) => {
          setTimeout(() => {
            try {
              child.stdin.write(JSON.stringify(msg) + '\n');
              console.log(`  📤 Sent: ${msg.method}`);
            } catch (e) {
              console.log(`  ❌ Failed to send ${msg.method}: ${e.message}`);
            }
          }, index * 200);
        });

        // Cleanup after 5 seconds
        setTimeout(() => {
          child.kill();
        }, 5000);
      }, 100);
    });
  }

  analyzeResponses(serverName, responses) {
    let initResult = null;
    let toolsResult = null;
    let resourcesResult = null;
    let promptsResult = null;

    responses.forEach(response => {
      if (response.id === 1) initResult = response.result;
      if (response.id === 2) toolsResult = response.result;
      if (response.id === 3) resourcesResult = response.result;
      if (response.id === 4) promptsResult = response.result;
    });

    // Server capabilities
    if (initResult?.capabilities) {
      console.log(`  🔧 Server Capabilities:`);
      Object.entries(initResult.capabilities).forEach(([cap, details]) => {
        console.log(`    • ${cap}: ${details ? 'Supported' : 'Not supported'}`);
      });
    }

    // Tools analysis
    if (toolsResult?.tools) {
      console.log(`\n  📧 Tools (${toolsResult.tools.length} found):`);
      toolsResult.tools.forEach(tool => {
        console.log(`    • ${tool.name}`);
        console.log(`      Description: ${tool.description || 'No description'}`);
        if (tool.inputSchema?.properties) {
          const params = Object.keys(tool.inputSchema.properties);
          console.log(`      Parameters: ${params.join(', ')}`);
        }
      });
    } else {
      console.log(`\n  📧 Tools: None or failed to retrieve`);
    }

    // Resources analysis  
    if (resourcesResult?.resources) {
      console.log(`\n  📄 Resources (${resourcesResult.resources.length} found):`);
      resourcesResult.resources.forEach(resource => {
        console.log(`    • URI: ${resource.uri}`);
        console.log(`      Name: ${resource.name || 'Unnamed'}`);
        console.log(`      Description: ${resource.description || 'No description'}`);
        console.log(`      MIME Type: ${resource.mimeType || 'Not specified'}`);
      });
    } else {
      console.log(`\n  📄 Resources: None found`);
    }

    // Prompts analysis
    if (promptsResult?.prompts) {
      console.log(`\n  💬 Prompts (${promptsResult.prompts.length} found):`);
      promptsResult.prompts.forEach(prompt => {
        console.log(`    • Name: ${prompt.name}`);
        console.log(`      Description: ${prompt.description || 'No description'}`);
        if (prompt.arguments) {
          console.log(`      Arguments: ${prompt.arguments.map(arg => arg.name).join(', ')}`);
        }
      });
    } else {
      console.log(`\n  💬 Prompts: None found`);
    }

    // Error analysis
    const errors = responses.filter(r => r.error);
    if (errors.length > 0) {
      console.log(`\n  ❌ Errors encountered:`);
      errors.forEach(error => {
        console.log(`    • ${error.error.message} (${error.error.code})`);
      });
    }
  }

  async inspectAllDetailed() {
    console.log("🚀 DETAILED MCP SERVER ANALYSIS");
    console.log("=".repeat(80));
    console.log("Investigating working servers for resources and prompts...\n");

    const results = [];
    
    for (const config of WORKING_SERVERS) {
      const result = await this.inspectServerDetailed(config);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Final summary
    console.log("\n" + "=".repeat(80));
    console.log("🎯 RESOURCE & PROMPT SUMMARY FOR myMCP QUEST SYSTEM");
    console.log("=".repeat(80));

    const hasResources = results.some(r => 
      r.responses?.some(resp => resp.result?.resources?.length > 0)
    );
    
    const hasPrompts = results.some(r => 
      r.responses?.some(resp => resp.result?.prompts?.length > 0)
    );

    if (hasResources) {
      console.log("✅ Resource-enabled servers found!");
      console.log("   → You can access content directly via URIs");
      console.log("   → Perfect for quest state management");
    }

    if (hasPrompts) {
      console.log("✅ Prompt-enabled servers found!");
      console.log("   → You can use template-based workflows");
      console.log("   → Great for standardized quest interactions");
    }

    if (!hasResources && !hasPrompts) {
      console.log("📋 Working servers only expose tools (no resources/prompts)");
      console.log("   → Focus on tool-based quest system integration");
      console.log("   → Consider upgrading to resource-aware MCP servers");
    }

    console.log("\n💡 Next steps for myMCP quest integration:");
    console.log("   1. File system server can expose quest guides as file:// resources");
    console.log("   2. Memory server can store quest state and progress");
    console.log("   3. Create custom URI schemes: quest://, task://, artifact://");
  }
}

const inspector = new DetailedMCPInspector();
inspector.inspectAllDetailed().catch(console.error);
