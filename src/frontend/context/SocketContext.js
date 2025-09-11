import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socketService';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Map());

  useEffect(() => {
    if (isAuthenticated && token) {
      // Delay socket connection to avoid blocking app initialization
      const timer = setTimeout(() => {
        try {
          const socket = socketService.connect(token);
          
          if (socket) {
            socket.on('connect', () => {
              setConnected(true);
            });

            socket.on('disconnect', () => {
              setConnected(false);
            });

            socket.on('connect_error', (error) => {
              console.warn('Socket connection failed:', error.message || error);
              setConnected(false);
            });

            // Board presence events
            socket.on('user_joined', (data) => {
              setOnlineUsers(prev => {
                const exists = prev.find(user => user.id === data.user.id);
                if (!exists) {
                  return [...prev, data.user];
                }
                return prev;
              });
            });

            socket.on('user_left', (data) => {
              setOnlineUsers(prev => prev.filter(user => user.id !== data.userId));
            });

            socket.on('board_presence', (data) => {
              setOnlineUsers(data.onlineUsers || []);
            });

            // Typing indicators
            socket.on('user_typing', (data) => {
              setTypingUsers(prev => {
                const newMap = new Map(prev);
                if (data.isTyping) {
                  newMap.set(data.user.id, data.user);
                } else {
                  newMap.delete(data.user.id);
                }
                return newMap;
              });
            });
          }
        } catch (error) {
          console.warn('Failed to initialize socket connection:', error);
          setConnected(false);
        }
      }, 1000); // Delay socket connection by 1 second

      return () => {
        clearTimeout(timer);
        socketService.disconnect();
        setConnected(false);
        setOnlineUsers([]);
        setTypingUsers(new Map());
      };
    }
  }, [isAuthenticated, token]);

  const joinBoard = (boardId) => {
    if (connected) {
      socketService.joinBoard(boardId);
    }
  };

  const leaveBoard = (boardId) => {
    if (connected) {
      socketService.leaveBoard(boardId);
    }
  };

  const updateCard = (cardId, updates, boardId, columnId) => {
    if (connected) {
      socketService.updateCard(cardId, updates, boardId, columnId);
    }
  };

  const moveCard = (cardId, sourceColumnId, targetColumnId, newIndex, boardId) => {
    if (connected) {
      socketService.moveCard(cardId, sourceColumnId, targetColumnId, newIndex, boardId);
    }
  };

  const startTyping = (cardId, boardId) => {
    if (connected) {
      socketService.startTyping(cardId, boardId);
    }
  };

  const stopTyping = (cardId, boardId) => {
    if (connected) {
      socketService.stopTyping(cardId, boardId);
    }
  };

  const value = {
    connected,
    onlineUsers,
    typingUsers: Array.from(typingUsers.values()),
    joinBoard,
    leaveBoard,
    updateCard,
    moveCard,
    startTyping,
    stopTyping,
    socket: socketService.socket
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
