'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('board_members', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      role: {
        type: Sequelize.ENUM('owner', 'admin', 'member', 'viewer'),
        defaultValue: 'member',
        allowNull: false
      },
      permissions: {
        type: Sequelize.JSONB,
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
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      lastSeenAt: {
        type: Sequelize.DATE,
        allowNull: true
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
    await queryInterface.addIndex('board_members', ['userId']);
    await queryInterface.addIndex('board_members', ['boardId']);
    await queryInterface.addIndex('board_members', ['role']);
    await queryInterface.addIndex('board_members', ['isActive']);
    
    // Add unique constraint for user-board combination
    await queryInterface.addIndex('board_members', ['userId', 'boardId'], {
      unique: true,
      name: 'unique_user_board'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('board_members');
  }
};
