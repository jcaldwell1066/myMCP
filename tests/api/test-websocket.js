const WebSocket = require('ws');

console.log('🔌 myMCP Engine WebSocket Test');
console.log('==============================\n');

function testWebSocket() {
  return new Promise((resolve, reject) => {
    console.log('🔗 Connecting to ws://localhost:3000...');
    
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.on('open', () => {
      console.log('✅ WebSocket connected successfully!');
      
      // Listen for welcome message
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('📨 Received message:', message);
          
          if (message.type === 'WELCOME') {
            console.log('🎉 Welcome message received!');
            
            // Test sending a message
            console.log('📤 Sending test message...');
            ws.send(JSON.stringify({
              type: 'TEST',
              message: 'Hello from test client!',
              timestamp: new Date()
            }));
            
            // Close after a moment
            setTimeout(() => {
              console.log('🔌 Closing connection...');
              ws.close();
              resolve();
            }, 2000);
          }
        } catch (e) {
          console.log('📨 Raw message:', data.toString());
        }
      });
    });
    
    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });
    
    ws.on('error', (error) => {
      console.log('❌ WebSocket error:', error.message);
      reject(error);
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) {
        console.log('⏰ Connection timeout - is the engine running?');
        ws.close();
        reject(new Error('Connection timeout'));
      }
    }, 10000);
  });
}

async function runWebSocketTest() {
  try {
    await testWebSocket();
    console.log('\n✅ WebSocket test completed successfully!');
  } catch (error) {
    console.log('\n❌ WebSocket test failed:', error.message);
    console.log('\n💡 Make sure the engine is running: cd packages/engine && npm start');
  }
}

if (require.main === module) {
  runWebSocketTest();
}

module.exports = { testWebSocket };
