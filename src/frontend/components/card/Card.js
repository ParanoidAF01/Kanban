import React, { useState } from 'react';
import {
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

import { Calendar, User, MessageCircle, Paperclip } from 'lucide-react';

const Card = ({ card, onUpdate, isDragging = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDescription, setEditDescription] = useState(card.description || '');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    if (editTitle.trim()) {
      onUpdate({
        title: editTitle.trim(),
        description: editDescription.trim()
      });
      setIsEditing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(card.title);
      setEditDescription(card.description || '');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isSortableDragging || isDragging ? 'opacity-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      {/* Card Cover */}
      {card.coverImage && (
        <div className="h-20 bg-gray-200 rounded-t-lg -m-3 mb-3 bg-cover bg-center" 
             style={{ backgroundImage: `url(${card.coverImage})` }}>
        </div>
      )}
      
      {card.coverColor && !card.coverImage && (
        <div className="h-2 rounded-t-lg -m-3 mb-3" 
             style={{ backgroundColor: card.coverColor }}>
        </div>
      )}

      {/* Priority Indicator */}
      {card.priority && card.priority !== 'medium' && (
        <div className={`w-2 h-2 rounded-full ${getPriorityColor(card.priority)} mb-2`}></div>
      )}

      {/* Card Title */}
      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyPress={handleKeyPress}
          onBlur={handleSave}
          className="w-full border-none outline-none text-sm font-medium text-gray-900 mb-2"
          autoFocus
        />
      ) : (
        <h4 
          className="font-medium text-gray-900 mb-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
          onClick={() => setIsEditing(true)}
        >
          {card.title}
        </h4>
      )}

      {/* Card Description */}
      {isEditing ? (
        <textarea
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          onKeyPress={handleKeyPress}
          onBlur={handleSave}
          placeholder="Add description..."
          className="w-full border-none outline-none text-sm text-gray-600 mb-3 resize-none"
          rows="2"
        />
      ) : (
        card.description && (
          <p 
            className="text-sm text-gray-600 mb-3 cursor-pointer hover:bg-gray-50 p-1 rounded"
            onClick={() => setIsEditing(true)}
          >
            {card.description}
          </p>
        )
      )}

      {/* Card Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {card.labels.map((label, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs rounded-full text-white"
              style={{ backgroundColor: label.color || '#6B7280' }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Card Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          {/* Due Date */}
          {card.dueDate && (
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span className={card.dueDate < new Date() ? 'text-red-500' : ''}>
                {formatDate(card.dueDate)}
              </span>
            </div>
          )}

          {/* Comments Count */}
          {card.comments && card.comments.length > 0 && (
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-3 w-3" />
              <span>{card.comments.length}</span>
            </div>
          )}

          {/* Attachments Count */}
          {card.attachments && card.attachments.length > 0 && (
            <div className="flex items-center space-x-1">
              <Paperclip className="h-3 w-3" />
              <span>{card.attachments.length}</span>
            </div>
          )}
        </div>

        {/* Assignee Avatar */}
        {card.assignee && (
          <div className="flex items-center space-x-1">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
              {card.assignee.firstName ? card.assignee.firstName.charAt(0) : 'U'}
            </div>
          </div>
        )}
      </div>

      {/* Checklist Progress */}
      {card.checklists && card.checklists.length > 0 && (
        <div className="mt-2">
          {card.checklists.map((checklist, index) => {
            const completed = checklist.items.filter(item => item.completed).length;
            const total = checklist.items.length;
            const progress = total > 0 ? (completed / total) * 100 : 0;
            
            return (
              <div key={index} className="mb-1">
                <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                  <span>{checklist.title}</span>
                  <span>{completed}/{total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Card;
