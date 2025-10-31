# CRMS Testing Guide

**Version:** 1.0.0
**Last Updated:** October 31, 2025
**Phase:** 11 - Testing & QA

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Test Infrastructure](#test-infrastructure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Coverage](#test-coverage)
6. [Continuous Integration](#continuous-integration)
7. [Best Practices](#best-practices)

---

## Overview

CRMS uses a comprehensive testing strategy across three layers:

### Test Pyramid

```
          /\
         /  \    E2E Tests (Playwright)
        /    \   - Critical user flows
       /      \  - Cross-browser compatibility
      /--------\
     /          \
    / Integration\ API Integration Tests (Jest)
   /    Tests     \- API routes
  /                \- Database interactions
 /------------------\
/                    \
/   Unit Tests        \ Unit Tests (Jest)
- Services            - Repositories
- Utilities           - Domain logic
```

### Test Types

| Type | Tool | Count | Coverage Target |
|------|------|-------|-----------------|
| **Unit Tests** | Jest | 11 files | 85%+ |
| **Integration Tests** | Jest | 3 files | 80%+ |
| **E2E Tests** | Playwright | 2 files | Critical paths |
| **Performance Audits** | Lighthouse | Automated | 90+/100/100/100/100 |

---

## Test Infrastructure

### Tools & Frameworks

#### Jest (Unit & Integration Tests)
- **Version:** 30.2.0
- **Configuration:** `jest.config.js`
- **Coverage Threshold:** 80% (branches, functions, lines, statements)
- **Setup File:** `tests/setup.ts`

**Key Features:**
- TypeScript support via `ts-jest`
- Module path aliases (`@/`)
- Coverage reports (text, lcov, HTML)
- Parallel test execution

#### Playwright (E2E Tests)
- **Version:** 1.56.1
- **Configuration:** `playwright.config.ts`
- **Browser Profiles:** 5 (Desktop Chrome/Firefox/Safari, Mobile Chrome/Safari)

**Key Features:**
- Video recording on failure
- Screenshot capture
- Network interception
- Multi-browser testing

#### Lighthouse (Performance Audits)
- **Script:** `scripts/lighthouse-audit.js`
- **Configurations:** Desktop, Mobile 4G/3G/2G
- **Reports:** HTML + JSON summary

---

## Running Tests

### Quick Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E in headedmode (see browser)
npm run test:e2e -- --headed

# Run specific test file
npm test -- AnalyticsService.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should authenticate"

# Run Lighthouse audits
node scripts/lighthouse-audit.js
```

### Development Workflow

1. **Write test first** (TDD approach)
2. **Run in watch mode**: `npm run test:watch`
3. **Implement feature** until test passes
4. **Check coverage**: `npm run test:coverage`
5. **Run E2E tests**: `npm run test:e2e`
6. **Commit** when all tests pass

---

## Writing Tests

### Unit Tests (Services)

**Location:** `tests/unit/services/`

**Pattern:**
```typescript
import { ServiceName } from '@/src/services/ServiceName';
import { IRepository } from '@/src/domain/interfaces/repositories/IRepository';

// Mock repositories
const mockRepo = {
  findById: jest.fn(),
  create: jest.fn(),
  // ... other methods
} as jest.Mocked<IRepository>;

describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    service = new ServiceName(mockRepo);
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something with valid input', async () => {
      // Arrange
      const input = { /* test data */ };
      mockRepo.findById.mockResolvedValue(/* mock data */);

      // Act
      const result = await service.methodName(input);

      // Assert
      expect(result).toBeDefined();
      expect(mockRepo.findById).toHaveBeenCalledWith(/* expected args */);
    });

    it('should throw error for invalid input', async () => {
      // Arrange
      const invalidInput = { /* invalid data */ };

      // Act & Assert
      await expect(service.methodName(invalidInput)).rejects.toThrow('Error message');
    });
  });
});
```

**Example:** See `tests/unit/services/AnalyticsService.test.ts`

### Integration Tests (API Routes)

**Location:** `tests/integration/api/`

**Pattern:**
```typescript
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/route-name/route';
import { getServerSession } from 'next-auth';

// Mock next-auth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock container
jest.mock('@/src/di/container', () => ({
  container: {
    serviceName: {
      methodName: jest.fn(),
    },
  },
}));

describe('/api/route-name', () => {
  const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/route-name', () => {
    it('should return data for authenticated user', async () => {
      // Arrange
      const mockSession = {
        user: {
          id: 'officer-123',
          role: 'Officer',
        },
      };

      mockGetServerSession.mockResolvedValue(mockSession as any);
      // Mock service response

      const request = new NextRequest('http://localhost:3000/api/route-name');

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toBeDefined();
    });

    it('should return 401 for unauthenticated users', async () => {
      // Arrange
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/route-name');

      // Act
      const response = await GET(request);

      // Assert
      expect(response.status).toBe(401);
    });
  });
});
```

**Example:** See `tests/integration/api/performance.test.ts`

### E2E Tests (User Flows)

**Location:** `tests/e2e/`

**Pattern:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Login or setup
    await page.goto('/login');
    await page.fill('input[name="badge"]', 'SA-00001');
    await page.fill('input[name="pin"]', '12345678');
    await page.click('button[type="submit"]');
  });

  test('should perform action successfully', async ({ page }) => {
    // Act
    await page.goto('/feature-page');
    await page.click('button:has-text("Action")');

    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Arrange - Simulate error condition

    // Act
    await page.goto('/feature-page');

    // Assert
    await expect(page.locator('text=Error')).toBeVisible();
  });
});
```

