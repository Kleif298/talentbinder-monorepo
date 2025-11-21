Testing Guide — TalentBinder
=============================

This document explains how testing is implemented in the monorepo (frontend + backend), how to run tests locally, how tests are integrated in CI, and how to write and debug tests. It’s written for engineers and for non-technical teammates who want a clear, concise explanation.

Overview
--------
- Frontend: Vitest + Testing Library + MSW (Mock Service Worker). Tests live under `packages/frontend/src/**` next to components and pages.
- Backend: Jest (existing test suite) for unit and integration tests. Tests live under `packages/backend/src/**`.
- CI: GitLab pipeline runs backend and frontend tests and collects coverage artifacts (Cobertura). Configuration is in `.gitlab-ci.yml`.

Why we test this way (plain explanation)
---------------------------------------
- Frontend tests check components/pages in an environment similar to a browser without opening a real browser. We mock network calls so tests don’t need the backend running.
- Backend tests verify API routes and database interaction logic without hitting a real database by mocking queries.
- CI runs these tests automatically when code is pushed so we catch regressions early.

Quick commands (PowerShell)
---------------------------
- Frontend (watch/fast dev):

```powershell
cd packages/frontend
npm run test
```

- Frontend (CI, single-run + coverage):

```powershell
cd packages/frontend
npm run test:ci
```

- Backend (Jest; single-run/watch depends on package.json):

```powershell
cd packages/backend
npm run test
# or
npm run test:ci
```

What each command does
----------------------
- `npm run test` (frontend) — starts Vitest in watch/dev mode. Good for development and iterating on tests. It remains running and updates as files change.
- `npm run test:ci` (frontend) — runs Vitest once and writes coverage reports (including Cobertura XML used by CI).
- Backend `npm run test` / `test:ci` — runs Jest tests; CI runs this inside the backend job.

Frontend testing details
------------------------
Files to know:
- `packages/frontend/vitest.config.ts` — Vitest configuration (test environment, coverage reporters, setup file).
- `packages/frontend/src/test/setup.ts` — global test setup (starts MSW server, extends expect, suppresses expected console noise).
- `packages/frontend/src/test/handlers.ts` — MSW request handlers used for most tests (mocks `/api/events`, `/api/candidates`, `/api/auth/me`, ...).
- `packages/frontend/src/test/server.ts` — MSW node server setup used in tests.
- `packages/frontend/src/test/testUtils.tsx` — helper `render()` that wraps components with providers like `BrowserRouter`.
- Component and page tests: `*.test.tsx` files next to components/pages.

How MSW works here (simple)
- MSW intercepts HTTP requests made by the code under test and returns mocked responses defined in `handlers.ts`.
- Tests don't require a running backend; they rely on MSW to provide predictable server responses.

Examples (simple test patterns)
- Render component and assert on text:

```tsx
import { render, screen } from '~/test/testUtils';
import EventCard from './EventCard';

test('shows event title', () => {
  render(<EventCard event={mockEvent} ... />);
  expect(screen.getByText('Test Event')).toBeInTheDocument();
});
```

- Wait for async updates (avoid `act()` warnings):

```tsx
import { waitFor } from '@testing-library/react';

await waitFor(() => expect(screen.getByText('test@example.com')).toBeInTheDocument());
```

- Override an MSW handler for a single test:

```ts
import { server } from '~/test/server';
import { http, HttpResponse } from 'msw';

server.use(
  http.get('/api/events', () => HttpResponse.json({ success: true, events: [...] }))
);
```

Backend testing details
-----------------------
Files to know:
- `packages/backend/jest.config.cjs` — Jest configuration (transform, test environment).
- Tests are under `packages/backend/src/.../*.test.ts` or similar.

How backend tests run
- Tests typically spin up a small Express app or import route handlers and call them via Supertest.
- Database queries are mocked (see example in `candidates.test.ts`) so tests do not require a live database. Mocks return controlled results and let tests check route behavior.
- Authentication is faked by creating a JWT token and setting it as a cookie in requests.

Example patterns from `candidates.test.ts` (plain English):
- Mock the database pool so `pool.query()` returns a prepared value.
- Create a small Express app that mounts the candidates router.
- Make HTTP requests using `supertest` and assert on responses.

CI Integration
--------------
- File: `.gitlab-ci.yml` contains `test_backend` and `test_frontend` jobs.
- Jobs use NVM to install Node 20, run `npm ci`, then `cd packages/backend` (or `packages/frontend`) and run `npm run test:ci`.
- Coverage artifacts are collected and stored in `packages/*/coverage/` and Cobertura XML is produced for pipeline reporting.

Common issues & debugging tips
------------------------------
- `ECONNREFUSED` when running tests: means code tried to reach `localhost:3023` but the backend wasn't running and MSW either didn’t match the request or the request started before MSW was active. Usually harmless in tests if handled; ensure the request path is covered by an MSW handler and that `setup.ts` starts the MSW server.
- `act()` warnings: component updated state after render. Use `await waitFor(...)` or `findBy...` queries so tests wait for state updates.
- `AbortError` during teardown: often appears when a pending `fetch` is aborted because the test finished — usually harmless.
- If a test fails to find an element, use `screen.debug()` to inspect the rendered DOM.

How to add a new test (step-by-step)
------------------------------------
1. Create `MyComponent.test.tsx` next to `MyComponent.tsx`.
2. Import helpers: `import { render, screen } from '~/test/testUtils'`.
3. If you need a special response, override MSW in the test:
   - `server.use(http.get('/api/...', () => HttpResponse.json({...})))`.
4. Write assertions using `screen.getByText`, `findBy...`, `waitFor`.
5. Run `npm run test` (watch) or `npm run test:ci`.

Coverage and reports
--------------------
- Frontend coverage is produced in `packages/frontend/coverage/` (HTML index and Cobertura XML).
- Backend coverage is produced in `packages/backend/coverage/`.
- CI collects the Cobertura XML as an artifact for the pipeline.

E2E (optional)
---------------
- The repository currently includes unit & integration tests. For full end-to-end tests (real browser + backend), consider adding Playwright or Cypress and a CI job that runs them against a deployed test environment.

Maintenance tips
----------------
- Keep `src/test/handlers.ts` in sync with backend API shapes so mocks reflect reality.
- Avoid network calls at module import time — prefer starting network calls in `useEffect` or in functions so tests can mock them easily.
- Add tests for API wrappers (`packages/frontend/src/api/*.ts`) using MSW to mock responses and assert parsing/edge case handling.

If you want a short, non-technical one-paragraph summary to paste into a meeting:
"We have automated checks for the frontend and backend that pretend to be users and the server. Frontend tests run in a simulated browser and use a mock server for API calls, so they don’t need the real backend. Backend tests mock database queries and verify API routes. Both sets of tests run in CI and produce coverage reports, so we catch regressions early before they reach users."

---

File created: `docs/TESTING_GUIDE.md`

If you want, I can also:
- Add a short one-slide summary (markdown) for a meeting.
- Create a checklist of tests to add next (high-value coverage gaps).
Which one would you like next? 