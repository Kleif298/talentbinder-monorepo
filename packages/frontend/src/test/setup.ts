import '@testing-library/jest-dom';
import { expect, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import { server } from './server';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  // Start MSW server before all tests
  server.listen({ onUnhandledRequest: 'bypass' });
  
  // Suppress specific console errors that are expected in tests
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    // Suppress known test-related errors
    if (
      message.includes('Error fetching user data') ||
      message.includes('ECONNREFUSED') ||
      message.includes('Not implemented: HTMLFormElement.prototype.requestSubmit')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Close MSW server after all tests
afterAll(() => {
  server.close();
  console.error = originalError;
});
