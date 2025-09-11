const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BoardMember = sequelize.define('BoardMember', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'member', 'viewer'),
    defaultValue: 'member',
    allowNull: false
  },
  permissions: {
    type: DataTypes.JSONB,
    defaultValue: {
      canEditBoard: false,
      canDeleteBoard: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canCreateColumns: true,
      canEditColumns: true,
      canDeleteColumns: false,
      canCreateCards: true,
      canEditCards: true,
      canDeleteCards: false,
      canMoveCards: true,
      canAssignCards: true,
      canComment: true,
      canVote: true
    }
  },
  joinedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastSeenAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'board_members',
  timestamps: true
});

// Instance methods
BoardMember.prototype.updateLastSeen = function() {
  this.lastSeenAt = new Date();
  return this.save();
};

BoardMember.prototype.hasPermission = function(permission) {
  if (this.role === 'owner') return true;
  if (this.role === 'admin') return true;
  return this.permissions[permission] === true;
};

BoardMember.prototype.canEditBoard = function() {
  return this.hasPermission('canEditBoard');
};

BoardMember.prototype.canDeleteBoard = function() {
  return this.hasPermission('canDeleteBoard');
};

BoardMember.prototype.canInviteMembers = function() {
  return this.hasPermission('canInviteMembers');
};

BoardMember.prototype.canRemoveMembers = function() {
  return this.hasPermission('canRemoveMembers');
};

BoardMember.prototype.canCreateColumns = function() {
  return this.hasPermission('canCreateColumns');
};

BoardMember.prototype.canEditColumns = function() {
  return this.hasPermission('canEditColumns');
};

BoardMember.prototype.canDeleteColumns = function() {
  return this.hasPermission('canDeleteColumns');
};

BoardMember.prototype.canCreateCards = function() {
  return this.hasPermission('canCreateCards');
};

BoardMember.prototype.canEditCards = function() {
  return this.hasPermission('canEditCards');
};

BoardMember.prototype.canDeleteCards = function() {
  return this.hasPermission('canDeleteCards');
};

BoardMember.prototype.canMoveCards = function() {
  return this.hasPermission('canMoveCards');
};

BoardMember.prototype.canAssignCards = function() {
  return this.hasPermission('canAssignCards');
};

BoardMember.prototype.canComment = function() {
  return this.hasPermission('canComment');
};

BoardMember.prototype.canVote = function() {
  return this.hasPermission('canVote');
};

// Class methods
BoardMember.findByBoard = function(boardId) {
  return this.findAll({
    where: { boardId },
    include: ['User'],
    order: [['role', 'ASC'], ['joinedAt', 'ASC']]
  });
};

BoardMember.findByUser = function(userId) {
  return this.findAll({
    where: { userId },
    include: ['Board'],
    order: [['lastSeenAt', 'DESC']]
  });
};

BoardMember.findByBoardAndUser = function(boardId, userId) {
  return this.findOne({
    where: { boardId, userId },
    include: ['User', 'Board']
  });
};

module.exports = BoardMember;
