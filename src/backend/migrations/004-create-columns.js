'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('columns', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      color: {
        type: Sequelize.STRING,
        defaultValue: '#6B7280'
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      isCollapsed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      cardLimit: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      settings: {
        type: Sequelize.JSONB,
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
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      boardId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'boards',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes
    await queryInterface.addIndex('columns', ['boardId']);
    await queryInterface.addIndex('columns', ['position']);
    await queryInterface.addIndex('columns', ['isArchived']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('columns');
  }
};
