import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit3, Plus, Users, Trash2, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import apiService from '../services/api';
import toast from 'react-hot-toast';
import CardModal from '../components/CardModal';
import ColumnHeader from '../components/ColumnHeader';
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
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const Board = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { socket, onlineUsers } = useSocket();
  
  const [board, setBoard] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isBoardEditMode, setIsBoardEditMode] = useState(false);
  const [boardEditData, setBoardEditData] = useState({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (boardId) {
      loadBoardData();
    }
  }, [boardId, isAuthenticated, navigate]);

  useEffect(() => {
    if (socket && boardId) {
      // Join board room for real-time updates
      socket.emit('join-board', boardId);
      
      // Listen for real-time events
      socket.on('card-created', handleCardCreated);
      socket.on('card-updated', handleCardUpdated);
      socket.on('card-moved', handleCardMoved);
      socket.on('user-joined', handleUserJoined);
      socket.on('user-left', handleUserLeft);

      return () => {
        socket.emit('leave-board', boardId);
        socket.off('card-created', handleCardCreated);
        socket.off('card-updated', handleCardUpdated);
        socket.off('card-moved', handleCardMoved);
        socket.off('user-joined', handleUserJoined);
        socket.off('user-left', handleUserLeft);
      };
    }
  }, [socket, boardId]);

  const loadBoardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to get the board to check if it exists
      const boardResponse = await apiService.getBoard(boardId);
      if (!boardResponse.success) {
        throw new Error('Board not found');
      }
      
      setBoard(boardResponse.data.board);

      // Then get columns for this board
      const columnsResponse = await apiService.getBoardWithColumns(boardId);
      if (columnsResponse.success && columnsResponse.data.board.Columns) {
        setColumns(columnsResponse.data.board.Columns);
      } else {
        setColumns([]);
      }
    } catch (error) {
      console.error('Error loading board data:', error);
      if (error.message.includes('404') || error.message.includes('not found')) {
        setError('Board not found');
        toast.error('Board not found. Redirecting to dashboard...');
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setError('Failed to load board data');
        toast.error('Failed to load board');
      }
    } finally {
      setLoading(false);
    }
  };

  // Real-time event handlers
  const handleCardCreated = (data) => {
    setColumns(prev => prev.map(col => 
      col.id === data.card.columnId 
        ? { ...col, Cards: [...(col.Cards || []), data.card] }
        : col
    ));
    toast.success(`${data.user.firstName} added a new card`);
  };

  const handleCardUpdated = (data) => {
    setColumns(prev => prev.map(col => ({
      ...col,
      Cards: (col.Cards || []).map(card => 
        card.id === data.card.id ? data.card : card
      )
    })));
  };

  const handleCardMoved = (data) => {
    setColumns(prev => {
      // Remove card from old column
      const newColumns = prev.map(col => ({
        ...col,
        cards: col.cards.filter(card => card.id !== data.card.id)
      }));
      
      // Add card to new column
      return newColumns.map(col => 
        col.id === data.card.columnId 
          ? { ...col, cards: [...col.cards, data.card] }
          : col
      );
    });
    toast.success(`Card moved by ${data.user.firstName}`);
  };

  const handleUserJoined = (data) => {
    toast.success(`${data.user.firstName} joined the board`);
  };

  const handleUserLeft = (data) => {
    toast(`${data.user.firstName} left the board`);
  };

  const handleAddCard = async (columnId) => {
    const title = prompt('Enter card title:');
    if (!title) return;

    try {
      const cardData = {
        title,
        description: '',
        columnId,
        boardId,
        position: 0
      };

      const response = await apiService.createCard(cardData);
      if (response.success) {
        const newCard = response.data.card;
        
        // Update local state immediately
        setColumns(prev => prev.map(col => 
          col.id === columnId 
            ? { ...col, Cards: [...(col.Cards || []), newCard] }
            : col
        ));
        
        // Emit socket event for other users
        socket?.emit('card-created', {
          boardId,
          card: newCard,
          user: user
        });
        
        toast.success('Card added successfully');
      }
    } catch (error) {
      console.error('Error creating card:', error);
      toast.error('Failed to create card');
    }
  };

  const handleAddColumn = async () => {
    const name = prompt('Enter column name:');
    if (!name) return;

    try {
      const columnData = {
        name,
        color: '#3B82F6',
        position: columns.length
      };

      const response = await apiService.createColumn(boardId, columnData);
      if (response.success) {
        setColumns(prev => [...prev, { ...response.data.column, Cards: [] }]);
        socket?.emit('column-created', {
          boardId,
          column: response.data.column,
          user: user
        });
        toast.success('Column created successfully');
      }
    } catch (error) {
      console.error('Error creating column:', error);
      toast.error('Failed to create column');
    }
  };

  const handleBoardEdit = () => {
    setBoardEditData({
      name: board?.name || '',
      description: board?.description || '',
      deadline: board?.deadline || ''
    });
    setIsBoardEditMode(true);
  };

  const handleBoardSave = async () => {
    try {
      const response = await apiService.updateBoard(boardId, boardEditData);
      if (response.success) {
        setBoard(prev => ({ ...prev, ...boardEditData }));
        setIsBoardEditMode(false);
        setBoardEditData({});
        toast.success('Board updated successfully');
        
        // Emit socket event for real-time updates
        if (socket) {
          socket.emit('board_updated', {
            boardId,
            board: { ...board, ...boardEditData }
          });
        }
      }
    } catch (error) {
      console.error('Error updating board:', error);
      toast.error('Failed to update board');
    }
  };

  const handleBoardCancel = () => {
    setIsBoardEditMode(false);
    setBoardEditData({});
  };

  const handleBoardDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${board?.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await apiService.deleteBoard(boardId);
      if (response.success) {
        toast.success('Board deleted successfully');
        
        // Emit socket event for real-time updates
        socket?.emit('board-deleted', {
          boardId,
          user: user
        });
        
        // Navigate back to dashboard or boards list
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error deleting board:', error);
      toast.error('Failed to delete board');
    }
  };

  const handleColumnEdit = async (columnId, columnData) => {
    try {
      const response = await apiService.updateColumn(columnId, columnData);
      if (response.success) {
        setColumns(prev => prev.map(col => 
          col.id === columnId ? { ...col, ...columnData } : col
        ));
        
        // Emit socket event for real-time updates
        socket?.emit('column-updated', {
          boardId,
          column: { id: columnId, ...columnData },
          user: user
        });
        
        toast.success('Column updated successfully');
      }
    } catch (error) {
      console.error('Error updating column:', error);
      toast.error('Failed to update column');
    }
  };

  const handleColumnDelete = async (columnId) => {
    try {
      const response = await apiService.deleteColumn(columnId);
      if (response.success) {
        setColumns(prev => prev.filter(col => col.id !== columnId));
        toast.success('Column deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting column:', error);
      toast.error('Failed to delete column');
    }
  };

  // Card management handlers
  const handleCardClick = (card) => {
    setSelectedCard(card);
    setIsCardModalOpen(true);
  };

  const handleCardComplete = async (card) => {
    // Prevent unmarking if already completed
    if (card.isCompleted) {
      return;
    }
    
    try {
      const updatedCard = { ...card, isCompleted: true };
      const response = await apiService.updateCard(card.id, updatedCard);
      if (response.success) {
        // Update local state immediately
        setColumns(prev => prev.map(col => ({
          ...col,
          Cards: col.Cards?.map(c => 
            c.id === card.id ? { ...c, isCompleted: true } : c
          )
        })));
        
        // Emit socket event for real-time updates
        socket?.emit('card-updated', {
          boardId,
          card: { ...card, isCompleted: true },
          user: user
        });
        
        toast.success('Card marked as completed');
      }
    } catch (error) {
      console.error('Error updating card:', error);
      toast.error('Failed to complete card');
    }
  };

  const handleCardSave = async (cardData) => {
    try {
      if (cardData.id) {
        // Update existing card
        const response = await apiService.updateCard(cardData.id, cardData);
        if (response.success) {
          socket?.emit('card-updated', {
            boardId,
            card: response.data.card,
            user: user
          });
          toast.success('Card updated successfully');
        }
      } else {
        // Create new card
        const response = await apiService.createCard(cardData);
        if (response.success) {
          socket?.emit('card-created', {
            boardId,
            card: response.data.card,
            user: user
          });
          toast.success('Card created successfully');
        }
      }
    } catch (error) {
      console.error('Error saving card:', error);
      toast.error('Failed to save card');
    }
  };

  const handleCardDelete = async (cardId) => {
    try {
      const response = await apiService.deleteCard(cardId);
      if (response.success) {
        socket?.emit('card-deleted', {
          boardId,
          cardId,
          user: user
        });
        toast.success('Card deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Failed to delete card');
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (event) => {
    const { active } = event;
    const card = findCardById(active.id);
    setActiveCard(card);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeCard = findCardById(active.id);
    const overCard = findCardById(over.id);
    const overColumn = findColumnById(over.id) || findColumnByCardId(over.id);

    if (!activeCard || !overColumn) return;

    // Calculate new priority based on position
    let newPriority = activeCard.priority;
    let newPosition = 0;

    if (overCard && overCard.id !== activeCard.id) {
      // Dropped on another card - determine position and priority
      const columnCards = overColumn.Cards || [];
      const overIndex = columnCards.findIndex(card => card.id === overCard.id);
      
      if (overIndex === 0) {
        // Dropped at top - highest priority
        newPriority = 'urgent';
        newPosition = 0;
      } else if (overIndex === columnCards.length - 1) {
        // Dropped at bottom - lowest priority
        newPriority = 'low';
        newPosition = columnCards.length;
      } else {
        // Dropped in middle - medium priority
        newPriority = 'medium';
        newPosition = overIndex;
      }
    }

    try {
      // Update card with new column, position, and priority
      const updateData = {
        columnId: overColumn.id,
        position: newPosition,
        priority: newPriority
      };

      const response = await apiService.updateCard(activeCard.id, updateData);

      if (response.success) {
        // Update local state immediately
        setColumns(prev => prev.map(col => {
          if (col.id === activeCard.columnId && col.id !== overColumn.id) {
            // Remove from old column
            return {
              ...col,
              Cards: col.Cards?.filter(card => card.id !== activeCard.id) || []
            };
          } else if (col.id === overColumn.id) {
            // Add to new column or update in same column
            const updatedCard = { ...activeCard, ...updateData };
            const otherCards = col.Cards?.filter(card => card.id !== activeCard.id) || [];
            const newCards = [...otherCards, updatedCard].sort((a, b) => {
              const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
            return { ...col, Cards: newCards };
          }
          return col;
        }));

        // Emit real-time update
        socket?.emit('card-moved', {
          boardId,
          card: response.data.card,
          user: user
        });
      }
    } catch (error) {
      console.error('Error moving card:', error);
      toast.error('Failed to move card');
    }
  };

  const findCardById = (id) => {
    for (const column of columns) {
      const card = column.Cards?.find(card => card.id === id);
      if (card) return card;
    }
    return null;
  };

  const findColumnById = (id) => {
    return columns.find(column => column.id === id);
  };

  const findColumnByCardId = (cardId) => {
    for (const column of columns) {
      if (column.Cards?.some(card => card.id === cardId)) {
        return column;
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Board Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {isBoardEditMode ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={boardEditData.name}
                  onChange={(e) => setBoardEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none"
                  placeholder="Board name"
                />
                <textarea
                  value={boardEditData.description}
                  onChange={(e) => setBoardEditData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full text-sm text-gray-600 bg-gray-50 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Board description"
                  rows="2"
                />
                <input
                  type="date"
                  value={boardEditData.deadline}
                  onChange={(e) => setBoardEditData(prev => ({ ...prev, deadline: e.target.value }))}
                  className="text-sm text-gray-600 bg-gray-50 border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={handleBoardSave}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleBoardCancel}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900">{board?.name || 'New Board'}</h1>
                  <button
                    onClick={handleBoardEdit}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleBoardDelete}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Delete Board"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {board?.description && (
                  <p className="text-sm text-gray-600 mt-1">{board.description}</p>
                )}
                {board?.deadline && (
                  <p className="text-xs text-orange-600 mt-1">
                    Due: {new Date(board.deadline).toLocaleDateString()}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">Board ID: {boardId}</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Online Users */}
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">{onlineUsers.length} online</span>
              <div className="flex -space-x-2">
                {onlineUsers.slice(0, 3).map((user, index) => (
                  <div
                    key={user.id || index}
                    className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs border-2 border-white"
                    title={user.firstName}
                  >
                    {user.firstName?.[0] || 'U'}
                  </div>
                ))}
                {onlineUsers.length > 3 && (
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs border-2 border-white">
                    +{onlineUsers.length - 3}
                  </div>
                )}
              </div>
            </div>
            
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Board Content */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading board...</div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-lg text-red-600 mb-4">{error}</div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex space-x-6 overflow-x-auto pb-4">
              {columns.map((column) => (
                <DroppableColumn 
                  key={column.id} 
                  column={column} 
                  onAddCard={handleAddCard} 
                  onCardClick={handleCardClick}
                  onColumnEdit={handleColumnEdit}
                  onColumnDelete={handleColumnDelete}
                  onCardComplete={handleCardComplete}
                />
              ))}
              
              {/* Add Column Button */}
              <button 
                onClick={handleAddColumn}
                className="kanban-column border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center"
              >
                <div className="text-center">
                  <Plus className="h-8 w-8 mx-auto mb-2" />
                  <span>Add a column</span>
                </div>
              </button>
            </div>
            
            <DragOverlay>
              {activeCard ? <DraggableCard card={activeCard} isDragging /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Card Modal */}
      <CardModal
        card={selectedCard}
        isOpen={isCardModalOpen}
        onClose={() => {
          setIsCardModalOpen(false);
          setSelectedCard(null);
        }}
        onSave={handleCardSave}
        onDelete={handleCardDelete}
      />
    </div>
  );
};

// Droppable Column Component
const DroppableColumn = ({ column, onAddCard, onCardClick, onColumnEdit, onColumnDelete, onCardComplete }) => {
  const {
    setNodeRef,
    isOver,
  } = useSortable({
    id: column.id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'bg-blue-50 border-blue-300' : ''}`}
    >
      {/* Column Header */}
      <ColumnHeader 
        column={column}
        onEdit={onColumnEdit}
        onDelete={onColumnDelete}
        onAddCard={onAddCard}
      />

      {/* Cards */}
      <SortableContext items={column.Cards?.map(card => card.id) || []} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {column.Cards?.sort((a, b) => {
            const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
            return priorityOrder[a.priority || 'medium'] - priorityOrder[b.priority || 'medium'];
          }).map((card) => (
            <DraggableCard key={card.id} card={card} onCardClick={onCardClick} onCardComplete={onCardComplete} />
          ))}
          
          {/* Add Card Button */}
          <button
            onClick={() => onAddCard(column.id)}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add a card</span>
          </button>
        </div>
      </SortableContext>
    </div>
  );
};

// Draggable Card Component
const DraggableCard = ({ card, isDragging = false, onCardClick, onCardComplete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };


  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(card.isCompleted ? {} : listeners)}
      className={`kanban-card ${card.isCompleted ? 'opacity-75 bg-gray-50' : 'cursor-grab active:cursor-grabbing'}`}
      onClick={() => onCardClick && onCardClick(card)}
    >
      <div className="flex items-start space-x-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCardComplete && onCardComplete(card);
          }}
          disabled={card.isCompleted}
          className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
            card.isCompleted 
              ? 'bg-green-500 border-green-500 text-white cursor-not-allowed' 
              : 'border-gray-300 hover:border-green-400 hover:bg-green-50 cursor-pointer'
          }`}
          title={card.isCompleted ? 'Task completed' : 'Mark as complete'}
        >
          {card.isCompleted && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className={`font-medium text-gray-900 ${card.isCompleted ? 'line-through' : ''}`}>
              {card.title}
            </h4>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              card.priority === 'urgent' ? 'bg-red-100 text-red-800' :
              card.priority === 'high' ? 'bg-orange-100 text-orange-800' :
              card.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {card.priority || 'medium'}
            </span>
          </div>
          {card.description && (
            <p className={`text-sm text-gray-600 mb-3 ${card.isCompleted ? 'line-through' : ''}`}>
              {card.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-500">
          {card.assignedUser?.firstName || 'Unassigned'}
        </span>
        <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
      </div>
    </div>
  );
};

export default Board;
