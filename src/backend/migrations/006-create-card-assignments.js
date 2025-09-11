'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('card_assignments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      role: {
        type: Sequelize.ENUM('assignee', 'reviewer', 'watcher'),
        defaultValue: 'assignee',
        allowNull: false
      },
      assignedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      cardId: {
        type: Sequelize.UUID,
        allowNull: false,
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
    await queryInterface.addIndex('card_assignments', ['userId']);
    await queryInterface.addIndex('card_assignments', ['cardId']);
    await queryInterface.addIndex('card_assignments', ['role']);
    await queryInterface.addIndex('card_assignments', ['isActive']);
    
    // Add unique constraint for user-card-role combination
    await queryInterface.addIndex('card_assignments', ['userId', 'cardId', 'role'], {
      unique: true,
      name: 'unique_user_card_role'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('card_assignments');
  }
};
