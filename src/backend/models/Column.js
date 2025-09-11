const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Column = sequelize.define('Column', {
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
    defaultValue: '#6B7280',
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  position: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isCollapsed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  cardLimit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    }
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {
      allowNewCards: true,
      allowCardMovement: true,
      allowCardDeletion: true,
      showCardCount: true,
      showProgress: false,
      autoArchive: false,
      autoArchiveDays: 30
    }
  },
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'columns',
  timestamps: true
});

// Instance methods
Column.prototype.getCardCount = async function() {
  const { Card } = require('./Card');
  return await Card.count({
    where: {
      columnId: this.id,
      isArchived: false
    }
  });
};

Column.prototype.getProgress = async function() {
  const { Card } = require('./Card');
  const totalCards = await this.getCardCount();
  if (totalCards === 0) return 0;
  
  const completedCards = await Card.count({
    where: {
      columnId: this.id,
      isArchived: false,
      isCompleted: true
    }
  });
  
  return Math.round((completedCards / totalCards) * 100);
};

Column.prototype.canAddCard = async function() {
  if (!this.settings.allowNewCards) return false;
  if (!this.cardLimit) return true;
  
  const currentCount = await this.getCardCount();
  return currentCount < this.cardLimit;
};

Column.prototype.moveToPosition = async function(newPosition) {
  const { Column } = require('./Column');
  
  // Get all columns in the same board
  const columns = await Column.findAll({
    where: {
      boardId: this.boardId,
      id: { [sequelize.Sequelize.Op.ne]: this.id }
    },
    order: [['position', 'ASC']]
  });
  
  // Update positions
  let position = 0;
  for (let i = 0; i < columns.length; i++) {
    if (i === newPosition) {
      this.position = position;
      await this.save();
      position++;
    }
    columns[i].position = position;
    await columns[i].save();
    position++;
  }
  
  if (newPosition >= columns.length) {
    this.position = position;
    await this.save();
  }
};

Column.prototype.archive = async function() {
  this.isArchived = true;
  await this.save();
  
  // Archive all cards in this column
  const { Card } = require('./Card');
  await Card.update(
    { isArchived: true },
    { where: { columnId: this.id } }
  );
};

// Class methods
Column.findByBoard = function(boardId) {
  return this.findAll({
    where: {
      boardId,
      isArchived: false
    },
    order: [['position', 'ASC']]
  });
};

Column.findByBoardWithCards = function(boardId) {
  return this.findAll({
    where: {
      boardId,
      isArchived: false
    },
    include: [{
      association: 'Cards',
      where: { isArchived: false },
      required: false,
      order: [['position', 'ASC']]
    }],
    order: [['position', 'ASC']]
  });
};

module.exports = Column;
