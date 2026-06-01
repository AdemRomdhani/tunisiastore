const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongod;

// Set up MongoDB Memory Server before all tests
beforeAll(async () => {
  if (!process.env.MONGODB_URI || process.env.NODE_ENV === 'test') {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGODB_URI = uri;
  }
});

// Clean up after all tests
afterAll(async () => {
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
});
