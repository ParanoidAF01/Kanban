const express = require('express');
const { Board, Column, Card, Activity, User, BoardMember } = require('../models');
const { authenticate, checkBoardPermission } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError, ConflictError } = require('../middleware/errorHandler');

const router = express.Router();

// Get all columns for a board
router.get('/board/:boardId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { boardId } = req.params;
    const userId = req.user.id;

    // Check board permission manually
    const board = await Board.findByPk(boardId, {
      include: [{
        model: BoardMember,
        as: 'BoardMembers',
        where: { userId, isActive: true },
        required: false
      }]
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    const membership = board.BoardMembers[0];
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const columns = await Column.findAll({
      where: { boardId, isArchived: false },
      include: [{
        model: Card,
        as: 'Cards',
        where: { isArchived: false },
        required: false,
        include: [{
          model: User,
          as: 'Assignees',
          through: { attributes: ['role', 'assignedAt'] },
          attributes: ['id', 'firstName', 'lastName', 'avatar']
        }],
        order: [['position', 'ASC']]
      }],
      order: [['position', 'ASC']]
    });

    res.json({
      success: true,
      data: { columns }
    });
  })
);

// Create new column
router.post('/',
  authenticate,
  validate(schemas.createColumn),
  asyncHandler(async (req, res) => {
    const { boardId } = req.body;
    const columnData = req.body;
    const userId = req.user.id;

    // Check board permission manually
    const board = await Board.findByPk(boardId, {
      include: [{
        model: BoardMember,
        as: 'BoardMembers',
        where: { userId, isActive: true },
        required: false
      }]
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        message: 'Board not found'
      });
    }

    const membership = board.BoardMembers[0];
    if (!membership) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }


    // Get next position if not provided
    if (columnData.position === undefined) {
      const lastColumn = await Column.findOne({
        where: { boardId },
        order: [['position', 'DESC']]
      });
      columnData.position = lastColumn ? lastColumn.position + 1 : 0;
    }

    // Create column
    const column = await Column.create({
      ...columnData,
      boardId,
      settings: {
        allowNewCards: true,
        allowCardMovement: true,
        allowCardDeletion: true,
        showCardCount: true,
        showProgress: false,
        autoArchive: false,
        autoArchiveDays: 30,
        ...columnData.settings
      }
    });

    // Create activity
    await Activity.create({
      type: 'column_created',
      description: `Created column "${column.name}"`,
      metadata: {
        columnName: column.name,
        columnColor: column.color
      },
      userId,
      boardId,
      columnId: column.id
    });

    res.status(201).json({
      success: true,
      message: 'Column created successfully',
      data: { column }
    });
  })
);

// Get column by ID
router.get('/:columnId',
  authenticate,
  asyncHandler(async (req, res) => {
    const { columnId } = req.params;

    const column = await Column.findByPk(columnId, {
      include: [
        {
          model: Board,
          as: 'Board',
          include: [{
            model: BoardMember,
            as: 'BoardMembers',
            where: { userId: req.user.id, isActive: true },
            required: true
          }]
        },
        {
          model: Card,
          as: 'Cards',
          where: { isArchived: false },
          required: false,
          include: [{
            model: User,
            as: 'Assignees',
            through: { attributes: ['role', 'assignedAt'] },
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          }],
          order: [['position', 'ASC']]
        }
      ]
    });

    if (!column) {
      throw new NotFoundError('Column not found');
    }

    res.json({
      success: true,
      data: { column }
    });
  })
);

// Update column
router.put('/:columnId',
  authenticate,
  checkBoardPermission('canEditColumns'),
  validate(schemas.updateColumn),
  asyncHandler(async (req, res) => {
    const { columnId } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const column = await Column.findByPk(columnId, {
      include: [{ model: Board }]
    });

    if (!column) {
      throw new NotFoundError('Column not found');
    }

    // Track changes for activity log
    const changes = [];
    if (updateData.name && updateData.name !== column.name) {
      changes.push(`renamed column from "${column.name}" to "${updateData.name}"`);
    }
    if (updateData.color && updateData.color !== column.color) {
      changes.push(`changed column color to ${updateData.color}`);
    }

    await column.update(updateData);

    // Create activity for changes
    if (changes.length > 0) {
      await Activity.create({
        type: 'column_updated',
        description: changes.join(', '),
        metadata: { changes: updateData },
        userId,
        boardId: column.boardId,
        columnId: column.id
      });
    }

    res.json({
      success: true,
      message: 'Column updated successfully',
      data: { column }
    });
  })
);

