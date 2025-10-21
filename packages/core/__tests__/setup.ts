/**
 * Jest test setup file
 * Global configurations and mocks for all tests
 */

import { jest, afterEach, beforeAll, afterAll } from '@jest/globals';

// Mock fetch globally for integration tests
global.fetch = jest.fn() as any;

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Suppress console logs in tests unless there's an error
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((...args: any[]) => {
    if (process.env.DEBUG) {
      originalConsoleError(...args);
    }
  }) as any;
  console.warn = jest.fn((...args: any[]) => {
    if (process.env.DEBUG) {
      originalConsoleWarn(...args);
    }
  }) as any;
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
