import React, { useState } from 'react';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

import Card from '../card/Card';
import { Plus, MoreVertical } from 'lucide-react';

const Column = ({ column, cards, onCardUpdate }) => {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return;

    try {
      // This would call the API to create a card
      console.log('Creating card:', { title: newCardTitle, columnId: column.id });
      // await apiService.createCard(column.id, { title: newCardTitle });
      
      setNewCardTitle('');
      setIsAddingCard(false);
    } catch (error) {
      console.error('Error creating card:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddCard();
    } else if (e.key === 'Escape') {
      setIsAddingCard(false);
      setNewCardTitle('');
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-column ${isDragging ? 'opacity-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: column.color }}
          />
          <h3 className="font-semibold text-gray-900">{column.name}</h3>
          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
            {cards.length}
          </span>
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {cards.map((card) => (
          <Card
            key={card.id}
            card={card}
            onUpdate={(updates) => onCardUpdate(card.id, updates)}
          />
        ))}
        
        {/* Add Card Button */}
        {isAddingCard ? (
          <div className="kanban-card">
            <input
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              onKeyPress={handleKeyPress}
              onBlur={handleAddCard}
              placeholder="Enter card title..."
              className="w-full border-none outline-none text-sm font-medium text-gray-900"
              autoFocus
            />
          </div>
        ) : (
          <button
            onClick={() => setIsAddingCard(true)}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add a card</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Column;
