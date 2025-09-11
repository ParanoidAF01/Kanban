const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Board = sequelize.define('Board', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 100]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  color: {
    type: DataTypes.STRING,
    defaultValue: '#3B82F6',
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  backgroundImage: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      allowComments: true,
      allowAttachments: true,
      allowLabels: true,
      allowChecklists: true,
      allowDueDates: true,
      allowVoting: false,
      cardCover: true,
      cardNumbering: false,
      autoArchive: false,
      autoArchiveDays: 30
    }
  },
  position: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  lastActivityAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'boards',
  timestamps: true,
  hooks: {
    beforeUpdate: (board) => {
      if (board.changed()) {
        board.lastActivityAt = new Date();
      }
    }
  }
});

// Instance methods
Board.prototype.getPublicInfo = function() {
  return {
    id: this.id,
    name: this.name,
    description: this.description,
    color: this.color,
    backgroundImage: this.backgroundImage,
    isPublic: this.isPublic,
    isArchived: this.isArchived,
    settings: this.settings,
    position: this.position,
    lastActivityAt: this.lastActivityAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

Board.prototype.updateLastActivity = function() {
  this.lastActivityAt = new Date();
  return this.save();
};

// Class methods
Board.findByUser = function(userId) {
  return this.findAll({
    where: {
      '$BoardMembers.userId$': userId,
      isArchived: false
    },
    include: [{
      association: 'BoardMembers',
      where: { userId },
      required: true
    }],
    order: [['position', 'ASC'], ['updatedAt', 'DESC']]
  });
};

Board.findPublic = function() {
  return this.findAll({
    where: {
      isPublic: true,
      isArchived: false
    },
    order: [['lastActivityAt', 'DESC']]
  });
};

module.exports = Board;
