const request = require('supertest');
const app = require('../app');

/**
 * Simple API test script to verify routes functionality
 * This runs basic tests on all API endpoints
 */
async function testAPI() {
  console.log('🧪 Testing API Routes...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await request(app)
      .get('/api/health')
      .expect(200);
    console.log(`✅ Health check: ${healthResponse.body.status}`);

    // Test 2: Get all users
    console.log('\n2. Testing GET /api/users...');
    const usersResponse = await request(app)
      .get('/api/users')
      .expect(200);
    console.log(`✅ Found ${usersResponse.body.data.length} users`);

    // Test 3: Get user statistics
    console.log('\n3. Testing GET /api/stats...');
    const statsResponse = await request(app)
      .get('/api/stats')
      .expect(200);
    console.log(`✅ Total users: ${statsResponse.body.data.totalUsers}`);
    console.log(`   Total countries: ${statsResponse.body.data.totalCountries}`);

    // Test 4: Create new user
    console.log('\n4. Testing POST /api/users...');
    const newUser = {
      first_name: 'API',
      last_name: 'Test',
      email: `api.test.${Date.now()}@example.com`,
      phone: '+1-555-0123',
      country: 'Test Country'
    };

    const createResponse = await request(app)
      .post('/api/users')
      .send(newUser)
      .expect(201);
    
    const createdUser = createResponse.body.data;
    console.log(`✅ Created user: ${createdUser.first_name} ${createdUser.last_name} (ID: ${createdUser.id})`);

    // Test 5: Get user by ID
    console.log('\n5. Testing GET /api/users/:id...');
    const userResponse = await request(app)
      .get(`/api/users/${createdUser.id}`)
      .expect(200);
    console.log(`✅ Retrieved user: ${userResponse.body.data.email}`);

    // Test 6: Update user
    console.log('\n6. Testing PUT /api/users/:id...');
    const updateResponse = await request(app)
      .put(`/api/users/${createdUser.id}`)
      .send({ first_name: 'Updated API' })
      .expect(200);
    console.log(`✅ Updated user: ${updateResponse.body.data.first_name}`);

    // Test 7: Search users
    console.log('\n7. Testing GET /api/users/search...');
    const searchResponse = await request(app)
      .get('/api/users/search?q=Updated')
      .expect(200);
    console.log(`✅ Search results: ${searchResponse.body.data.length} users found`);

    // Test 8: Get users by country
    console.log('\n8. Testing GET /api/users/country/:country...');
    const countryResponse = await request(app)
      .get('/api/users/country/Test%20Country')
      .expect(200);
    console.log(`✅ Users in Test Country: ${countryResponse.body.data.length}`);

    // Test 9: Delete user
    console.log('\n9. Testing DELETE /api/users/:id...');
    const deleteResponse = await request(app)
      .delete(`/api/users/${createdUser.id}`)
      .expect(200);
    console.log(`✅ Deleted user: ${deleteResponse.body.data.user.email}`);

    // Test 10: Test validation errors
    console.log('\n10. Testing validation errors...');
    const errorResponse = await request(app)
      .post('/api/users')
      .send({ first_name: 'A' }) // Too short
      .expect(400);
    console.log(`✅ Validation error handled: ${errorResponse.body.error}`);

    // Test 11: Test 404 error
    console.log('\n11. Testing 404 error...');
    const notFoundResponse = await request(app)
      .get('/api/users/99999')
      .expect(404);
    console.log(`✅ 404 error handled: ${notFoundResponse.body.error}`);

    console.log('\n🎉 All API tests passed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('   Response:', error.response.body);
    }
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  testAPI().then(() => {
    process.exit(0);
  });
}

module.exports = { testAPI };