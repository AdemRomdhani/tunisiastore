// Mock the uuid module for testing
module.exports = {
  v4: jest.fn(() => 'test-uuid-' + Date.now()),
  v1: jest.fn(() => 'test-uuid-v1-' + Date.now()),
  v3: jest.fn(() => 'test-uuid-v3-' + Date.now()),
  v5: jest.fn(() => 'test-uuid-v5-' + Date.now()),
  validate: jest.fn(() => true), // uuid.validate
  version: jest.fn(() => 4), // uuid.version
  parse: jest.fn(),
  stringify: jest.fn(),
  NIL: '00000000-0000-0000-0000-000000000000'
};
