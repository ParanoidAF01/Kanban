const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { generateTokens, verifyToken, authRateLimit } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const { asyncHandler, UnauthorizedError, ConflictError, NotFoundError } = require('../middleware/errorHandler');
const emailService = require('../services/emailService');

const router = express.Router();

// Register new user
router.post('/register', 
  authRateLimit,
  validate(schemas.register),
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, avatar } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Create user (password will be hashed by User model hook)
    const user = await User.create({
      email,
      password, // Will be automatically hashed by beforeCreate hook
      firstName,
      lastName,
      avatar: avatar || null,
      isEmailVerified: false, // In production, implement email verification
      isActive: true
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    // Send welcome email (don't wait for it)
    emailService.sendWelcomeEmail(user).catch(err => 
      console.error('Failed to send welcome email:', err)
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  })
);

// Login user
router.post('/login',
  authRateLimit,
  validate(schemas.login),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user with password
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        tokens: {
          accessToken,
          refreshToken
        }
      }
    });
  })
);

// Refresh access token
router.post('/refresh',
  validate(schemas.refreshToken),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    try {
      // Verify refresh token
      const decoded = verifyToken(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
      
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Get user
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive');
      }

      // Generate new tokens
      const tokens = generateTokens(user);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens
        }
      });
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  })
);

// Get current user profile
router.get('/me',
  asyncHandler(async (req, res) => {
    // This route should be protected by authenticate middleware
    const user = req.user;

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified,
          isActive: user.isActive,
          preferences: user.preferences,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          lastLoginAt: user.lastLoginAt
        }
      }
    });
  })
);

module.exports = router;
