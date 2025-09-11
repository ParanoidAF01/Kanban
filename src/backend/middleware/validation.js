const Joi = require('joi');

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    req[property] = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // User schemas
  register: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().min(8).max(128).required().messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 128 characters',
      'any.required': 'Password is required'
    }),
    firstName: Joi.string().min(1).max(50).required().messages({
      'string.min': 'First name is required',
      'string.max': 'First name must not exceed 50 characters',
      'any.required': 'First name is required'
    }),
    lastName: Joi.string().min(1).max(50).required().messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name must not exceed 50 characters',
      'any.required': 'Last name is required'
    }),
    avatar: Joi.string().uri().optional().allow('').messages({
      'string.uri': 'Avatar must be a valid URL'
    })
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required().messages({
      'any.required': 'Refresh token is required'
    })
  }),

  // Board schemas
  createBoard: Joi.object({
    name: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Board name is required',
      'string.max': 'Board name must not exceed 100 characters',
      'any.required': 'Board name is required'
    }),
    description: Joi.string().max(500).optional().allow('').messages({
      'string.max': 'Description must not exceed 500 characters'
    }),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().messages({
      'string.pattern.base': 'Color must be a valid hex color (e.g., #FF5733)'
    }),
    isPublic: Joi.boolean().optional().default(false)
  }),

  updateBoard: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(500).optional().allow(''),
    deadline: Joi.date().optional().allow(null, ''),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    isPublic: Joi.boolean().optional()
  }),

  // Column schemas
  createColumn: Joi.object({
    name: Joi.string().min(1).max(100).required().messages({
      'string.min': 'Column name is required',
      'string.max': 'Column name must not exceed 100 characters',
      'any.required': 'Column name is required'
    }),
    description: Joi.string().max(500).optional().allow('').messages({
      'string.max': 'Description must not exceed 500 characters'
    }),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional().messages({
      'string.pattern.base': 'Color must be a valid hex color (e.g., #FF5733)'
    }),
    position: Joi.number().integer().min(0).optional(),
    settings: Joi.object({
      allowNewCards: Joi.boolean().optional(),
      allowCardMovement: Joi.boolean().optional(),
      allowCardDeletion: Joi.boolean().optional(),
      showCardCount: Joi.boolean().optional(),
      showProgress: Joi.boolean().optional(),
      autoArchive: Joi.boolean().optional(),
      autoArchiveDays: Joi.number().integer().min(1).max(365).optional()
    }).optional()
  }),

  updateColumn: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(500).optional().allow(''),
    color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
    position: Joi.number().integer().min(0).optional(),
    isCollapsed: Joi.boolean().optional(),
    isArchived: Joi.boolean().optional(),
    settings: Joi.object({
      allowNewCards: Joi.boolean().optional(),
      allowCardMovement: Joi.boolean().optional(),
      allowCardDeletion: Joi.boolean().optional(),
      showCardCount: Joi.boolean().optional(),
      showProgress: Joi.boolean().optional(),
      autoArchive: Joi.boolean().optional(),
      autoArchiveDays: Joi.number().integer().min(1).max(365).optional()
    }).optional()
  }),

  // Card schemas
  createCard: Joi.object({
    title: Joi.string().min(1).max(200).required().messages({
      'string.min': 'Card title is required',
      'string.max': 'Card title must not exceed 200 characters',
      'any.required': 'Card title is required'
    }),
    description: Joi.string().max(2000).optional().allow('').messages({
      'string.max': 'Description must not exceed 2000 characters'
    }),
    columnId: Joi.string().uuid().required().messages({
      'string.guid': 'Column ID must be a valid UUID',
      'any.required': 'Column ID is required'
    }),
    position: Joi.number().integer().min(0).optional(),
    dueDate: Joi.date().iso().optional().messages({
      'date.format': 'Due date must be a valid ISO date'
    }),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    labels: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        name: Joi.string().required(),
        color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).required()
      })
    ).optional(),
    metadata: Joi.object({
      timeSpent: Joi.number().min(0).optional(),
      estimatedTime: Joi.number().min(0).optional(),
      storyPoints: Joi.number().integer().min(0).optional(),
      tags: Joi.string().optional()
    }).optional()
  }),

  updateCard: Joi.object({
    title: Joi.string().min(1).max(200).optional(),
    description: Joi.string().max(2000).optional().allow(''),
    position: Joi.number().integer().min(0).optional(),
    dueDate: Joi.date().iso().optional().allow(null).messages({
      'date.format': 'Due date must be a valid ISO date'
    }),
    isCompleted: Joi.boolean().optional(),
    isArchived: Joi.boolean().optional(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
    labels: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        name: Joi.string().required(),
        color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).required()
      })
    ).optional(),
    metadata: Joi.object({
      timeSpent: Joi.number().min(0).optional(),
      estimatedTime: Joi.number().min(0).optional(),
      storyPoints: Joi.number().integer().min(0).optional(),
      tags: Joi.string().optional()
    }).optional()
  }),

  // Query parameters
  pagination: Joi.object({
    page: Joi.number().integer().min(1).optional().default(1),
    limit: Joi.number().integer().min(1).max(100).optional().default(20),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'position', 'title', 'dueDate').optional().default('createdAt'),
    sortOrder: Joi.string().valid('ASC', 'DESC').optional().default('DESC')
  })
};

module.exports = {
  validate,
  schemas
};
