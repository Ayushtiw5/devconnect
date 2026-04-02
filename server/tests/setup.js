const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Use in-memory MongoDB for tests
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Set env vars for test environment
  process.env.MONGO_URI = mongoUri;
  process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long';
  process.env.NODE_ENV = 'test';
  
  // Connect to in-memory database
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  await mongoose.connect(mongoUri);
});

// Cleanup after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