**Example:** See `tests/e2e/auth/login.spec.ts`

---

## Test Coverage

### Current Coverage (Phase 11)

| Category | Files | Lines | Coverage |
|----------|-------|-------|----------|
| **Services** | 11 | ~2,400 | Target: 85%+ |
| **Libraries** | 2 | ~600 | Target: 80%+ |
| **API Routes** | 3 | ~500 | Target: 80%+ |
| **E2E Flows** | 2 | Critical paths | ✅ Complete |

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Requirements

**Global Thresholds (jest.config.js):**
```javascript
coverageThresholds: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
}
```

**Per-File Targets:**
- Services: 85%+
- Repositories: 85%+
- API Routes: 80%+
- Utilities: 75%+

### Critical Paths (Must have 90%+ coverage)
- AuthService (authentication & PIN validation)
- CaseService (case management)
- SyncService (offline sync)
- Conflict detection utilities

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Run Lighthouse
        run: |
          npm run build
          npm start &
          sleep 10
          node scripts/lighthouse-audit.js
```

### Pre-commit Hooks

**Husky Configuration (.husky/pre-commit):**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run tests on staged files
npm test -- --findRelatedTests --bail

# Run linter
npm run lint
```

---

## Best Practices

### General Guidelines

1. **Follow AAA Pattern**: Arrange, Act, Assert
2. **One assertion per test** (where possible)
3. **Test behavior, not implementation**
4. **Use descriptive test names**: `should [expected behavior] when [condition]`
5. **Mock external dependencies**: APIs, databases, file systems
6. **Avoid test interdependence**: Each test should run independently
7. **Clean up after tests**: Use `beforeEach` and `afterEach`

### Service Testing

✅ **DO:**
- Mock all repository dependencies
- Test business logic thoroughly
- Test error handling (throw errors)
- Test validation rules
- Test audit logging

❌ **DON'T:**
- Test database directly (use repositories)
- Test Next.js framework code
- Test external APIs (mock them)

### API Route Testing

✅ **DO:**
- Mock authentication (getServerSession)
- Mock service layer (container)
- Test HTTP status codes
- Test RBAC enforcement
- Test request/response formats

❌ **DON'T:**
- Make real API calls
- Test service logic (already tested)
- Test Next.js internals

### E2E Testing

✅ **DO:**
- Test critical user flows
- Test mobile responsiveness
- Test error states
- Test loading states
- Use data-testid attributes

❌ **DON'T:**
- Test every possible scenario (use unit tests)
- Make tests dependent on each other
- Use hardcoded wait times (use Playwright's auto-waiting)

### Performance Testing

✅ **DO:**
- Run Lighthouse on all deployments
- Test on 2G/3G networks (mobile configs)
- Monitor Core Web Vitals
- Test offline functionality
- Test low-end devices

❌ **DON'T:**
- Ignore mobile performance
- Skip accessibility audits
- Test only on fast connections

---

## Debugging Tests

### Jest Debugging

```bash
# Run tests in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand AnalyticsService.test.ts
```

**VS Code Launch Configuration:**
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Playwright Debugging

```bash
# Run with UI mode
npm run test:e2e -- --ui

# Run with headed browser
npm run test:e2e -- --headed

# Debug specific test
npm run test:e2e -- --debug login.spec.ts
```

**Playwright Inspector:**
```bash
PWDEBUG=1 npm run test:e2e
```

---

## Common Issues & Solutions

### Issue: Tests Timeout

**Solution:**
```javascript
// Increase timeout for slow tests
test('slow operation', async () => {
  // ...
}, 30000); // 30 seconds
```

### Issue: Flaky E2E Tests

**Solution:**
- Use Playwright's auto-waiting
- Avoid hardcoded waits
- Use proper locators
- Ensure test independence

### Issue: Coverage Below Threshold

**Solution:**
1. Identify uncovered lines: `npm run test:coverage`
2. Add missing test cases
3. Focus on critical paths first
4. Consider edge cases

### Issue: Mock Not Working

**Solution:**
```javascript
// Ensure mocks are cleared
beforeEach(() => {
  jest.clearAllMocks();
});

// Mock before importing
jest.mock('@/module');
import { Module } from '@/module';
```

---

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [Lighthouse Documentation](https://developer.chrome.com/docs/lighthouse/)

### Project-Specific Docs
- [Service-Repository Architecture](./SERVICE_REPOSITORY_ARCHITECTURE.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)
- [Phase 11 Completion](./PHASE_11_COMPLETE.md)

### Internal Examples
- `tests/unit/services/AnalyticsService.test.ts` - Service testing
- `tests/integration/api/performance.test.ts` - API testing
- `tests/e2e/auth/login.spec.ts` - E2E testing
- `tests/unit/lib/conflict-detector.test.ts` - Utility testing

---

## Contributing

When adding new features:

1. **Write tests first** (TDD)
2. **Ensure 80%+ coverage** for new code
3. **Add E2E tests** for critical flows
4. **Update this guide** if adding new patterns
5. **Run full test suite** before committing

---

**Maintained by:** CRMS Development Team
**Questions?** Open an issue on GitHub or contact the team.
