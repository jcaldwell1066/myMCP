/**
 * Robust API Client for myMCP Engine Testing
 * Provides reliable HTTP and WebSocket communication with comprehensive error handling
 */

const http = require('http');
const WebSocket = require('ws');

class APIClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3000';
    this.timeout = config.timeout || 10000;
    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.verbose = config.verbose || false;
  }

  /**
   * Make HTTP request with retry logic and comprehensive error handling
   */
  async request(path, options = {}) {
    const requestOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      data: null,
      expectStatus: [200],
      ...options
    };

    let lastError;
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const result = await this._makeRequest(path, requestOptions);
        
        if (this.verbose) {
          console.log(`✅ ${requestOptions.method} ${path} -> ${result.statusCode} (attempt ${attempt})`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (this.verbose) {
          console.log(`❌ ${requestOptions.method} ${path} -> ${error.message} (attempt ${attempt})`);
        }
        
        if (attempt < this.retries) {
          await this._delay(this.retryDelay);
        }
      }
    }
    
    throw new Error(`Request failed after ${this.retries} attempts: ${lastError.message}`);
  }

  /**
   * GET request
   */
  async get(path, options = {}) {
    return this.request(path, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post(path, data, options = {}) {
    return this.request(path, { ...options, method: 'POST', data });
  }

  /**
   * PUT request
   */
  async put(path, data, options = {}) {
    return this.request(path, { ...options, method: 'PUT', data });
  }

  /**
   * DELETE request
   */
  async delete(path, options = {}) {
    return this.request(path, { ...options, method: 'DELETE' });
  }

  /**
   * Test WebSocket connection
   */
  async testWebSocket(path = '', options = {}) {
    const wsUrl = this.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://') + path;
    const timeout = options.timeout || this.timeout;
    
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      const messages = [];
      let resolved = false;
      
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          ws.close();
          reject(new Error(`WebSocket connection timeout after ${timeout}ms`));
        }
      }, timeout);
      
      ws.on('open', () => {
        if (this.verbose) {
          console.log(`🔌 WebSocket connected: ${wsUrl}`);
        }
      });
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          messages.push(message);
          
          if (this.verbose) {
            console.log(`📨 WebSocket message:`, message);
          }
        } catch (e) {
          messages.push({ raw: data.toString() });
        }
      });
      
      ws.on('close', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          resolve({ messages, success: true });
        }
      });
      
      ws.on('error', (error) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          reject(error);
        }
      });
      
      // Send test message and close after delay
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'TEST', message: 'Test from API client' }));
          setTimeout(() => ws.close(), 500);
        }
      }, 100);
    });
  }

  /**
   * Health check - verify engine is running
   */
  async healthCheck() {
    try {
      const response = await this.get('/health', { 
        expectStatus: [200],
        timeout: 5000 
      });
      return {
        healthy: true,
        data: response.data,
        statusCode: response.statusCode
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        statusCode: null
      };
    }
  }

  /**
   * Wait for service to be available
   */
  async waitForService(maxAttempts = 30, delayMs = 1000) {
    for (let i = 0; i < maxAttempts; i++) {
      const health = await this.healthCheck();
      if (health.healthy) {
        return true;
      }
      
      if (this.verbose) {
        console.log(`⏳ Waiting for service... (${i + 1}/${maxAttempts})`);
      }
      
      await this._delay(delayMs);
    }
    
    return false;
  }

  /**
   * Internal request implementation
   */
  _makeRequest(path, options) {
    return new Promise((resolve, reject) => {
      const url = new URL(this.baseUrl);
      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: path,
        method: options.method,
        headers: options.headers,
        timeout: options.timeout || this.timeout
      };

      const req = http.request(requestOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const response = {
              statusCode: res.statusCode,
              headers: res.headers,
              raw: body
            };
            
            // Try to parse JSON
            try {
              response.data = JSON.parse(body);
            } catch (e) {
              response.data = null;
            }
            
            // Check if status code is expected
            if (options.expectStatus && !options.expectStatus.includes(res.statusCode)) {
              return reject(new Error(
                `Unexpected status code: ${res.statusCode}. Expected: ${options.expectStatus.join(',')}`
              ));
            }
            
            resolve(response);
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Request timeout after ${options.timeout || this.timeout}ms`));
      });

      // Send data if provided
      if (options.data) {
        req.write(JSON.stringify(options.data));
      }

      req.end();
    });
  }

  /**
   * Delay utility
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = APIClient;
