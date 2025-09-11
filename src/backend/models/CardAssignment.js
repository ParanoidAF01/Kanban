const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CardAssignment = sequelize.define('CardAssignment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  role: {
    type: DataTypes.ENUM('assignee', 'reviewer', 'watcher'),
    defaultValue: 'assignee',
    allowNull: false
  },
  assignedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'card_assignments',
  timestamps: true
});

// Instance methods
CardAssignment.prototype.unassign = function() {
  this.isActive = false;
  return this.save();
};

// Class methods
CardAssignment.findByCard = function(cardId) {
  return this.findAll({
    where: {
      cardId,
      isActive: true
    },
    include: ['User'],
    order: [['assignedAt', 'ASC']]
  });
};

CardAssignment.findByUser = function(userId) {
  return this.findAll({
    where: {
      userId,
      isActive: true
    },
    include: ['Card'],
    order: [['assignedAt', 'DESC']]
  });
};

CardAssignment.findByCardAndUser = function(cardId, userId) {
  return this.findOne({
    where: {
      cardId,
      userId,
      isActive: true
    },
    include: ['User', 'Card']
  });
};

CardAssignment.findAssignees = function(cardId) {
  return this.findAll({
    where: {
      cardId,
      role: 'assignee',
      isActive: true
    },
    include: ['User']
  });
};

CardAssignment.findReviewers = function(cardId) {
  return this.findAll({
    where: {
      cardId,
      role: 'reviewer',
      isActive: true
    },
    include: ['User']
  });
};

CardAssignment.findWatchers = function(cardId) {
  return this.findAll({
    where: {
      cardId,
      role: 'watcher',
      isActive: true
    },
    include: ['User']
  });
};

module.exports = CardAssignment;
