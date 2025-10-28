/**
 * Jest Configuration for CRMS
 *
 * Test configuration with TypeScript support and 80% coverage threshold
 * Pan-African Design: Ensures code quality across all country deployments
 */
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

/** @type {import('jest').Config} */
const config = {
  // Test environment
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).tsx',
  ],

  // Transform files with ts-jest
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
      },
    }],
  },

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'app/api/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/dist/**',
  ],

  // Coverage thresholds (80%)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Test timeout
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
    '/coverage/',
    '/dist/',
  ],

  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
}

module.exports = createJestConfig(config)
