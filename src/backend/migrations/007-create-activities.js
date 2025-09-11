'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('activities', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      type: {
        type: Sequelize.ENUM(
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
        type: Sequelize.TEXT,
        allowNull: false
      },
      metadata: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      isSystem: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isVisible: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      boardId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'boards',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      columnId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'columns',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      cardId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'cards',
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
    await queryInterface.addIndex('activities', ['userId']);
    await queryInterface.addIndex('activities', ['boardId']);
    await queryInterface.addIndex('activities', ['columnId']);
    await queryInterface.addIndex('activities', ['cardId']);
    await queryInterface.addIndex('activities', ['type']);
    await queryInterface.addIndex('activities', ['isVisible']);
    await queryInterface.addIndex('activities', ['createdAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('activities');
  }
};
