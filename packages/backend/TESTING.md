# Testing Documentation

## Overview
Professional Jest testing environment for the TalentBinder backend application.

**Current Test Coverage:** 44 passing tests across 7 test suites
- Unit Tests: Authentication utils, Case conversion utils
- Integration Tests: Authentication routes, Candidates routes, Events routes
- Middleware Tests: Auth middleware, Admin authorization

---

## Test Structure

```
packages/backend/
├── src/
│   ├── middleware/
│   │   └── auth.test.ts          # Middleware tests
│   ├── routes/
│   │   ├── auth.test.ts          # Auth route integration tests
│   │   ├── candidates.test.ts    # Candidates route integration tests
│   │   └── events.test.ts        # Events route integration tests
│   ├── test/
│   │   ├── setup.ts              # Test environment setup
│   │   └── health.test.ts        # Basic health check tests
│   └── utils/
│       ├── auth.test.ts          # Auth utility unit tests
│       └── caseUtils.test.ts     # Case conversion unit tests
├── jest.config.cjs               # Jest configuration
└── .env.test                     # Test environment variables
```

---

## Running Tests

### Basic Commands
```bash
# Run all tests
npm run test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run only unit tests (excluding integration tests)
npm run test:unit

# Run only integration tests (API routes)
npm run test:integration

# Run tests in CI mode (used in GitLab CI/CD)
npm run test:ci
```

### Test Output
- **Green checkmarks (√):** Tests that passed
- **Red crosses (×):** Tests that failed
- **Coverage reports:** Available in `coverage/` directory after running `npm run test:coverage`

---

## Test Categories

### 1. Unit Tests
**Purpose:** Test individual functions and utilities in isolation

**Examples:**
- `auth.test.ts` - Tests `getOrCreateUser()`, `createAuthToken()`
- `caseUtils.test.ts` - Tests `snakeToCamelObj()`, `snakeToCamelArray()`

**Best Practices:**
- Mock external dependencies (database, LDAP)
- Test edge cases (null, undefined, empty values)
- Test error handling

### 2. Integration Tests
**Purpose:** Test API endpoints end-to-end with HTTP requests

**Examples:**
- `auth.test.ts` (routes) - Tests POST /api/auth/login, logout
- `candidates.test.ts` - Tests GET/POST/PUT/DELETE /api/candidates
- `events.test.ts` - Tests GET/POST/PUT/DELETE /api/events

**Best Practices:**
- Use `supertest` to make HTTP requests
- Test authentication and authorization
- Verify HTTP status codes and response structure
- Mock database calls

### 3. Middleware Tests
**Purpose:** Test request/response middleware logic

**Examples:**
- `auth.test.ts` (middleware) - Tests `authRequired()`, `checkAdmin()`

**Best Practices:**
- Test with valid and invalid tokens
- Test role-based access control
- Verify error responses

---

## How Jest Tests Work

### Test Structure
```typescript
describe('Feature Name', () => {
    // Setup runs before each test
    beforeEach(() => {
        // Reset mocks, clear database, etc.
    });

    describe('Specific Function', () => {
        it('should do something specific', () => {
            // Arrange: Set up test data
            const input = { name: 'test' };
            
            // Act: Call the function
            const result = myFunction(input);
            
            // Assert: Verify the result
            expect(result).toBe(expected);
        });
    });
});
```

### Common Assertions
```typescript
expect(value).toBe(5);                    // Strict equality
expect(value).toEqual({ id: 1 });         // Deep equality
expect(value).toBeDefined();              // Not undefined
expect(value).toBeNull();                 // Is null
expect(array).toContain('item');          // Array contains item
expect(fn).toThrow('error');              // Function throws error
expect(response.status).toBe(200);        // HTTP status code
```

### Mocking
```typescript
// Mock database calls
jest.mock('../config/db.js', () => ({
    pool: { query: jest.fn() }
}));

// Mock specific behavior
(pool.query as jest.Mock).mockResolvedValue({ rows: [data] });
```

---

## CI/CD Integration

### GitLab CI Pipeline
Tests run automatically on every commit to the `main` branch:

1. **Test Stage** (runs first)
   - Installs dependencies
   - Runs `npm run test:ci`
   - Generates coverage report
   - Pipeline **fails** if tests fail

2. **Build Stage** (runs after tests pass)
   - Builds TypeScript to JavaScript
   - Creates deployment artifacts

3. **Deploy Stage** (runs after build)
   - Deploys to production server

### Coverage Reports
- Coverage threshold: **60%** for branches, functions, lines, statements
- Reports available as GitLab artifacts
- Viewable in `coverage/` directory locally

---

## Test Environment

### Environment Variables
Tests use `.env.test` with mock values:
- `NODE_ENV=test`
- `JWT_SECRET=test-jwt-secret-key-for-testing-only`
- `DB_NAME=talentbinder_test` (use separate test database!)
- Mock LDAP configuration

### Test Setup (`src/test/setup.ts`)
- Sets environment variables
- Configures test timeout (10 seconds)
- Suppresses console logs during tests

---

## Adding New Tests

### For New Utility Functions
```typescript
// filepath: src/utils/myUtil.test.ts
import { myFunction } from './myUtil.js';

describe('My Utility', () => {
    it('should handle valid input', () => {
        expect(myFunction('valid')).toBe('expected');
    });
    
    it('should handle invalid input', () => {
        expect(() => myFunction(null)).toThrow();
    });
});
```

### For New API Routes
```typescript
// filepath: src/routes/myRoute.test.ts
import request from 'supertest';
import express from 'express';
import myRouter from './myRoute.js';

const app = express();
app.use(express.json());
app.use('/api/my-route', myRouter);

describe('My Route', () => {
    it('should return data', async () => {
        const response = await request(app).get('/api/my-route');
        expect(response.status).toBe(200);
    });
});
```

---

## Known Issues

Some tests are currently failing due to incomplete route implementations:
- Auth route: LDAP login flow needs full route implementation
- Candidates GET by ID: Route may not exist or needs mock adjustment
- Events GET by ID: Route may not exist or needs mock adjustment

These are **normal** for a growing application and should be fixed as routes are implemented.

---

## Best Practices for Production

1. **Run tests before committing:** `npm run test`
2. **Maintain coverage above 60%:** `npm run test:coverage`
3. **Write tests for new features:** Cover happy path + edge cases
4. **Mock external services:** Don't hit real databases or LDAP in tests
5. **Keep tests fast:** Unit tests < 100ms, integration tests < 1s
6. **Use descriptive test names:** "should return 404 when user not found"

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [ts-jest Documentation](https://kulshekhar.github.io/ts-jest/)

---

**Status:** ✅ Testing environment fully configured and operational
**Last Updated:** 2025-11-20
