const User = require('../models/User');

/**
 * Simple test script to verify User model functionality
 * This is a basic test to ensure the model works before implementing full unit tests
 */
async function testUserModel() {
  console.log('🧪 Testing User Model...\n');

  try {
    // Test 1: Get all users
    console.log('1. Testing findAll()...');
    const allUsers = await User.findAll(1, 5);
    console.log(`✅ Found ${allUsers.users.length} users`);
    console.log(`   Pagination: Page ${allUsers.pagination.currentPage} of ${allUsers.pagination.totalPages}`);

    // Test 2: Get user by ID
    console.log('\n2. Testing findById()...');
    if (allUsers.users.length > 0) {
      const userId = allUsers.users[0].id;
      const user = await User.findById(userId);
      console.log(`✅ Found user: ${user.first_name} ${user.last_name} (${user.email})`);
    }

    // Test 3: Search users
    console.log('\n3. Testing search()...');
    const searchResults = await User.search('john', 1, 5);
    console.log(`✅ Search for 'john' returned ${searchResults.users.length} results`);

    // Test 4: Get stats
    console.log('\n4. Testing getStats()...');
    const stats = await User.getStats();
    console.log(`✅ Total users: ${stats.totalUsers}`);
    console.log(`   Countries: ${Object.keys(stats.usersByCountry).length}`);
    console.log(`   Recent registrations: ${stats.recentRegistrations.length}`);

    // Test 5: Create new user
    console.log('\n5. Testing create()...');
    const newUserData = {
      first_name: 'Test',
      last_name: 'User',
      email: `test.user.${Date.now()}@example.com`,
      phone: '+1-555-0199',
      country: 'Test Country'
    };
    
    const newUser = await User.create(newUserData);
    console.log(`✅ Created user: ${newUser.first_name} ${newUser.last_name} (ID: ${newUser.id})`);

    // Test 6: Update user
    console.log('\n6. Testing update()...');
    const updatedUser = await User.update(newUser.id, {
      first_name: 'Updated Test',
      country: 'Updated Country'
    });
    console.log(`✅ Updated user: ${updatedUser.first_name} ${updatedUser.last_name}`);

    // Test 7: Find by country
    console.log('\n7. Testing findByCountry()...');
    const countryUsers = await User.findByCountry('Updated Country');
    console.log(`✅ Found ${countryUsers.users.length} users in 'Updated Country'`);

    // Test 8: Delete user
    console.log('\n8. Testing delete()...');
    const deleteResult = await User.delete(newUser.id);
    console.log(`✅ Deleted user: ${deleteResult.user.first_name} ${deleteResult.user.last_name}`);

    console.log('\n🎉 All User Model tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.details) {
      console.error('   Details:', error.details);
    }
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testUserModel();
}

module.exports = { testUserModel };