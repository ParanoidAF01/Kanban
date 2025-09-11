const emailService = require('../services/emailService');
const { User, Board, Card, Column, BoardMember } = require('../models');
const { Op } = require('sequelize');

// Notification middleware for real-time events
const notificationMiddleware = {
  // Send notifications when a card is assigned
  async notifyCardAssignment(cardId, assignedUserId, assignedByUserId) {
    try {
      const card = await Card.findByPk(cardId, {
        include: [{
          model: Column,
          as: 'Column',
          include: [{
            model: Board,
            as: 'Board'
          }]
        }]
      });

      const assignedUser = await User.findByPk(assignedUserId);
      const assignedBy = await User.findByPk(assignedByUserId);

      if (card && assignedUser && assignedBy) {
        await emailService.sendCardAssignmentNotification(
          assignedUser,
          card,
          card.Column.Board,
          assignedBy
        );
      }
    } catch (error) {
      console.error('Error sending card assignment notification:', error);
    }
  },

  // Send due date reminders
  async sendDueDateReminders() {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const nextDay = new Date(tomorrow);
      nextDay.setDate(nextDay.getDate() + 1);

      // Find cards due tomorrow
      const dueCards = await Card.findAll({
        where: {
          dueDate: {
            [Op.gte]: tomorrow,
            [Op.lt]: nextDay
          },
          isCompleted: false,
          isArchived: false,
          assignedUserId: {
            [Op.not]: null
          }
        },
        include: [
          {
            model: User,
            as: 'AssignedUser'
          },
          {
            model: Column,
            as: 'Column',
            include: [{
              model: Board,
              as: 'Board'
            }]
          }
        ]
      });

      // Send reminders
      for (const card of dueCards) {
        if (card.AssignedUser) {
          await emailService.sendCardDueDateReminder(
            card.AssignedUser,
            card,
            card.Column.Board
          );
        }
      }

      console.log(`Sent ${dueCards.length} due date reminders`);
    } catch (error) {
      console.error('Error sending due date reminders:', error);
    }
  },

  // Send board invitation
  async notifyBoardInvitation(boardId, invitedUserId, invitedByUserId) {
    try {
      const board = await Board.findByPk(boardId);
      const invitedUser = await User.findByPk(invitedUserId);
      const invitedBy = await User.findByPk(invitedByUserId);

      if (board && invitedUser && invitedBy) {
        await emailService.sendBoardInvitation(invitedUser, board, invitedBy);
      }
    } catch (error) {
      console.error('Error sending board invitation:', error);
    }
  }
};

// Cron job for due date reminders (run daily at 9 AM)
const setupNotificationScheduler = () => {
  const cron = require('node-cron');
  
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily due date reminder job...');
    await notificationMiddleware.sendDueDateReminders();
  });

  console.log('Notification scheduler initialized');
};

module.exports = {
  notificationMiddleware,
  setupNotificationScheduler
};
