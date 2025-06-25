const database = require('../config/database');

/**
 * Database initialization script
 * This script creates the database schema and seeds with sample data
 */
async function initializeDatabase() {
  try {
    console.log('🚀 Starting database initialization...');
    
    // Connect to database
    await database.connect();
    
    // Initialize schema
    await database.initializeSchema();
    
    // Seed with sample data
    await seedSampleData();
    
    console.log('✅ Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

/**
 * Seed database with sample data
 */
async function seedSampleData() {
  const sampleUsers = [
    {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1-555-0123',
      country: 'United States'
    },
    {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+44-20-7946-0958',
      country: 'United Kingdom'
    },
    {
      first_name: 'Pierre',
      last_name: 'Dubois',
      email: 'pierre.dubois@example.com',
      phone: '+33-1-42-86-83-26',
      country: 'France'
    },
    {
      first_name: 'Maria',
      last_name: 'Garcia',
      email: 'maria.garcia@example.com',
      phone: '+34-91-123-4567',
      country: 'Spain'
    },
    {
      first_name: 'Hans',
      last_name: 'Mueller',
      email: 'hans.mueller@example.com',
      phone: '+49-30-12345678',
      country: 'Germany'
    },
    {
      first_name: 'Yuki',
      last_name: 'Tanaka',
      email: 'yuki.tanaka@example.com',
      phone: '+81-3-1234-5678',
      country: 'Japan'
    },
    {
      first_name: 'Ahmed',
      last_name: 'Hassan',
      email: 'ahmed.hassan@example.com',
      phone: '+20-2-1234-5678',
      country: 'Egypt'
    },
    {
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1-416-555-0199',
      country: 'Canada'
    }
  ];

  console.log('📝 Seeding sample data...');
  
  // Check if data already exists
  const existingUsers = await database.all('SELECT COUNT(*) as count FROM users');
  
  if (existingUsers[0].count > 0) {
    console.log('ℹ️  Sample data already exists, skipping seed...');
    return;
  }

  const insertUserSql = `
    INSERT INTO users (first_name, last_name, email, phone, country)
    VALUES (?, ?, ?, ?, ?)
  `;

  for (const user of sampleUsers) {
    try {
      await database.run(insertUserSql, [
        user.first_name,
        user.last_name,
        user.email,
        user.phone,
        user.country
      ]);
    } catch (error) {
      console.error(`Error inserting user ${user.email}:`, error);
    }
  }

  console.log(`✅ Seeded ${sampleUsers.length} sample users`);
}

/**
 * Reset database (drop all tables and recreate)
 */
async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    await database.connect();
    
    // Drop existing tables
    await database.run('DROP TABLE IF EXISTS users');
    
    // Recreate schema
    await database.initializeSchema();
    
    // Seed data
    await seedSampleData();
    
    console.log('✅ Database reset completed!');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// Check if this script is being run directly
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'reset':
      resetDatabase();
      break;
    default:
      initializeDatabase();
      break;
  }
}

module.exports = {
  initializeDatabase,
  resetDatabase,
  seedSampleData
};