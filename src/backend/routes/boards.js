const express = require('express');
const { Board, User, Column, Card, Activity, sequelize } = require('../models');
const { authenticate, checkBoardPermission } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler, NotFoundError, ForbiddenError, ConflictError } = require('../middleware/errorHandler');

const router = express.Router();

// Get all boards for current user
router.get('/',
  authenticate,
  validate(schemas.pagination, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, sortBy, sortOrder } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * limit;

    // Use raw query to get boards with membership info
    const results = await sequelize.query(`
      SELECT 
        b.*,
        bm.role,
        bm.permissions,
        bm.joinedAt
      FROM boards b
      INNER JOIN board_members bm ON b.id = bm.boardId
      WHERE bm.userId = :userId AND bm.isActive = true AND b.isArchived = false
      ORDER BY b.${sortBy} ${sortOrder}
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { userId, limit: parseInt(limit), offset: parseInt(offset) },
      type: sequelize.QueryTypes.SELECT
    });

    // Get total count
    const countResult = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM boards b
      INNER JOIN board_members bm ON b.id = bm.boardId
      WHERE bm.userId = :userId AND bm.isActive = true AND b.isArchived = false
    `, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });
    const total = countResult[0].count;

    // Get columns for each board
    const boardsWithColumns = await Promise.all((results || []).map(async (board) => {
      const columns = await Column.findAll({
        where: { boardId: board.id },
        attributes: ['id', 'name', 'position', 'color'],
        order: [['position', 'ASC']]
      });

      return {
        ...board,
        Columns: columns,
        membership: {
          role: board.role,
          permissions: JSON.parse(board.permissions),
          joinedAt: board.joinedAt
        }
      };
    }));

    res.json({
      success: true,
      data: {
        boards: boardsWithColumns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  })
);

// Create new board
router.post('/',
  authenticate,
  validate(schemas.createBoard),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const boardData = req.body;

    // Create board
    const board = await Board.create({
      ...boardData,
      ownerId: userId,
      position: 0
    });

    // Add owner as board member using raw query
    await sequelize.query(`
      INSERT INTO board_members (id, userId, boardId, role, permissions, joinedAt, isActive, createdAt, updatedAt)
      VALUES (:id, :userId, :boardId, :role, :permissions, :joinedAt, :isActive, :createdAt, :updatedAt)
    `, {
      replacements: {
        id: require('crypto').randomUUID(),
        userId,
        boardId: board.id,
        role: 'owner',
        permissions: JSON.stringify({
          canEditBoard: true,
          canDeleteBoard: true,
          canInviteMembers: true,
          canRemoveMembers: true,
          canCreateColumns: true,
          canEditColumns: true,
          canDeleteColumns: true,
          canCreateCards: true,
          canEditCards: true,
          canDeleteCards: true,
          canMoveCards: true,
          canAssignCards: true,
          canComment: true,
          canVote: true
        }),
        joinedAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.status(201).json({
      success: true,
      message: 'Board created successfully',
      data: { board }
    });
  })
);

// Get board by ID
router.get('/:boardId',
  authenticate,
  checkBoardPermission(),
  asyncHandler(async (req, res) => {
    const { boardId } = req.params;
    const userId = req.user.id;

    // Get board with membership info
    const result = await sequelize.query(`
      SELECT 
        b.*,
        bm.role,
        bm.permissions,
        bm.joinedAt
      FROM boards b
      INNER JOIN board_members bm ON b.id = bm.boardId
      WHERE b.id = :boardId AND bm.userId = :userId AND bm.isActive = true
    `, {
      replacements: { boardId, userId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!result || result.length === 0) {
      throw new NotFoundError('Board not found');
    }

    const board = result[0];

    // Get columns with cards
    const columns = await Column.findAll({
      where: { boardId },
      include: [{
        model: Card,
        as: 'Cards',
        where: { isArchived: false },
        required: false,
        order: [['position', 'ASC']]
      }],
      order: [['position', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        board: {
          ...board,
          Columns: columns,
          membership: {
            role: board.role,
            permissions: JSON.parse(board.permissions),
            joinedAt: board.joinedAt
          }
        }
      }
    });
  })
);

// Update board
router.put('/:boardId',
  authenticate,
  checkBoardPermission('canEditBoard'),
  validate(schemas.updateBoard),
  asyncHandler(async (req, res) => {
    const { boardId } = req.params;
    const updateData = req.body;

    const board = await Board.findByPk(boardId);
    if (!board) {
      throw new NotFoundError('Board not found');
    }

    await board.update(updateData);

    res.json({
      success: true,
      message: 'Board updated successfully',
      data: { board }
    });
  })
);

// Delete board
router.delete('/:boardId',
  authenticate,
  checkBoardPermission('canDeleteBoard'),
  asyncHandler(async (req, res) => {
    const { boardId } = req.params;

    const board = await Board.findByPk(boardId);
    if (!board) {
      throw new NotFoundError('Board not found');
    }

    // Soft delete by archiving
    await board.update({ isArchived: true });

    res.json({
      success: true,
      message: 'Board deleted successfully'
    });
  })
);

// Get columns for a specific board
router.get('/:boardId/columns',
  authenticate,
  checkBoardPermission(),
  asyncHandler(async (req, res) => {
    const { boardId } = req.params;

    // Get board with columns and cards
    const board = await Board.findByPk(boardId, {
      include: [{
        model: Column,
        as: 'Columns',
        where: { isArchived: false },
        required: false,
        order: [['position', 'ASC']],
        include: [{
          model: Card,
          as: 'Cards',
          where: { isArchived: false },
          required: false,
          order: [['position', 'ASC']],
          include: [{
            model: User,
            as: 'Assignees',
            through: { attributes: ['role', 'assignedAt'] },
            attributes: ['id', 'firstName', 'lastName', 'avatar']
          }]
        }]
      }]
    });

    if (!board) {
      throw new NotFoundError('Board not found');
    }

    res.json({
      success: true,
      data: { board }
    });
  })
);

// Create column for a board
router.post('/:boardId/columns',
  authenticate,
  checkBoardPermission('canCreateColumns'),
  validate(schemas.createColumn),
  asyncHandler(async (req, res) => {
    const { boardId } = req.params;
    const columnData = req.body;
    const userId = req.user.id;

    // Check if board exists
    const board = await Board.findByPk(boardId);
    if (!board) {
      throw new NotFoundError('Board not found');
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
      boardId
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

module.exports = router;
