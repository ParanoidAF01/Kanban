const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { supabase, testConnection } = require('./config/database-supabase-only');

require('dotenv').config();

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
    database: 'Supabase'
  });
});

// Basic API routes using Supabase client
app.get('/api/boards', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .eq('archived', false)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching boards:', error);
    res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

app.post('/api/boards', async (req, res) => {
  try {
    const { name, description } = req.body;
    const { data, error } = await supabase
      .from('boards')
      .insert([{ name, description }])
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating board:', error);
    res.status(500).json({ error: 'Failed to create board' });
  }
});

app.get('/api/boards/:boardId/columns', async (req, res) => {
  try {
    const { boardId } = req.params;
    const { data, error } = await supabase
      .from('columns')
      .select(`
        *,
        cards:cards(*)
      `)
      .eq('board_id', boardId)
      .eq('archived', false)
      .order('position');
    
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    console.error('Error fetching columns:', error);
    res.status(500).json({ error: 'Failed to fetch columns' });
  }
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

// Start server with Supabase connection test
const startServer = async () => {
  try {
    // Test Supabase connection
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Failed to connect to Supabase. Exiting...');
      process.exit(1);
    }
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 Database: Supabase (Client-only mode)`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = { app, server, io };
