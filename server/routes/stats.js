const express = require('express');
const User = require('../models/User');
const { ErrorTypes } = require('../utils/helpers');

const router = express.Router();

/**
 * Async error handler wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * GET /api/stats - Get user statistics
 */
router.get('/', asyncHandler(async (req, res) => {
  const stats = await User.getStats();

  // Calculate additional statistics
  const totalCountries = Object.keys(stats.usersByCountry).length;
  const averageUsersPerCountry = totalCountries > 0 ? 
    Math.round(stats.totalUsers / totalCountries * 100) / 100 : 0;

  // Get top 5 countries by user count
  const topCountries = Object.entries(stats.usersByCountry)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([country, count]) => ({ country, count }));

  res.json({
    success: true,
    message: 'Statistics retrieved successfully',
    data: {
      totalUsers: stats.totalUsers,
      totalCountries,
      averageUsersPerCountry,
      usersByCountry: stats.usersByCountry,
      topCountries,
      recentRegistrations: stats.recentRegistrations,
      lastUpdated: new Date().toISOString()
    }
  });
}));

/**
 * GET /api/stats/countries - Get detailed country statistics
 */
router.get('/countries', asyncHandler(async (req, res) => {
  const stats = await User.getStats();
  
  // Convert to array format with percentages
  const countryStats = Object.entries(stats.usersByCountry)
    .map(([country, count]) => ({
      country,
      count,
      percentage: Math.round((count / stats.totalUsers) * 100 * 100) / 100
    }))
    .sort((a, b) => b.count - a.count);

  res.json({
    success: true,
    message: 'Country statistics retrieved successfully',
    data: {
      totalCountries: countryStats.length,
      countries: countryStats
    }
  });
}));

/**
 * GET /api/stats/recent - Get recent registrations
 */
router.get('/recent', asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const stats = await User.getStats();

  res.json({
    success: true,
    message: 'Recent registrations retrieved successfully',
    data: {
      recentRegistrations: stats.recentRegistrations.slice(0, limit),
      count: Math.min(stats.recentRegistrations.length, limit)
    }
  });
}));

/**
 * Error handling middleware for this router
 */
router.use((error, req, res, next) => {
  console.error('Stats route error:', error);

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