// Update column positions (bulk update)
router.put('/positions',
  authenticate,
  checkBoardPermission('canEditColumns'),
  asyncHandler(async (req, res) => {
    const { columns } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(columns)) {
      return res.status(400).json({
        success: false,
        message: 'Columns must be an array'
      });
    }

    // Update positions in transaction
    const transaction = await Column.sequelize.transaction();

    try {
      for (const { id, position } of columns) {
        await Column.update(
          { position },
          { where: { id }, transaction }
        );
      }

      await transaction.commit();

      // Get board ID for activity
      const firstColumn = await Column.findByPk(columns[0]?.id);
      if (firstColumn) {
        await Activity.create({
          type: 'columns_reordered',
          description: 'Reordered columns',
          metadata: { columnPositions: columns },
          userId,
          boardId: firstColumn.boardId
        });
      }

      res.json({
        success: true,
        message: 'Column positions updated successfully'
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  })
);

// Delete column
router.delete('/:columnId',
  authenticate,
  checkBoardPermission('canDeleteColumns'),
  asyncHandler(async (req, res) => {
    const { columnId } = req.params;
    const userId = req.user.id;

    const column = await Column.findByPk(columnId, {
      include: [{ model: Board, as: 'Board' }]
    });

    if (!column) {
      throw new NotFoundError('Column not found');
    }

    // Archive all cards in the column first
    await Card.update(
      { isArchived: true },
      { where: { columnId, isArchived: false } }
    );

    // Soft delete - archive the column
    await column.update({ isArchived: true });

    // Create activity
    await Activity.create({
      type: 'column_deleted',
      description: `Deleted column "${column.name}"`,
      metadata: { columnName: column.name },
      userId,
      boardId: column.boardId,
      columnId: column.id
    });

    res.json({
      success: true,
      message: 'Column deleted successfully'
    });
  })
);

// Get column statistics
router.get('/:columnId/stats',
  authenticate,
  asyncHandler(async (req, res) => {
    const { columnId } = req.params;

    const column = await Column.findByPk(columnId, {
      include: [{ model: Board }]
    });

    if (!column) {
      throw new NotFoundError('Column not found');
    }

    // Get card statistics
    const totalCards = await Card.count({ where: { columnId, isArchived: false } });
    const completedCards = await Card.count({ 
      where: { columnId, isArchived: false, isCompleted: true } 
    });
    const overdueCards = await Card.count({
      where: {
        columnId,
        isArchived: false,
        isCompleted: false,
        dueDate: {
          [Column.sequelize.Op.lt]: new Date()
        }
      }
    });

    // Get cards by priority
    const priorityStats = await Card.findAll({
      where: { columnId, isArchived: false },
      attributes: [
        'priority',
        [Column.sequelize.fn('COUNT', Column.sequelize.col('id')), 'count']
      ],
      group: ['priority']
    });

    // Get recent activity
    const recentActivity = await Activity.findAll({
      where: { columnId },
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'avatar']
      }]
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalCards,
          completedCards,
          overdueCards,
          progress: totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0,
          priorityBreakdown: priorityStats.reduce((acc, stat) => {
            acc[stat.priority] = parseInt(stat.dataValues.count);
            return acc;
          }, {})
        },
        recentActivity
      }
    });
  })
);

// Archive column
router.put('/:columnId/archive',
  authenticate,
  checkBoardPermission('canDeleteColumns'),
  asyncHandler(async (req, res) => {
    const { columnId } = req.params;
    const userId = req.user.id;

    const column = await Column.findByPk(columnId, {
      include: [{ model: Board }]
    });

    if (!column) {
      throw new NotFoundError('Column not found');
    }

    await column.update({ isArchived: true });

    // Create activity
    await Activity.create({
      type: 'column_archived',
      description: `Archived column "${column.name}"`,
      metadata: { columnName: column.name },
      userId,
      boardId: column.boardId,
      columnId: column.id
    });

    res.json({
      success: true,
      message: 'Column archived successfully'
    });
  })
);

// Restore archived column
router.put('/:columnId/restore',
  authenticate,
  checkBoardPermission('canEditColumns'),
  asyncHandler(async (req, res) => {
    const { columnId } = req.params;
    const userId = req.user.id;

    const column = await Column.findByPk(columnId, {
      include: [{ model: Board }]
    });

    if (!column) {
      throw new NotFoundError('Column not found');
    }

    await column.update({ isArchived: false });

    // Create activity
    await Activity.create({
      type: 'column_restored',
      description: `Restored column "${column.name}"`,
      metadata: { columnName: column.name },
      userId,
      boardId: column.boardId,
      columnId: column.id
    });

    res.json({
      success: true,
      message: 'Column restored successfully'
    });
  })
);

module.exports = router;