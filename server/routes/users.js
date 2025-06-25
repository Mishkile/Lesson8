const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const User = require('../models/User');
const { ErrorTypes } = require('../utils/helpers');

const router = express.Router();

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().reduce((acc, error) => {
        acc[error.path] = error.msg;
        return acc;
      }, {})
    });
  }
  next();
};

/**
 * Async error handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * GET /api/users - Get all users with pagination
 */
router.get('/', 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await User.findAll(page, limit);

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: result.users,
      pagination: result.pagination
    });
  })
);

/**
 * GET /api/users/search - Search users
 */
router.get('/search',
  [
    query('q').notEmpty().withMessage('Search query is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const query = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await User.search(query, page, limit);

    res.json({
      success: true,
      message: `Search results for "${query}"`,
      data: result.users,
      pagination: result.pagination,
      query: result.query
    });
  })
);

/**
 * GET /api/users/country/:country - Get users by country
 */
router.get('/country/:country',
  [
    param('country').notEmpty().withMessage('Country parameter is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const country = req.params.country;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await User.findByCountry(country, page, limit);

    res.json({
      success: true,
      message: `Users from ${country}`,
      data: result.users,
      pagination: result.pagination,
      country: result.country
    });
  })
);

/**
 * GET /api/users/:id - Get user by ID
 */
router.get('/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Valid user ID is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const user = await User.findById(userId);

    res.json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  })
);

/**
 * POST /api/users - Create new user
 */
router.post('/',
  [
    body('first_name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('last_name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email address is required'),
    body('phone')
      .optional()
      .isMobilePhone('any', { strictMode: false })
      .withMessage('Invalid phone number format'),
    body('country')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Country cannot exceed 50 characters')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const userData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      phone: req.body.phone,
      country: req.body.country
    };

    const newUser = await User.create(userData);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  })
);

/**
 * PUT /api/users/:id - Update user
 */
router.put('/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Valid user ID is required'),
    body('first_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be between 2 and 50 characters'),
    body('last_name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be between 2 and 50 characters'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email address is required'),
    body('phone')
      .optional()
      .isMobilePhone('any', { strictMode: false })
      .withMessage('Invalid phone number format'),
    body('country')
      .optional()
      .isLength({ max: 50 })
      .withMessage('Country cannot exceed 50 characters')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const userData = {};

    // Only include provided fields
    if (req.body.first_name !== undefined) userData.first_name = req.body.first_name;
    if (req.body.last_name !== undefined) userData.last_name = req.body.last_name;
    if (req.body.email !== undefined) userData.email = req.body.email;
    if (req.body.phone !== undefined) userData.phone = req.body.phone;
    if (req.body.country !== undefined) userData.country = req.body.country;

    const updatedUser = await User.update(userId, userData);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  })
);

/**
 * DELETE /api/users/:id - Delete user
 */
router.delete('/:id',
  [
    param('id').isInt({ min: 1 }).withMessage('Valid user ID is required')
  ],
  handleValidationErrors,
  asyncHandler(async (req, res) => {
    const userId = parseInt(req.params.id);
    const result = await User.delete(userId);

    res.json({
      success: true,
      message: 'User deleted successfully',
      data: result
    });
  })
);

/**
 * Error handling middleware for this router
 */
router.use((error, req, res, next) => {
  console.error('Users route error:', error);

  // Handle custom application errors
  if (error.type) {
    const statusCodes = {
      [ErrorTypes.VALIDATION_ERROR]: 400,
      [ErrorTypes.NOT_FOUND]: 404,
      [ErrorTypes.DUPLICATE_ENTRY]: 409,
      [ErrorTypes.DATABASE_ERROR]: 500
    };

    const statusCode = statusCodes[error.type] || 500;

    return res.status(statusCode).json({
      success: false,
      error: error.message,
      ...(error.details && { details: error.details })
    });
  }

  // Handle other errors
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

module.exports = router;