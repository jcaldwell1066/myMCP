#!/usr/bin/env node

/**
 * Complete MCP Setup Script
 * Builds and configures everything needed for MCP integration
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function runCommand(command, args, cwd, description) {
  return new Promise((resolve, reject) => {
    console.log(`🔧 ${description}`);
    console.log(`   Running: ${command} ${args.join(' ')}`);
    console.log(`   In: ${cwd}`);
    
    const process = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${description} - SUCCESS\n`);
        resolve();
      } else {
        console.log(`❌ ${description} - FAILED (code ${code})\n`);
        reject(new Error(`${description} failed with exit code ${code}`));
      }
    });
  });
}

async function setupMCP() {
  // Use the directory where this script is located as the base
  const baseDir = path.resolve(__dirname);
  const mcpServerDir = path.join(baseDir, 'packages', 'mcpserver');
  
  try {
    console.log('🚀 Setting up MCP Integration\n');
    
    // Step 1: Install MCP server dependencies
    await runCommand('npm', ['install'], mcpServerDir, 'Installing MCP server dependencies');
    
    // Step 2: Build MCP server
    await runCommand('npm', ['run', 'build'], mcpServerDir, 'Building MCP server');
    
    // Step 3: Create startup scripts
    console.log('📝 Creating startup scripts...');
    
    // Engine startup script
    const engineStartScript = `#!/usr/bin/env node
/**
 * Start myMCP Engine
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting myMCP Engine...');

const engineProcess = spawn('node', ['dist/index.js'], {
  cwd: path.join(__dirname, 'packages', 'engine'),
  stdio: 'inherit'
});

engineProcess.on('close', (code) => {
  console.log(\`Engine exited with code \${code}\`);
});

engineProcess.on('error', (error) => {
  console.error('Failed to start engine:', error);
});
`;

    // MCP server startup script
    const mcpStartScript = `#!/usr/bin/env node
/**
 * Start myMCP MCP Server
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('📡 Starting myMCP MCP Server...');

const mcpProcess = spawn('node', ['dist/index.js'], {
  cwd: path.join(__dirname, 'packages', 'mcpserver'),
  stdio: 'inherit',
  env: {
    ...process.env,
    ENGINE_BASE_URL: 'http://localhost:3000',
    DEFAULT_PLAYER_ID: 'claude-player'
  }
});

mcpProcess.on('close', (code) => {
  console.log(\`MCP Server exited with code \${code}\`);
});

mcpProcess.on('error', (error) => {
  console.error('Failed to start MCP server:', error);
});
`;

    // Combined startup script
    const startAllScript = `#!/usr/bin/env node
/**
 * Start both Engine and MCP Server
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🎮 Starting myMCP Complete System...');

// Start Engine
console.log('🚀 Starting Engine...');
const engineProcess = spawn('node', ['dist/index.js'], {
  cwd: path.join(__dirname, 'packages', 'engine'),
  stdio: ['inherit', 'inherit', 'inherit']
});

// Wait a bit for engine to start, then start MCP server
setTimeout(() => {
  console.log('📡 Starting MCP Server...');
  const mcpProcess = spawn('node', ['dist/index.js'], {
    cwd: path.join(__dirname, 'packages', 'mcpserver'),
    stdio: ['inherit', 'inherit', 'inherit'],
    env: {
      ...process.env,
      ENGINE_BASE_URL: 'http://localhost:3000',
      DEFAULT_PLAYER_ID: 'claude-player'
    }
  });
  
  mcpProcess.on('error', (error) => {
    console.error('❌ MCP Server failed:', error);
  });
}, 3000);

engineProcess.on('error', (error) => {
  console.error('❌ Engine failed:', error);
});

console.log('✅ Both services starting...');
console.log('📋 Services:');
console.log('   🚀 Engine: http://localhost:3000');
console.log('   📡 MCP Server: stdio communication');
console.log('');
console.log('🔧 To stop: Ctrl+C');
`;

    // Write startup scripts
    fs.writeFileSync(path.join(baseDir, 'start-engine.js'), engineStartScript);
    fs.writeFileSync(path.join(baseDir, 'start-mcp.js'), mcpStartScript);
    fs.writeFileSync(path.join(baseDir, 'start-all.js'), startAllScript);
    
    console.log('✅ Startup scripts created');
    
    // Step 4: Create Claude Desktop config
    const claudeConfig = {
      "mcpServers": {
        "myMCP": {
          "command": "node",
          "args": [path.join(mcpServerDir, "dist", "index.js")],
          "env": {
            "ENGINE_BASE_URL": "http://localhost:3000",
            "DEFAULT_PLAYER_ID": "claude-player"
          }
        }
      }
    };
    
    const configPath = path.join(baseDir, 'claude_desktop_config.json');
    fs.writeFileSync(configPath, JSON.stringify(claudeConfig, null, 2));
    
    console.log(`📋 Claude Desktop config created: ${configPath}`);
    
    // Step 5: Create README
    const readmeContent = `# myMCP MCP Integration - Ready to Use! 🎮

## Quick Start

### Option 1: Start Everything Together
\`\`\`bash
node start-all.js
\`\`\`

### Option 2: Start Services Separately

**Terminal 1 - Engine:**
\`\`\`bash
node start-engine.js
\`\`\`

**Terminal 2 - MCP Server:**
\`\`\`bash
node start-mcp.js
\`\`\`

## Claude Desktop Integration

1. **Copy the config**: Use the generated \`claude_desktop_config.json\`
2. **Add to Claude Desktop**: Merge with your existing Claude Desktop config
3. **Restart Claude Desktop**: To load the new MCP server

### Config Location
- **Windows**: \`%APPDATA%\\Claude\\claude_desktop_config.json\`
- **macOS**: \`~/Library/Application Support/Claude/claude_desktop_config.json\`
- **Linux**: \`~/.config/Claude/claude_desktop_config.json\`

## Testing the Integration

1. **Start services**: Use \`node start-all.js\`
2. **Check engine**: Visit http://localhost:3000/health
3. **Test in Claude**: Should see "myMCP" as available MCP server

## Available Resources & Tools

### Resources (Read-only data)
- \`mcp://game/player/claude-player\` - Player profile
- \`mcp://game/quests/claude-player\` - Quest data  
- \`mcp://game/state/claude-player\` - Complete game state
- \`mcp://game/inventory/claude-player\` - Player inventory
- \`mcp://system/health\` - System status

### Tools (Actions Claude can take)
- \`start_quest(questId)\` - Begin a quest
- \`complete_quest_step(stepId)\` - Mark step complete
- \`send_chat_message(message)\` - Chat with game
- \`update_player(updates)\` - Modify player
- And more...

## Troubleshooting

- **Engine not starting**: Check port 3000 is free
- **MCP server issues**: Ensure engine is running first
- **Claude integration**: Verify config file location and restart Claude Desktop

🎉 Your fantasy-themed game engine is now MCP-ready!
`;

    fs.writeFileSync(path.join(baseDir, 'MCP_READY.md'), readmeContent);
    
    console.log('📚 Documentation created: MCP_READY.md');
    
    console.log('\n🎉 MCP Integration Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start services: node start-all.js');
    console.log('2. Add claude_desktop_config.json to Claude Desktop');
    console.log('3. Restart Claude Desktop');
    console.log('4. Test the integration!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setupMCP();
