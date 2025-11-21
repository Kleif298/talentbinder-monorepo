/**
 * Jest Test Setup
 * Runs before all tests to configure the test environment
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.PORT = '4001';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'talentbinder_test';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.LDAP_URL = 'ldap://test-ldap-server';
process.env.FRONTEND_URL = 'http://localhost:3022';

// Mock console methods to reduce noise during tests (optional)
global.console = {
    ...console,
    log: jest.fn(), // Suppress logs during tests
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(), // Keep error for debugging
};

// Set timezone for consistent date handling
process.env.TZ = 'UTC';

// Increase test timeout for integration tests
jest.setTimeout(10000);
