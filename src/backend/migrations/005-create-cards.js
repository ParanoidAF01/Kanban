'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('cards', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      coverImage: {
        type: Sequelize.STRING,
        allowNull: true
      },
      coverColor: {
        type: Sequelize.STRING,
        allowNull: true
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      isCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isArchived: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
        defaultValue: 'medium'
      },
      labels: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      attachments: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      checklists: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      votes: {
        type: Sequelize.JSONB,
        defaultValue: {
          count: 0,
          voters: []
        }
      },
      comments: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      watchers: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {
          timeSpent: 0,
          estimatedTime: 0,
          storyPoints: 0,
          tags: [],
          customFields: {}
        }
      },
      completedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      columnId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'columns',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    await queryInterface.addIndex('cards', ['columnId']);
    await queryInterface.addIndex('cards', ['boardId']);
    await queryInterface.addIndex('cards', ['position']);
    await queryInterface.addIndex('cards', ['isArchived']);
    await queryInterface.addIndex('cards', ['isCompleted']);
    await queryInterface.addIndex('cards', ['dueDate']);
    await queryInterface.addIndex('cards', ['priority']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('cards');
  }
};
