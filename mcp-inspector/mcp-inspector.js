#!/usr/bin/env node

// Simple MCP Inspector - checks what capabilities your servers expose
// Usage: node mcp-inspector.js

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Known MCP server commands (adjust these to match your setup)
const SERVER_CONFIGS = [
  { name: "myMCP",
    command: "node",
    args: [
      path.join(__dirname, "..", "packages", "mcpserver", "dist", "index.js")
    ],
    env: {
      "ENGINE_BASE_URL": "http://localhost:3000",
      "DEFAULT_PLAYER_ID": "claude-player"
    }
  }

];

class SimpleMCPInspector {
  async testServerConnection(config) {
    console.log(`🔍 Testing ${config.name}...`);
    
    return new Promise((resolve) => {
      const child = spawn(config.command, config.args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let responded = false;

      // Send MCP initialization
      const initMessage = {
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
            name: "mcp-inspector",
            version: "1.0.0"
          }
        }
      };

      child.stdout.on('data', (data) => {
        stdout += data.toString();
        if (!responded && stdout.includes('"result"')) {
          responded = true;
          this.parseServerResponse(config.name, stdout);
          resolve({ success: true, name: config.name });
        }
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (!responded) {
          console.log(`❌ ${config.name}: Connection failed (code: ${code})`);
          if (stderr) console.log(`   Error: ${stderr.trim()}`);
          resolve({ success: false, name: config.name, error: stderr || `Exit code ${code}` });
        }
      });

      child.on('error', (err) => {
        if (!responded) {
          console.log(`❌ ${config.name}: ${err.message}`);
          resolve({ success: false, name: config.name, error: err.message });
        }
      });

      // Send initialization message
      try {
        child.stdin.write(JSON.stringify(initMessage) + '\n');
        
        // After init, try to list capabilities
        setTimeout(() => {
          if (responded) {
            // Test resources
            const resourcesMessage = {
              jsonrpc: "2.0", 
              id: 2,
              method: "resources/list",
              params: {}
            };
            child.stdin.write(JSON.stringify(resourcesMessage) + '\n');

            // Test prompts
            const promptsMessage = {
              jsonrpc: "2.0",
              id: 3, 
              method: "prompts/list",
              params: {}
            };
            child.stdin.write(JSON.stringify(promptsMessage) + '\n');

            // Test tools
            const toolsMessage = {
              jsonrpc: "2.0",
              id: 4,
              method: "tools/list", 
              params: {}
            };
            child.stdin.write(JSON.stringify(toolsMessage) + '\n');
          }
        }, 100);

        // Cleanup after timeout
        setTimeout(() => {
          if (!responded) {
            child.kill();
            console.log(`⏰ ${config.name}: Connection timeout`);
            resolve({ success: false, name: config.name, error: "Connection timeout" });
          } else {
            child.kill();
          }
        }, 3000);

      } catch (err) {
        console.log(`❌ ${config.name}: Failed to send message - ${err.message}`);
        resolve({ success: false, name: config.name, error: err.message });
      }
    });
  }

  parseServerResponse(serverName, stdout) {
    console.log(`✅ ${serverName}: Connected successfully`);
    
    // Look for different types of responses
    const lines = stdout.split('\n');
    let tools = [];
    let resources = [];
    let prompts = [];
    
    lines.forEach(line => {
      try {
        if (line.trim()) {
          const response = JSON.parse(line.trim());
          
          if (response.result) {
            // Check what type of response this is
            if (response.result.tools) {
              tools = response.result.tools;
              console.log(`  📧 Tools: ${tools.length} found`);
              tools.slice(0, 3).forEach(tool => {
                console.log(`    • ${tool.name} - ${tool.description || 'No description'}`);
              });
              if (tools.length > 3) {
                console.log(`    ... and ${tools.length - 3} more`);
              }
            }
            
            if (response.result.resources) {
              resources = response.result.resources;
              console.log(`  📄 Resources: ${resources.length} found`);
              resources.slice(0, 3).forEach(resource => {
                console.log(`    • ${resource.uri} - ${resource.name || resource.description || 'Unnamed'}`);
              });
              if (resources.length > 3) {
                console.log(`    ... and ${resources.length - 3} more`);
              }
            }
            
            if (response.result.prompts) {
              prompts = response.result.prompts;
              console.log(`  💬 Prompts: ${prompts.length} found`);
              prompts.slice(0, 3).forEach(prompt => {
                console.log(`    • ${prompt.name} - ${prompt.description || 'No description'}`);
              });
              if (prompts.length > 3) {
                console.log(`    ... and ${prompts.length - 3} more`);
              }
            }

            // Server capabilities from initialize response
            if (response.result.capabilities) {
              console.log(`  ⚙️  Server Capabilities:`);
              const caps = response.result.capabilities;
              if (caps.tools) console.log(`    • Tools: Supported`);
              if (caps.resources) console.log(`    • Resources: Supported`);
              if (caps.prompts) console.log(`    • Prompts: Supported`);
              if (caps.sampling) console.log(`    • Sampling: Supported`);
            }
          }
          
          if (response.error) {
            console.log(`  ❌ Error: ${response.error.message}`);
          }
        }
      } catch (e) {
        // Ignore JSON parse errors for partial responses
      }
    });
  }

  async inspectAll() {
    console.log("🚀 Simple MCP Server Inspector");
    console.log("=" .repeat(50));
    console.log();

    const results = [];
    
    for (const config of SERVER_CONFIGS) {
      console.log(`Testing: ${config.description}`);
      console.log(`Command: ${config.command} ${config.args.join(' ')}`);
      console.log("-".repeat(40));
      
      const result = await this.testServerConnection(config);
      results.push(result);
      
      console.log();
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause
    }

    // Summary
    console.log("=" .repeat(50));
    console.log("📊 SUMMARY");
    console.log("=" .repeat(50));
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`Connected: ${successful.length}/${results.length} servers`);
    if (successful.length > 0) {
      console.log(`✅ Working: ${successful.map(r => r.name).join(', ')}`);
    }
    if (failed.length > 0) {
      console.log(`❌ Failed: ${failed.map(r => r.name).join(', ')}`);
    }
    
    console.log('\n💡 Next Steps:');
    console.log('1. For servers with resources, you can access content via URIs');
    console.log('2. For servers with prompts, you can use template-based workflows');
    console.log('3. Update SERVER_CONFIGS array to match your actual server commands');
    console.log('\n🎯 For myMCP quest system: Look for servers exposing task/quest resources!');
  }
}

// Usage
const inspector = new SimpleMCPInspector();
inspector.inspectAll().catch(console.error);
