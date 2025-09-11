const express = require('express');
const { Card, Column, Board, User, Activity, BoardMember } = require('../models');
const { authenticate, checkBoardPermission } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError, ForbiddenError, ConflictError } = require('../middleware/errorHandler');
const { notificationMiddleware } = require('../middleware/notifications');

const router = express.Router();

// Get cards with query parameters (for filtering by column, board, etc.)
router.get('/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { columnId, boardId, page = 1, limit = 50 } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    let whereClause = { isArchived: false };
    let includeClause = [];

    if (columnId) {
      whereClause.columnId = columnId;
      
      // Verify column access
      const column = await Column.findByPk(columnId, {
        include: [{
          model: Board,
          as: 'Board',
          include: [{
            model: BoardMember,
            as: 'BoardMembers',
            where: { userId, isActive: true },
            required: true
          }]
        }]
      });

      if (!column) {
        throw new NotFoundError('Column not found or access denied');
      }
    } else if (boardId) {
      whereClause.boardId = boardId;
      
      // Verify board access
      const board = await Board.findByPk(boardId, {
        include: [{
          model: BoardMember,
          as: 'BoardMembers',
          where: { userId, isActive: true },
          required: true
        }]
      });

      if (!board) {
        throw new NotFoundError('Board not found or access denied');
      }
    }

    includeClause = [
      {
        model: User,
        as: 'Assignees',
        through: { attributes: ['role', 'assignedAt'] },
        attributes: ['id', 'firstName', 'lastName', 'avatar']
      },
      {
        model: Column,
        as: 'Column',
        attributes: ['id', 'name', 'color']
      }
    ];

    const cards = await Card.findAndCountAll({
      where: whereClause,
      include: includeClause,
      order: [['position', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        cards: cards.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: cards.count,
          pages: Math.ceil(cards.count / limit)
        }
      }
    });
  })
);

// Get all cards for a column
router.get('/column/:columnId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { columnId } = req.params;
    const userId = req.user.id;

    // Check column and board access
    const column = await Column.findByPk(columnId, {
      include: [{
        model: Board,
        as: 'Board',
        include: [{
          model: BoardMember,
          as: 'BoardMembers',
          where: { userId, isActive: true },
          required: true
        }]
      }]
    });

    if (!column) {
      throw new NotFoundError('Column not found');
    }

    const cards = await Card.findAll({
      where: { columnId, isArchived: false },
      include: [{
        model: User,
        as: 'Assignees',
        through: { attributes: ['role', 'assignedAt'] },
        attributes: ['id', 'firstName', 'lastName', 'avatar']
      }],
      order: [['position', 'ASC']]
    });

    res.json({
      success: true,
      data: { cards }
    });
  })
);

// Create new card
router.post('/',
  authenticate,
  validate(schemas.createCard),
  asyncHandler(async (req, res) => {
    const cardData = req.body;
    const userId = req.user.id;
    const { columnId } = cardData;

    // Check column exists
    const column = await Column.findByPk(columnId);
    if (!column) {
      throw new NotFoundError('Column not found');
    }

    // Check board access
    const board = await Board.findByPk(column.boardId, {
      include: [{
        model: BoardMember,
        as: 'BoardMembers',
        where: { userId, isActive: true },
        required: false
      }]
    });

    if (!board) {
      throw new NotFoundError('Board not found');
    }

    // Check if user has access to the board
    const hasAccess = board.ownerId === userId || 
                     board.BoardMembers.some(member => member.userId === userId);

    if (!hasAccess) {
      throw new NotFoundError('Access denied');
    }

    // Get next position if not provided
    if (cardData.position === undefined) {
      const lastCard = await Card.findOne({
        where: { columnId },
        order: [['position', 'DESC']]
      });
      cardData.position = lastCard ? lastCard.position + 1 : 0;
    }

    // Create card
    const card = await Card.create({
      ...cardData,
      columnId,
      boardId: column.boardId,
      labels: cardData.labels || [],
      attachments: cardData.attachments || [],
      checklists: cardData.checklists || [],
      votes: { count: 0, voters: [] },
      comments: [],
      watchers: [],
      metadata: {
        timeSpent: 0,
        estimatedTime: 0,
        storyPoints: 0,
        tags: [],
        customFields: {},
        ...cardData.metadata
      }
    });

    // Create activity
    await Activity.create({
      type: 'card_created',
      description: `Created card "${card.title}"`,
      metadata: {
        cardTitle: card.title,
        cardPriority: card.priority
      },
      userId,
      boardId: column.boardId,
      columnId: column.id,
      cardId: card.id
    });

    res.status(201).json({
      success: true,
      message: 'Card created successfully',
      data: { card }
    });
  })
);

// Get card by ID
router.get('/:cardId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { cardId } = req.params;
    const userId = req.user.id;

    const card = await Card.findByPk(cardId, {
      include: [
        {
          model: Column,
          as: 'Column',
          include: [{
            model: Board,
            as: 'Board',
            include: [{
              model: BoardMember,
              as: 'BoardMembers',
              where: { userId, isActive: true },
              required: true
            }]
          }]
        },
        {
          model: User,
          as: 'Assignees',
          through: { attributes: ['role', 'assignedAt'] },
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }
      ]
    });

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    res.json({
      success: true,
      data: { card }
    });
  })
);

