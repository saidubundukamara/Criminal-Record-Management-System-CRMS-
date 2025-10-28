/**
 * Jest Test Setup
 *
 * Global test configuration and mocks
 */
import '@testing-library/jest-dom';

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock NextAuth config
jest.mock('@/lib/auth', () => ({
  authOptions: {},
}));

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging
  error: console.error,
};

// Set test timeout
jest.setTimeout(10000);
