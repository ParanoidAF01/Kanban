const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { setupNotificationScheduler } = require('./middleware/notifications');
require('dotenv').config();

// Import database and models
const { sequelize, testConnection } = require('./config/database');
const { User, Board, Column, Card, Activity } = require('./models');

// Import routes
const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const columnRoutes = require('./routes/columns');
const cardRoutes = require('./routes/cards');
const activityRoutes = require('./routes/activities');

// Import middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import WebSocket
const { initializeSocketIO } = require('./websocket');

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for development
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files (serve React app)
app.use(express.static('dist'));

// Basic routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Collaborative Kanban API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      boards: '/api/boards',
      columns: '/api/columns',
      cards: '/api/cards',
      activities: '/api/activities'
    }
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/columns', columnRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/activities', activityRoutes);

// Initialize WebSocket
const io = initializeSocketIO(server);

// Catch-all handler for React app (SPA routing)
// Important: Do not shadow API routes. Only handle non-/api paths.
app.get(/^\/(?!api).*/, (req, res) => {
  // __dirname is src/backend → go up two levels to project root, then dist/index.html
  res.sendFile(path.join(__dirname, '../../dist/index.html'));
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🔄 Testing database connection...');
    await testConnection();
    
    console.log('🔄 Syncing database models...');
    await sequelize.sync({ force: false });
    
    // Initialize notification scheduler
    setupNotificationScheduler();
    
    console.log('🚀 Server running on port', PORT);
    console.log('📊 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔗 Health check: http://localhost:' + PORT + '/health');
    console.log('📊 Database: Connected and synced');
    console.log('🔌 WebSocket: Initialized');
    console.log('📡 API Endpoints:');
    console.log('   - Auth: /api/auth');
    console.log('   - Boards: /api/boards');
    console.log('   - Columns: /api/columns');
    console.log('   - Cards: /api/cards');
    console.log('   - Activities: /api/activities');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

server.listen(PORT, startServer);

module.exports = { app, server, io };
