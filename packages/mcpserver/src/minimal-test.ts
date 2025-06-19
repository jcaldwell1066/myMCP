#!/usr/bin/env node

/**
 * Minimal MCP Server Test - Just the basics
 */

console.error('🚀 Starting minimal MCP server test...');

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

console.error('✅ Imports successful');

// Create server
const server = new Server(
  {
    name: 'test-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

console.error('✅ Server created');

async function main() {
  try {
    console.error('🔌 Creating transport...');
    const transport = new StdioServerTransport();
    
    console.error('🔗 Connecting to transport...');
    await server.connect(transport);
    
    console.error('🎉 Connected successfully! Server is running...');
    
    // Keep alive
    process.stdin.resume();
    
    // Add timeout to prevent hanging
    setTimeout(() => {
      console.error('⏰ 10 second test complete, exiting...');
      process.exit(0);
    }, 10000);
    
  } catch (error) {
    console.error('❌ Error in main:', error);
    process.exit(1);
  }
}

console.error('🎯 Calling main function...');
main().catch((error) => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});

console.error('✅ Main function called, waiting for async completion...');
