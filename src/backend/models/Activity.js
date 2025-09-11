const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM(
      'board_created',
      'board_updated',
      'board_archived',
      'board_restored',
      'board_deleted',
      'column_created',
      'column_updated',
      'column_archived',
      'column_restored',
      'column_deleted',
      'card_created',
      'card_updated',
      'card_moved',
      'card_archived',
      'card_restored',
      'card_deleted',
      'card_assigned',
      'card_unassigned',
      'card_completed',
      'card_reopened',
      'comment_added',
      'comment_updated',
      'comment_deleted',
      'attachment_added',
      'attachment_removed',
      'checklist_added',
      'checklist_updated',
      'checklist_deleted',
      'label_added',
      'label_removed',
      'vote_added',
      'vote_removed',
      'member_added',
      'member_removed',
      'member_role_changed',
      'due_date_set',
      'due_date_updated',
      'due_date_removed'
    ),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  isSystem: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isVisible: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'activities',
  timestamps: true
});

// Instance methods
Activity.prototype.getFormattedDescription = function() {
  const { User } = require('./User');
  const { Board } = require('./Board');
  const { Column } = require('./Column');
  const { Card } = require('./Card');
  
  // This would be implemented with proper data loading
  // For now, return the basic description
  return this.description;
};

Activity.prototype.getIcon = function() {
  const iconMap = {
    'board_created': '📋',
    'board_updated': '✏️',
    'board_archived': '📦',
    'board_restored': '📤',
    'board_deleted': '🗑️',
    'column_created': '📝',
    'column_updated': '✏️',
    'column_archived': '📦',
    'column_restored': '📤',
    'column_deleted': '🗑️',
    'card_created': '➕',
    'card_updated': '✏️',
    'card_moved': '↔️',
    'card_archived': '📦',
    'card_restored': '📤',
    'card_deleted': '🗑️',
    'card_assigned': '👤',
    'card_unassigned': '👤❌',
    'card_completed': '✅',
    'card_reopened': '🔄',
    'comment_added': '💬',
    'comment_updated': '💬✏️',
    'comment_deleted': '💬🗑️',
    'attachment_added': '📎',
    'attachment_removed': '📎❌',
    'checklist_added': '☑️',
    'checklist_updated': '☑️✏️',
    'checklist_deleted': '☑️🗑️',
    'label_added': '🏷️',
    'label_removed': '🏷️❌',
    'vote_added': '👍',
    'vote_removed': '👎',
    'member_added': '👥',
    'member_removed': '👥❌',
    'member_role_changed': '👥🔄',
    'due_date_set': '📅',
    'due_date_updated': '📅✏️',
    'due_date_removed': '📅❌'
  };
  
  return iconMap[this.type] || '📝';
};

Activity.prototype.getColor = function() {
  const colorMap = {
    'board_created': '#10B981',
    'board_updated': '#3B82F6',
    'board_archived': '#6B7280',
    'board_restored': '#10B981',
    'board_deleted': '#EF4444',
    'column_created': '#10B981',
    'column_updated': '#3B82F6',
    'column_archived': '#6B7280',
    'column_restored': '#10B981',
    'column_deleted': '#EF4444',
    'card_created': '#10B981',
    'card_updated': '#3B82F6',
    'card_moved': '#8B5CF6',
    'card_archived': '#6B7280',
    'card_restored': '#10B981',
    'card_deleted': '#EF4444',
    'card_assigned': '#F59E0B',
    'card_unassigned': '#6B7280',
    'card_completed': '#10B981',
    'card_reopened': '#3B82F6',
    'comment_added': '#3B82F6',
    'comment_updated': '#3B82F6',
    'comment_deleted': '#EF4444',
    'attachment_added': '#8B5CF6',
    'attachment_removed': '#6B7280',
    'checklist_added': '#10B981',
    'checklist_updated': '#3B82F6',
    'checklist_deleted': '#EF4444',
    'label_added': '#F59E0B',
    'label_removed': '#6B7280',
    'vote_added': '#10B981',
    'vote_removed': '#6B7280',
    'member_added': '#10B981',
    'member_removed': '#EF4444',
    'member_role_changed': '#3B82F6',
    'due_date_set': '#F59E0B',
    'due_date_updated': '#3B82F6',
    'due_date_removed': '#6B7280'
  };
  
  return colorMap[this.type] || '#6B7280';
};

// Class methods
Activity.createActivity = function(data) {
  return this.create({
    type: data.type,
    description: data.description,
    metadata: data.metadata || {},
    isSystem: data.isSystem || false,
    isVisible: data.isVisible !== false,
    userId: data.userId,
    boardId: data.boardId,
    columnId: data.columnId,
    cardId: data.cardId
  });
};

Activity.findByBoard = function(boardId, limit = 50) {
  return this.findAll({
    where: {
      boardId,
      isVisible: true
    },
    include: ['User'],
    order: [['createdAt', 'DESC']],
    limit
  });
};

Activity.findByCard = function(cardId, limit = 20) {
  return this.findAll({
    where: {
      cardId,
      isVisible: true
    },
    include: ['User'],
    order: [['createdAt', 'DESC']],
    limit
  });
};

Activity.findByUser = function(userId, limit = 50) {
  return this.findAll({
    where: {
      userId,
      isVisible: true
    },
    include: ['Board', 'Column', 'Card'],
    order: [['createdAt', 'DESC']],
    limit
  });
};

Activity.findRecent = function(limit = 100) {
  return this.findAll({
    where: {
      isVisible: true
    },
    include: ['User', 'Board', 'Column', 'Card'],
    order: [['createdAt', 'DESC']],
    limit
  });
};

module.exports = Activity;
