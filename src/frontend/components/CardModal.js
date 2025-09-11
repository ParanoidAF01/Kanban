import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Tag } from 'lucide-react';

const CardModal = ({ card, isOpen, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState({
    title: card?.title || '',
    description: card?.description || '',
    dueDate: card?.dueDate || '',
    priority: card?.priority || 'medium'
  });

  // Update form data when card prop changes
  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title || '',
        description: card.description || '',
        dueDate: card.dueDate || '',
        priority: card.priority || 'medium'
      });
    }
  }, [card]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...card, ...formData });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      onDelete(card.id);
      onClose();
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {card ? 'Edit Card' : 'New Card'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input w-full"
              placeholder="Enter card title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input w-full resize-none"
              placeholder="Enter card description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Due Date
            </label>
            <input
              type="date"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Tag className="h-4 w-4 inline mr-1" />
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="input w-full"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="btn btn-primary flex-1"
            >
              {card ? 'Update Card' : 'Create Card'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            {card && onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="btn bg-red-600 hover:bg-red-700 text-white px-4"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default CardModal;
