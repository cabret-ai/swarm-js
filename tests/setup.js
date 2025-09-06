// Test setup configuration
// This file runs before all tests

// Configure environment for tests
if (!process.env.OPENAI_API_KEY) {
  // Set a placeholder API key for tests that don't use mock clients
  // Real tests use MockOpenAIClient and don't make actual API calls
  process.env.OPENAI_API_KEY = "sk-test-placeholder-key-for-testing-only";
}

// Global test utilities
global.testWithRealAPI = process.env.TEST_WITH_REAL_API === 'true';

// Mock console.log for cleaner test output unless in verbose mode
if (!process.env.VERBOSE_TESTS) {
  const originalConsoleLog = console.log;
  global.originalConsoleLog = originalConsoleLog;
  console.log = jest.fn();
}

// Increase timeout for real API calls
jest.setTimeout(30000);