const base = require('./jest.config');

module.exports = {
  ...base,
  testMatch: ['<rootDir>/tests/unit/**/*.spec.ts'],
  collectCoverage: true,
  collectCoverageFrom: [
    'packages/shared/src/pagination.ts',
    'services/workspace-service/src/bots/command-runner.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
