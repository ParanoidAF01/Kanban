const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

// NO dotenv or external dependencies that could cause issues
console.log('🔧 Starting simple backend server...');

const app = express();
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Socket.io configuration
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'Ready',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock API endpoints for testing
app.get('/api/boards', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Sample Board',
      description: 'This is a sample board',
      created_at: new Date().toISOString()
    }
  ]);
});

app.post('/api/boards', (req, res) => {
  const { name, description } = req.body;
  res.status(201).json({
    id: Date.now(),
    name: name || 'New Board',
    description: description || 'New board description',
    created_at: new Date().toISOString()
  });
});

app.get('/api/boards/:boardId/columns', (req, res) => {
  const { boardId } = req.params;
  res.json([
    {
      id: 1,
      board_id: boardId,
      name: 'To Do',
      position: 0,
      cards: []
    },
    {
      id: 2,
      board_id: boardId,
      name: 'In Progress',
      position: 1,
      cards: []
    },
    {
      id: 3,
      board_id: boardId,
      name: 'Done',
      position: 2,
      cards: []
    }
  ]);
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-board', (boardId) => {
    socket.join(`board-${boardId}`);
    console.log(`User ${socket.id} joined board ${boardId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 10000;

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Backend ready for frontend connection`);
});

module.exports = { app, server, io };