// Update card
router.put('/:cardId',
  authenticate,
  checkBoardPermission('canEditCards'),
  validate(schemas.updateCard),
  asyncHandler(async (req, res) => {
    const { cardId } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

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

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    // Track changes for activity log
    const changes = [];
    if (updateData.title && updateData.title !== card.title) {
      changes.push(`renamed card from "${card.title}" to "${updateData.title}"`);
    }
    if (updateData.description && updateData.description !== card.description) {
      changes.push('updated card description');
    }
    if (updateData.priority && updateData.priority !== card.priority) {
      changes.push(`changed priority to ${updateData.priority}`);
    }

    await card.update(updateData);

    // Create activity for changes
    if (changes.length > 0) {
      await Activity.create({
        type: 'card_updated',
        description: changes.join(', '),
        metadata: { changes: updateData },
        userId,
        boardId: card.boardId,
        columnId: card.columnId,
        cardId: card.id
      });
    }

    res.json({
      success: true,
      message: 'Card updated successfully',
      data: { card }
    });
  })
);

// Move card between columns
router.put('/:cardId/move',
  authenticate,
  checkBoardPermission('canMoveCards'),
  asyncHandler(async (req, res) => {
    const { cardId } = req.params;
    const { targetColumnId, newPosition } = req.body;
    const userId = req.user.id;

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

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const targetColumn = await Column.findByPk(targetColumnId);
    if (!targetColumn) {
      throw new NotFoundError('Target column not found');
    }

    const oldColumnId = card.columnId;
    const oldPosition = card.position;

    // Update card position and column
    await card.update({
      columnId: targetColumnId,
      position: newPosition || 0
    });

    // Create activity
    await Activity.create({
      type: 'card_moved',
      description: `Moved card "${card.title}" from ${oldColumnId} to ${targetColumnId}`,
      metadata: {
        cardTitle: card.title,
        fromColumn: oldColumnId,
        toColumn: targetColumnId,
        fromPosition: oldPosition,
        toPosition: newPosition || 0
      },
      userId,
      boardId: card.boardId,
      columnId: targetColumnId,
      cardId: card.id
    });

    res.json({
      success: true,
      message: 'Card moved successfully',
      data: { card }
    });
  })
);

// Assign user to card
router.post('/:cardId/assign',
  authenticate,
  checkBoardPermission('canAssignCards'),
  asyncHandler(async (req, res) => {
    const { cardId } = req.params;
    const { userId: assigneeId, role = 'assignee' } = req.body;
    const userId = req.user.id;

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

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const assignee = await User.findByPk(assigneeId);
    if (!assignee) {
      throw new NotFoundError('User not found');
    }

    // Check if already assigned
    const existingAssignment = await CardAssignment.findOne({
      where: { cardId, userId: assigneeId }
    });

    if (existingAssignment) {
      throw new ConflictError('User is already assigned to this card');
    }

    // Create assignment
    const assignment = await CardAssignment.create({
      cardId,
      userId: assigneeId,
      role,
      assignedAt: new Date()
    });

    // Send notification email
    notificationMiddleware.notifyCardAssignment(cardId, assigneeId, userId).catch(err =>
      console.error('Failed to send card assignment notification:', err)
    );

    // Create activity
    await Activity.create({
      type: 'card_assigned',
      description: `Assigned ${assignee.getFullName()} to card "${card.title}"`,
      metadata: {
        cardTitle: card.title,
        assigneeName: assignee.getFullName(),
        role
      },
      userId,
      boardId: card.boardId,
      columnId: card.columnId,
      cardId: card.id
    });

    res.status(201).json({
      success: true,
      message: 'User assigned to card successfully',
      data: { assignment }
    });
  })
);

// Remove user from card
router.delete('/:cardId/assign/:userId',
  authenticate,
  checkBoardPermission('canAssignCards'),
  asyncHandler(async (req, res) => {
    const { cardId, userId: assigneeId } = req.params;
    const userId = req.user.id;

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

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const assignment = await CardAssignment.findOne({
      where: { cardId, userId: assigneeId }
    });

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    await assignment.destroy();

    // Create activity
    await Activity.create({
      type: 'card_unassigned',
      description: `Removed assignment from card "${card.title}"`,
      metadata: { cardTitle: card.title },
      userId,
      boardId: card.boardId,
      columnId: card.columnId,
      cardId: card.id
    });

    res.json({
      success: true,
      message: 'User removed from card successfully'
    });
  })
);

// Delete card
router.delete('/:cardId',
  authenticate,
  checkBoardPermission('canDeleteCards'),
  asyncHandler(async (req, res) => {
    const { cardId } = req.params;
    const userId = req.user.id;

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

    if (!card) {
      throw new NotFoundError('Card not found');
    }

    // Soft delete - archive the card
    await card.update({ isArchived: true });

    // Create activity
    await Activity.create({
      type: 'card_deleted',
      description: `Deleted card "${card.title}"`,
      metadata: { cardTitle: card.title },
      userId,
      boardId: card.boardId,
      columnId: card.columnId,
      cardId: card.id
    });

    res.json({
      success: true,
      message: 'Card deleted successfully'
    });
  })
);

module.exports = router;
