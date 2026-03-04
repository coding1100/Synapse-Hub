const base = require('./jest.config');

module.exports = {
  ...base,
  testMatch: ['<rootDir>/tests/integration/**/*.spec.ts'],
};