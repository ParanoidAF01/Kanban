import React, { useState } from 'react';
import { MoreVertical, Edit3, Trash2, Plus } from 'lucide-react';

const ColumnHeader = ({ column, onEdit, onDelete, onAddCard }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(column.name);

  const handleSave = () => {
    if (editName.trim() && editName !== column.name) {
      onEdit(column.id, { name: editName.trim() });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(column.name);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="flex items-center justify-between mb-4 relative">
      <div className="flex items-center flex-1">
        <div 
          className="w-3 h-3 rounded-full mr-3" 
          style={{ backgroundColor: column.color || '#3B82F6' }}
        ></div>
        
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyPress}
            className="font-semibold text-gray-800 bg-transparent border-b-2 border-blue-500 focus:outline-none flex-1"
            autoFocus
          />
        ) : (
          <h3 
            className="font-semibold text-gray-800 flex-1 cursor-pointer hover:text-blue-600"
            onClick={() => setIsEditing(true)}
          >
            {column.name}
          </h3>
        )}
        
        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
          {column.Cards?.length || 0}
        </span>
      </div>
      
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-gray-400 hover:text-gray-600 p-1 rounded"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        
        {showMenu && (
          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
            <button
              onClick={() => {
                onAddCard(column.id);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </button>
            <button
              onClick={() => {
                setIsEditing(true);
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Column
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this column?')) {
                  onDelete(column.id);
                }
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Column
            </button>
          </div>
        )}
      </div>
      
      {/* Backdrop to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default ColumnHeader;
