/**
 * Database helper utilities
 */

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format (basic validation)
 */
function isValidPhone(phone) {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

/**
 * Sanitize string input
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
}

/**
 * Format user data for database insertion
 */
function formatUserData(userData) {
  return {
    first_name: sanitizeString(userData.first_name),
    last_name: sanitizeString(userData.last_name),
    email: userData.email ? userData.email.toLowerCase().trim() : null,
    phone: userData.phone ? sanitizeString(userData.phone) : null,
    country: userData.country ? sanitizeString(userData.country) : null
  };
}

/**
 * Generate pagination metadata
 */
function generatePaginationMeta(page, limit, totalCount) {
  const totalPages = Math.ceil(totalCount / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalCount,
    limit,
    hasNext,
    hasPrev,
    nextPage: hasNext ? page + 1 : null,
    prevPage: hasPrev ? page - 1 : null
  };
}

/**
 * Build search query for SQLite
 */
function buildSearchQuery(searchTerm) {
  if (!searchTerm) return { whereClause: '', params: [] };
  
  const term = `%${searchTerm}%`;
  const whereClause = `
    WHERE (
      first_name LIKE ? OR 
      last_name LIKE ? OR 
      email LIKE ? OR 
      country LIKE ?
    )
  `;
  
  return {
    whereClause,
    params: [term, term, term, term]
  };
}

/**
 * Error types for consistent error handling
 */
const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  DATABASE_ERROR: 'DATABASE_ERROR'
};

/**
 * Create custom error with type
 */
function createError(type, message, details = null) {
  const error = new Error(message);
  error.type = type;
  error.details = details;
  return error;
}

/**
 * Format database error for user-friendly response
 */
function formatDatabaseError(error) {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return createError(ErrorTypes.DUPLICATE_ENTRY, 'Email address already exists');
  }
  
  if (error.code === 'SQLITE_CONSTRAINT') {
    return createError(ErrorTypes.VALIDATION_ERROR, 'Invalid data provided');
  }
  
  return createError(ErrorTypes.DATABASE_ERROR, 'Database operation failed');
}

module.exports = {
  isValidEmail,
  isValidPhone,
  sanitizeString,
  formatUserData,
  generatePaginationMeta,
  buildSearchQuery,
  ErrorTypes,
  createError,
  formatDatabaseError
};