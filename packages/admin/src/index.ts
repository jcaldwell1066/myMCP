import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { Server } from 'socket.io';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws://localhost:*", "http://localhost:*"]
    }
  }
}));

app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from React build
app.use(express.static(path.join(__dirname, '../build')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'myMCP Admin Dashboard'
  });
});

// Proxy API requests to the main engine
app.use('/api', (req, res, next) => {
  const engineUrl = process.env.ENGINE_URL || 'http://localhost:3001';
  
  // Simple proxy implementation
  const fetch = require('node-fetch');
  const url = `${engineUrl}${req.originalUrl}`;
  
  const options = {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...req.headers
    }
  };
  
  if (req.body && Object.keys(req.body).length > 0) {
    options.body = JSON.stringify(req.body);
  }
  
  fetch(url, options)
    .then(response => response.json())
    .then(data => res.json(data))
    .catch(error => {
      console.error('API proxy error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to proxy request to engine',
        details: error.message
      });
    });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Admin dashboard connected:', socket.id);
  
  // Join admin room for broadcasts
  socket.join('admin');
  
  // Handle quest template updates
  socket.on('template:update', (data) => {
    socket.to('admin').emit('template:updated', data);
  });
  
  // Handle quest template publish/unpublish
  socket.on('template:publish', (data) => {
    socket.to('admin').emit('template:published', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Admin dashboard disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3003;

server.listen(PORT, () => {
  console.log(`🚀 Admin Dashboard server running on port ${PORT}`);
  console.log(`📊 Dashboard available at http://localhost:${PORT}`);
});

export default app;