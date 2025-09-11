const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Board = require('./Board');
const BoardMember = require('./BoardMember');
const Column = require('./Column');
const Card = require('./Card');
const CardAssignment = require('./CardAssignment');
const Activity = require('./Activity');

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasMany(Board, { 
    as: 'OwnedBoards', 
    foreignKey: 'ownerId',
    onDelete: 'CASCADE'
  });
  
  User.belongsToMany(Board, {
    through: BoardMember,
    as: 'Boards',
    foreignKey: 'userId',
    otherKey: 'boardId'
  });
  
  User.hasMany(CardAssignment, {
    as: 'CardAssignments',
    foreignKey: 'userId',
    onDelete: 'CASCADE'
  });
  
  User.hasMany(Activity, {
    as: 'Activities',
    foreignKey: 'userId',
    onDelete: 'CASCADE'
  });

  // Board associations
  Board.belongsTo(User, {
    as: 'Owner',
    foreignKey: 'ownerId',
    onDelete: 'CASCADE'
  });
  
  Board.belongsToMany(User, {
    through: BoardMember,
    as: 'Members',
    foreignKey: 'boardId',
    otherKey: 'userId'
  });
  
  Board.hasMany(BoardMember, {
    as: 'BoardMembers',
    foreignKey: 'boardId',
    onDelete: 'CASCADE'
  });
  
  Board.hasMany(Column, {
    as: 'Columns',
    foreignKey: 'boardId',
    onDelete: 'CASCADE'
  });
  
  Board.hasMany(Activity, {
    as: 'Activities',
    foreignKey: 'boardId',
    onDelete: 'CASCADE'
  });

  // BoardMember associations
  BoardMember.belongsTo(User, {
    as: 'User',
    foreignKey: 'userId',
    onDelete: 'CASCADE'
  });
  
  BoardMember.belongsTo(Board, {
    as: 'Board',
    foreignKey: 'boardId',
    onDelete: 'CASCADE'
  });

  // Column associations
  Column.belongsTo(Board, {
    as: 'Board',
    foreignKey: 'boardId',
    onDelete: 'CASCADE'
  });
  
  Column.hasMany(Card, {
    as: 'Cards',
    foreignKey: 'columnId',
    onDelete: 'CASCADE'
  });
  
  Column.hasMany(Activity, {
    as: 'Activities',
    foreignKey: 'columnId',
    onDelete: 'CASCADE'
  });

  // Card associations
  Card.belongsTo(Column, {
    as: 'Column',
    foreignKey: 'columnId',
    onDelete: 'CASCADE'
  });
  
  Card.belongsTo(Board, {
    as: 'Board',
    foreignKey: 'boardId',
    onDelete: 'CASCADE'
  });
  
  Card.belongsToMany(User, {
    through: CardAssignment,
    as: 'Assignees',
    foreignKey: 'cardId',
    otherKey: 'userId'
  });
  
  Card.hasMany(CardAssignment, {
    as: 'CardAssignments',
    foreignKey: 'cardId',
    onDelete: 'CASCADE'
  });
  
  Card.hasMany(Activity, {
    as: 'Activities',
    foreignKey: 'cardId',
    onDelete: 'CASCADE'
  });

  // CardAssignment associations
  CardAssignment.belongsTo(User, {
    as: 'User',
    foreignKey: 'userId',
    onDelete: 'CASCADE'
  });
  
  CardAssignment.belongsTo(Card, {
    as: 'Card',
    foreignKey: 'cardId',
    onDelete: 'CASCADE'
  });

  // Activity associations
  Activity.belongsTo(User, {
    as: 'User',
    foreignKey: 'userId',
    onDelete: 'CASCADE'
  });
  
  Activity.belongsTo(Board, {
    as: 'Board',
    foreignKey: 'boardId',
    onDelete: 'CASCADE'
  });
  
  Activity.belongsTo(Column, {
    as: 'Column',
    foreignKey: 'columnId',
    onDelete: 'CASCADE'
  });
  
  Activity.belongsTo(Card, {
    as: 'Card',
    foreignKey: 'cardId',
    onDelete: 'CASCADE'
  });
};

// Initialize associations
defineAssociations();

// Export models and sequelize instance
module.exports = {
  sequelize,
  User,
  Board,
  BoardMember,
  Column,
  Card,
  CardAssignment,
  Activity
};
