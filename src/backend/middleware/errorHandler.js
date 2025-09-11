const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden access') {
    super(message, 403);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
  }
}

class CustomValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400);
    this.errors = errors;
  }
}

// Error response formatter
const formatErrorResponse = (err, req) => {
  const response = {
    success: false,
    message: err.message || 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err.details || {};
  }

  // Add validation errors if present
  if (err.errors && Array.isArray(err.errors)) {
    response.errors = err.errors;
  }

  return response;
};

// Main error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Sequelize validation errors
  if (err instanceof ValidationError) {
    const message = err.errors.map(e => e.message).join(', ');
    error = new CustomValidationError(message, err.errors);
  }

  // Sequelize unique constraint errors
  if (err instanceof UniqueConstraintError) {
    const field = err.errors[0]?.path || 'field';
    const message = `${field} already exists`;
    error = new ConflictError(message);
  }

  // Sequelize foreign key constraint errors
  if (err instanceof ForeignKeyConstraintError) {
    const message = 'Referenced resource does not exist';
    error = new CustomValidationError(message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new UnauthorizedError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new UnauthorizedError('Token expired');
  }

  // Default to 500 server error
  if (!error.statusCode) {
    error.statusCode = 500;
  }

  const response = formatErrorResponse(error, req);
  res.status(error.statusCode).json(response);
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  next(error);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError: CustomValidationError,
  errorHandler,
  notFoundHandler,
  asyncHandler
};
