const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Card = sequelize.define('Card', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [1, 200]
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  coverImage: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  coverColor: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium'
  },
  labels: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  attachments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  checklists: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  votes: {
    type: DataTypes.JSONB,
    defaultValue: {
      count: 0,
      voters: []
    }
  },
  comments: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  watchers: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {
      timeSpent: 0,
      estimatedTime: 0,
      storyPoints: 0,
      tags: [],
      customFields: {}
    }
  }
}, {
  tableName: 'cards',
  timestamps: true,
  hooks: {
    beforeUpdate: (card) => {
      if (card.changed('isCompleted') && card.isCompleted) {
        card.completedAt = new Date();
      }
    }
  }
});

// Instance methods
Card.prototype.addComment = function(userId, content) {
  const comment = {
    id: require('crypto').randomUUID(),
    userId,
    content,
    createdAt: new Date().toISOString()
  };
  
  this.comments = [...this.comments, comment];
  return this.save();
};

Card.prototype.addVote = function(userId) {
  if (!this.votes.voters.includes(userId)) {
    this.votes.voters.push(userId);
    this.votes.count = this.votes.voters.length;
    return this.save();
  }
  return Promise.resolve(this);
};

Card.prototype.removeVote = function(userId) {
  this.votes.voters = this.votes.voters.filter(id => id !== userId);
  this.votes.count = this.votes.voters.length;
  return this.save();
};

Card.prototype.addWatcher = function(userId) {
  if (!this.watchers.includes(userId)) {
    this.watchers.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

Card.prototype.removeWatcher = function(userId) {
  this.watchers = this.watchers.filter(id => id !== userId);
  return this.save();
};

Card.prototype.addLabel = function(label) {
  if (!this.labels.find(l => l.id === label.id)) {
    this.labels = [...this.labels, label];
    return this.save();
  }
  return Promise.resolve(this);
};

Card.prototype.removeLabel = function(labelId) {
  this.labels = this.labels.filter(l => l.id !== labelId);
  return this.save();
};

Card.prototype.addAttachment = function(attachment) {
  this.attachments = [...this.attachments, attachment];
  return this.save();
};

Card.prototype.removeAttachment = function(attachmentId) {
  this.attachments = this.attachments.filter(a => a.id !== attachmentId);
  return this.save();
};

Card.prototype.addChecklist = function(checklist) {
  this.checklists = [...this.checklists, checklist];
  return this.save();
};

Card.prototype.updateChecklist = function(checklistId, updates) {
  this.checklists = this.checklists.map(checklist => 
    checklist.id === checklistId ? { ...checklist, ...updates } : checklist
  );
  return this.save();
};

Card.prototype.removeChecklist = function(checklistId) {
  this.checklists = this.checklists.filter(c => c.id !== checklistId);
  return this.save();
};

Card.prototype.moveToPosition = async function(newPosition) {
  // Get all cards in the same column
  const cards = await this.constructor.findAll({
    where: {
      columnId: this.columnId,
      id: { [sequelize.Sequelize.Op.ne]: this.id }
    },
    order: [['position', 'ASC']]
  });
  
  // Update positions
  let position = 0;
  for (let i = 0; i < cards.length; i++) {
    if (i === newPosition) {
      this.position = position;
      await this.save();
      position++;
    }
    cards[i].position = position;
    await cards[i].save();
    position++;
  }
  
  if (newPosition >= cards.length) {
    this.position = position;
    await this.save();
  }
};

Card.prototype.moveToColumn = async function(newColumnId, newPosition = 0) {
  // Get all cards in the new column
  const cards = await this.constructor.findAll({
    where: {
      columnId: newColumnId,
      id: { [sequelize.Sequelize.Op.ne]: this.id }
    },
    order: [['position', 'ASC']]
  });
  
  // Update positions
  let position = 0;
  for (let i = 0; i < cards.length; i++) {
    if (i === newPosition) {
      this.columnId = newColumnId;
      this.position = position;
      await this.save();
      position++;
    }
    cards[i].position = position;
    await cards[i].save();
    position++;
  }
  
  if (newPosition >= cards.length) {
    this.columnId = newColumnId;
    this.position = position;
    await this.save();
  }
};

Card.prototype.archive = async function() {
  this.isArchived = true;
  await this.save();
};

// Class methods
Card.findByColumn = function(columnId) {
  return this.findAll({
    where: {
      columnId,
      isArchived: false
    },
    order: [['position', 'ASC']]
  });
};

Card.findByBoard = function(boardId) {
  return this.findAll({
    where: {
      '$Column.boardId$': boardId,
      isArchived: false
    },
    include: [{
      association: 'Column',
      where: { boardId }
    }],
    order: [['position', 'ASC']]
  });
};

Card.findByUser = function(userId) {
  return this.findAll({
    where: {
      '$CardAssignments.userId$': userId,
      isArchived: false
    },
    include: [{
      association: 'CardAssignments',
      where: { userId },
      required: true
    }],
    order: [['updatedAt', 'DESC']]
  });
};

Card.findOverdue = function() {
  return this.findAll({
    where: {
      dueDate: {
        [sequelize.Sequelize.Op.lt]: new Date()
      },
      isCompleted: false,
      isArchived: false
    },
    order: [['dueDate', 'ASC']]
  });
};

module.exports = Card;
