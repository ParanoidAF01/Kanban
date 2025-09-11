import React, { useState, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

import Column from '../column/Column';
import { useSocket } from '../../context/SocketContext';
import apiService from '../../services/api';
import { Plus, Users, Settings } from 'lucide-react';

const Board = ({ boardId }) => {
  const { joinBoard, leaveBoard, onlineUsers, connected } = useSocket();
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [cards, setCards] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadBoardData();
  }, [boardId]);

  useEffect(() => {
    if (boardId) {
      joinBoard(boardId);
      return () => leaveBoard(boardId);
    }
  }, [boardId, joinBoard, leaveBoard]);

  const loadBoardData = async () => {
    try {
      setLoading(true);
      const [boardResponse, columnsResponse] = await Promise.all([
        apiService.getBoard(boardId),
        apiService.getColumns(boardId)
      ]);

      if (boardResponse.success) {
        setBoard(boardResponse.data.board);
      }

      if (columnsResponse.success) {
        const columnsData = columnsResponse.data.columns;
        setColumns(columnsData);
        
        // Load cards for each column
        const cardsPromises = columnsData.map(column => 
          apiService.getCards(column.id)
        );
        const cardsResponses = await Promise.all(cardsPromises);
        
        const allCards = cardsResponses
          .filter(response => response.success)
          .flatMap(response => response.data.cards);
        
        setCards(allCards);
      }
    } catch (error) {
      console.error('Error loading board data:', error);
      setError('Failed to load board data');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const card = cards.find(c => c.id === active.id);
    setActiveCard(card);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeCard = cards.find(c => c.id === active.id);
    const overColumn = over.data?.current?.type === 'column' ? over.id : over.data?.current?.columnId;

    if (activeCard && overColumn && activeCard.columnId !== overColumn) {
      // Optimistic UI update
      setCards(prev => prev.map(card => 
        card.id === activeCard.id 
          ? { ...card, columnId: overColumn }
          : card
      ));

      // Emit socket event for real-time sync
      moveCard(activeCard.id, activeCard.columnId, overColumn, 0, boardId);
    }
  };

  const moveCard = (cardId, sourceColumnId, targetColumnId, newIndex, boardId) => {
    // This will be handled by the socket context
    console.log('Moving card:', { cardId, sourceColumnId, targetColumnId, newIndex, boardId });
  };

  const handleAddColumn = async () => {
    try {
      const columnData = {
        name: 'New Column',
        description: '',
        color: '#6B7280',
        position: columns.length
      };

      const response = await apiService.createColumn(boardId, columnData);
      if (response.success) {
        setColumns(prev => [...prev, response.data.column]);
      }
    } catch (error) {
      console.error('Error creating column:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Board</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadBoardData}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Board Not Found</h2>
          <p className="text-gray-600">The board you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Board Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{board.name}</h1>
              <p className="text-gray-600">{board.description}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Online Users */}
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {onlineUsers.length} online
                </span>
                <div className="flex -space-x-2">
                  {onlineUsers.slice(0, 3).map(user => (
                    <div
                      key={user.id}
                      className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                      title={user.firstName}
                    >
                      {user.firstName.charAt(0)}
                    </div>
                  ))}
                  {onlineUsers.length > 3 && (
                    <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white flex items-center justify-center text-white text-xs font-medium">
                      +{onlineUsers.length - 3}
                    </div>
                  )}
                </div>
              </div>

              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Board Content */}
      <div className="p-6">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex space-x-6 overflow-x-auto pb-4">
            <SortableContext items={columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
              {columns.map((column) => (
                <Column
                  key={column.id}
                  column={column}
                  cards={cards.filter(card => card.columnId === column.id)}
                  onCardUpdate={(cardId, updates) => {
                    // Handle card updates
                    console.log('Card update:', { cardId, updates });
                  }}
                />
              ))}
            </SortableContext>
            
            {/* Add Column Button */}
            <button
              onClick={handleAddColumn}
              className="kanban-column border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center min-w-[300px]"
            >
              <div className="text-center">
                <Plus className="h-8 w-8 mx-auto mb-2" />
                <span>Add a column</span>
              </div>
            </button>
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="kanban-card opacity-80 transform rotate-2">
                <h4 className="font-medium text-gray-900 mb-2">{activeCard.title}</h4>
                <p className="text-sm text-gray-600">{activeCard.description}</p>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default Board;
