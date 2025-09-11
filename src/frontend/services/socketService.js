import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

  // Connect to WebSocket server
  connect(token) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    try {
      const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:3000';
      
      this.socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        timeout: 5000,
        forceNew: false
      });

      this.socket.on('connect', () => {
        console.log('Socket connected:', this.socket.id);
        this.isConnected = true;
        this.emit('connection', { connected: true });
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
        this.isConnected = false;
        this.emit('connection', { connected: false });
      });

      this.socket.on('connect_error', (error) => {
        console.warn('Socket connection error:', error.message);
        this.isConnected = false;
        this.emit('connection', { connected: false, error });
      });

      return this.socket;
    } catch (error) {
      console.warn('Failed to initialize socket:', error);
      return null;
    }
  }

  // Disconnect from WebSocket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Emit event to server
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Listen to server events
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Board-related events
  joinBoard(boardId) {
    this.emit('join_board', { boardId });
  }

  leaveBoard(boardId) {
    this.emit('leave_board', { boardId });
  }

  // Card-related events
  updateCard(cardId, updates, boardId, columnId) {
    this.emit('card_update', {
      cardId,
      updates,
      boardId,
      columnId
    });
  }

  moveCard(cardId, sourceColumnId, targetColumnId, newIndex, boardId) {
    this.emit('card_move', {
      cardId,
      sourceColumnId,
      targetColumnId,
      newIndex,
      boardId
    });
  }

  // Typing indicators
  startTyping(cardId, boardId) {
    this.emit('typing_start', { cardId, boardId });
  }

  stopTyping(cardId, boardId) {
    this.emit('typing_stop', { cardId, boardId });
  }

  // Presence events
  updatePresence(boardId, data) {
    this.emit('presence_update', { boardId, ...data });
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id
    };
  }
}

export default new SocketService();
