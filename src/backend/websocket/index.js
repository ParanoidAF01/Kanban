const { Server } = require('socket.io');

// Initialize Socket.IO
const initializeSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : ["http://localhost:3000", "http://localhost:3001"],
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
};

module.exports = {
  initializeSocketIO
};
