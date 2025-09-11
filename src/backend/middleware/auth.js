const jwt = require('jsonwebtoken');
const { User, Board, BoardMember, Card, Column } = require('../models');

// JWT utilities
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
  });

  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

const verifyToken = (token, secret = process.env.JWT_SECRET || 'fallback-secret') => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    // Get user from database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });

    req.user = user && user.isActive ? user : null;
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

// Board permission middleware
const checkBoardPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const { boardId: boardIdParam, cardId, columnId } = req.params;
      const userId = req.user.id;

      // Resolve effective boardId from various sources
      let effectiveBoardId = boardIdParam;

      // From columnId in params
      if (!effectiveBoardId && columnId) {
        const col = await Column.findByPk(columnId);
        if (col) effectiveBoardId = col.boardId;
      }

      // From request body (common on create/update)
      if (!effectiveBoardId && req.body && req.body.boardId) {
        effectiveBoardId = req.body.boardId;
      }

      // From columnId/targetColumnId in body
      if (!effectiveBoardId && req.body && req.body.columnId) {
        const col = await Column.findByPk(req.body.columnId);
        if (col) effectiveBoardId = col.boardId;
      }
      if (!effectiveBoardId && req.body && req.body.targetColumnId) {
        const targetCol = await Column.findByPk(req.body.targetColumnId);
        if (targetCol) effectiveBoardId = targetCol.boardId;
      }

      // From cardId in params
      if (!effectiveBoardId && cardId) {
        const card = await Card.findByPk(cardId);
        if (card) effectiveBoardId = card.boardId;
      }

      if (!effectiveBoardId) {
        // If cardId specified but board not yet resolved, let route handler attempt resolution
        if (cardId) return next();
        return res.status(404).json({ success: false, message: 'Board not found' });
      }

      // Get board first
      const board = await Board.findByPk(effectiveBoardId);
      if (!board) {
        return res.status(404).json({ success: false, message: 'Board not found' });
      }

      // Owner shortcut
      if (board.ownerId === userId) {
        req.boardMembership = { role: 'owner', permissions: {} };
        return next();
      }

      // Load membership and check permission
      const membership = await BoardMember.findOne({ where: { boardId: effectiveBoardId, userId, isActive: true } });
      if (!membership) {
        return res.status(403).json({ success: false, message: 'Not a board member' });
      }

      if (permission && !(membership.permissions && membership.permissions[permission])) {
        return res.status(403).json({ success: false, message: `Insufficient permissions: ${permission} required` });
      }

      req.boardMembership = membership;
      return next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking board permissions'
      });
    }
  };
};

// Rate limiting for auth endpoints
const authRateLimit = (req, res, next) => {
  // Simple in-memory rate limiting (in production, use Redis)
  const key = `auth_${req.ip}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 50; // Increased for testing

  if (!global.rateLimitStore) {
    global.rateLimitStore = new Map();
  }

  const attempts = global.rateLimitStore.get(key) || [];
  const recentAttempts = attempts.filter(time => now - time < windowMs);

  if (recentAttempts.length >= maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again later.'
    });
  }

  recentAttempts.push(now);
  global.rateLimitStore.set(key, recentAttempts);

  next();
};

module.exports = {
  generateTokens,
  verifyToken,
  authenticate,
  optionalAuth,
  checkBoardPermission,
  authRateLimit
};
