const database = require('../config/database');
const { 
  isValidEmail, 
  isValidPhone, 
  formatUserData, 
  generatePaginationMeta, 
  buildSearchQuery,
  ErrorTypes,
  createError,
  formatDatabaseError 
} = require('../utils/helpers');

/**
 * User Model - Data Access Layer
 * Handles all database operations for users
 */
class User {
  
  /**
   * Initialize database connection
   */
  static async init() {
    if (!database.getDatabase()) {
      await database.connect();
      await database.initializeSchema();
    }
  }

  /**
   * Validate user data before database operations
   */
  static validateUserData(userData, isUpdate = false) {
    const errors = {};

    // Required fields for creation
    if (!isUpdate) {
      if (!userData.first_name || userData.first_name.trim().length < 2) {
        errors.first_name = 'First name must be at least 2 characters long';
      }
      
      if (!userData.last_name || userData.last_name.trim().length < 2) {
        errors.last_name = 'Last name must be at least 2 characters long';
      }
      
      if (!userData.email || !isValidEmail(userData.email)) {
        errors.email = 'Valid email address is required';
      }
    } else {
      // For updates, only validate provided fields
      if (userData.first_name !== undefined && userData.first_name.trim().length < 2) {
        errors.first_name = 'First name must be at least 2 characters long';
      }
      
      if (userData.last_name !== undefined && userData.last_name.trim().length < 2) {
        errors.last_name = 'Last name must be at least 2 characters long';
      }
      
      if (userData.email !== undefined && !isValidEmail(userData.email)) {
        errors.email = 'Valid email address is required';
      }
    }

    // Optional field validation
    if (userData.phone && !isValidPhone(userData.phone)) {
      errors.phone = 'Invalid phone number format';
    }

    if (userData.first_name && userData.first_name.length > 50) {
      errors.first_name = 'First name cannot exceed 50 characters';
    }

    if (userData.last_name && userData.last_name.length > 50) {
      errors.last_name = 'Last name cannot exceed 50 characters';
    }

    if (userData.country && userData.country.length > 50) {
      errors.country = 'Country cannot exceed 50 characters';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Create a new user
   */
  static async create(userData) {
    await this.init();

    const validation = this.validateUserData(userData);
    if (!validation.isValid) {
      throw createError(ErrorTypes.VALIDATION_ERROR, 'Validation failed', validation.errors);
    }

    const formattedData = formatUserData(userData);
    
    const sql = `
      INSERT INTO users (first_name, last_name, email, phone, country)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      const result = await database.run(sql, [
        formattedData.first_name,
        formattedData.last_name,
        formattedData.email,
        formattedData.phone,
        formattedData.country
      ]);

      return await this.findById(result.id);
    } catch (error) {
      throw formatDatabaseError(error);
    }
  }

  /**
   * Find all users with pagination
   */
  static async findAll(page = 1, limit = 10) {
    await this.init();

    const offset = (page - 1) * limit;
    
    // Get total count
    const countSql = 'SELECT COUNT(*) as total FROM users';
    const countResult = await database.get(countSql);
    const totalCount = countResult.total;

    // Get users
    const sql = `
      SELECT * FROM users 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    try {
      const users = await database.all(sql, [limit, offset]);
      const pagination = generatePaginationMeta(page, limit, totalCount);

      return {
        users,
        pagination
      };
    } catch (error) {
      throw formatDatabaseError(error);
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    await this.init();

    if (!id || isNaN(id)) {
      throw createError(ErrorTypes.VALIDATION_ERROR, 'Valid user ID is required');
    }

    const sql = 'SELECT * FROM users WHERE id = ?';
    
    try {
      const user = await database.get(sql, [id]);
      
      if (!user) {
        throw createError(ErrorTypes.NOT_FOUND, 'User not found');
      }

      return user;
    } catch (error) {
      if (error.type) throw error;
      throw formatDatabaseError(error);
    }
  }

  /**
   * Update user by ID
   */
  static async update(id, userData) {
    await this.init();

    if (!id || isNaN(id)) {
      throw createError(ErrorTypes.VALIDATION_ERROR, 'Valid user ID is required');
    }

    // Check if user exists
    await this.findById(id);

    const validation = this.validateUserData(userData, true);
    if (!validation.isValid) {
      throw createError(ErrorTypes.VALIDATION_ERROR, 'Validation failed', validation.errors);
    }

    const formattedData = formatUserData(userData);
    
    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];

    Object.keys(formattedData).forEach(key => {
      if (formattedData[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(formattedData[key]);
      }
    });

    if (updateFields.length === 0) {
      throw createError(ErrorTypes.VALIDATION_ERROR, 'No valid fields to update');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);

    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    try {
      await database.run(sql, updateValues);
      return await this.findById(id);
    } catch (error) {
      throw formatDatabaseError(error);
    }
  }

  /**
   * Delete user by ID
   */
  static async delete(id) {
    await this.init();

    if (!id || isNaN(id)) {
      throw createError(ErrorTypes.VALIDATION_ERROR, 'Valid user ID is required');
    }

    // Check if user exists
    const user = await this.findById(id);

    const sql = 'DELETE FROM users WHERE id = ?';

    try {
      const result = await database.run(sql, [id]);
      
      if (result.changes === 0) {
        throw createError(ErrorTypes.NOT_FOUND, 'User not found');
      }

      return { deleted: true, user };
    } catch (error) {
      if (error.type) throw error;
      throw formatDatabaseError(error);
    }
  }

  /**
   * Search users by query string
   */
  static async search(query, page = 1, limit = 10) {
    await this.init();

    if (!query || query.trim().length === 0) {
      return await this.findAll(page, limit);
    }

    const offset = (page - 1) * limit;
    const { whereClause, params } = buildSearchQuery(query.trim());

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await database.get(countSql, params);
    const totalCount = countResult.total;

    // Get users
    const sql = `
      SELECT * FROM users 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    try {
      const users = await database.all(sql, [...params, limit, offset]);
      const pagination = generatePaginationMeta(page, limit, totalCount);

      return {
        users,
        pagination,
        query
      };
    } catch (error) {
      throw formatDatabaseError(error);
    }
  }

  /**
   * Find users by country
   */
  static async findByCountry(country, page = 1, limit = 10) {
    await this.init();

    if (!country || country.trim().length === 0) {
      throw createError(ErrorTypes.VALIDATION_ERROR, 'Country name is required');
    }

    const offset = (page - 1) * limit;

    // Get total count
    const countSql = 'SELECT COUNT(*) as total FROM users WHERE country = ?';
    const countResult = await database.get(countSql, [country]);
    const totalCount = countResult.total;

    // Get users
    const sql = `
      SELECT * FROM users 
      WHERE country = ?
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    try {
      const users = await database.all(sql, [country, limit, offset]);
      const pagination = generatePaginationMeta(page, limit, totalCount);

      return {
        users,
        pagination,
        country
      };
    } catch (error) {
      throw formatDatabaseError(error);
    }
  }

  /**
   * Get user statistics
   */
  static async getStats() {
    await this.init();

    try {
      // Total users
      const totalResult = await database.get('SELECT COUNT(*) as total FROM users');
      const totalUsers = totalResult.total;

      // Users by country
      const countrySql = `
        SELECT country, COUNT(*) as count 
        FROM users 
        WHERE country IS NOT NULL 
        GROUP BY country 
        ORDER BY count DESC
      `;
      const usersByCountry = await database.all(countrySql);

      // Recent registrations (last 7 days)
      const recentSql = `
        SELECT * FROM users 
        WHERE created_at >= datetime('now', '-7 days')
        ORDER BY created_at DESC 
        LIMIT 10
      `;
      const recentRegistrations = await database.all(recentSql);

      return {
        totalUsers,
        usersByCountry: usersByCountry.reduce((acc, item) => {
          acc[item.country] = item.count;
          return acc;
        }, {}),
        recentRegistrations
      };
    } catch (error) {
      throw formatDatabaseError(error);
    }
  }
}

module.exports = User;