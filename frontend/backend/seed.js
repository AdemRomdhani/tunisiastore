const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Create test users
    const users = [
      {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@test.com',
        password: 'admin123',
        phone: '21234567',
        role: 'admin',
        isVerified: true
      },
      {
        firstName: 'Test',
        lastName: 'Customer',
        email: 'test@test.com',
        password: 'test123',
        phone: '29999999',
        role: 'customer',
        isVerified: true
      }
    ];

    for (const userData of users) {
      const existing = await User.findOne({ email: userData.email });
      if (!existing) {
        const user = await User.create(userData);
        console.log(`✅ Created: ${user.email} (${user.role})`);
      } else {
        console.log(`⚠️  Already exists: ${existing.email}`);
      }
    }

    console.log('\n📝 Test Credentials:');
    console.log('   Admin:  admin@test.com / admin123');
    console.log('   Customer: test@test.com / test123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seed();