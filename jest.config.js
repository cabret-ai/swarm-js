/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/examples'],
  testMatch: [
    '**/__tests__/**/*.ts', 
    '**/*.(test|spec).ts',
    '**/__tests__/**/*.js', 
    '**/*.(test|spec).js'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testTimeout: 30000, // 30 second timeout for real API calls
  forceExit: true, // Force exit after tests complete to handle async resources
};