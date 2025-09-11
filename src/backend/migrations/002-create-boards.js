'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('boards', {
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
        defaultValue: '#3B82F6'
      },
      backgroundImage: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isPublic: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isArchived: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      settings: {
        type: Sequelize.JSONB,
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
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastActivityAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      ownerId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
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
    await queryInterface.addIndex('boards', ['ownerId']);
    await queryInterface.addIndex('boards', ['isPublic']);
    await queryInterface.addIndex('boards', ['isArchived']);
    await queryInterface.addIndex('boards', ['lastActivityAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('boards');
  }
};
