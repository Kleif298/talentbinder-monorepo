# Environment switching and runbook

This document explains how to switch between local and cloud environments for both frontend and backend, and offers ready-to-use npm scripts and PowerShell helpers so you can pick the active environment quickly.

---

## Goals
- Run frontend against local backend (dev proxy, same-origin cookies).
- Run frontend against cloud backend (production URL).
- Start backend using the correct .env file (local or cloud) without editing code.
- Keep cookie settings safe for both dev (http) and production (https).

---

## Frontend (Vite)

### Environment files
Place environment files in the frontend root:

- `.env` — default values (committed with safe defaults or empty).
- `.env.development` or `.env.local` — local dev values. Example:

  VITE_API_URL=

  (empty means the app will use relative `/api/...` paths and Vite dev proxy will forward to your local backend)

- `.env.production` — production build values:

  VITE_API_URL=https://talentbinder-backend.onrender.com

- `.env.cloud` — optional custom cloud environment (same format as production)


### How the code should read the value
Use in code:

```ts
const API_BASE_ROOT = import.meta.env.VITE_API_URL || "";
const API_BASE = API_BASE_ROOT
  ? `${API_BASE_ROOT.replace(/\/$/, '')}/api/candidates`
  : '/api/candidates';
```

This makes the frontend use the dev proxy when `VITE_API_URL` is empty and use the cloud URL when defined.

### Vite dev proxy (existing)
Your `vite.config.ts` already has:

```ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:4000', changeOrigin: true, secure: false }
  }
}
```

This lets requests to `/api/...` (from the browser) be proxied to your local backend and preserve same-origin semantics (cookies included when `credentials: 'include'` is set).


### Useful frontend scripts
Add these in `frontend/package.json`:

```json
"scripts": {
  "dev": "vite",
  "dev:cloud": "vite --mode cloud",
  "build": "vite build",
  "preview": "vite preview"
}
```

- `npm run dev` → dev mode; Vite will load `.env`, `.env.local` and use proxy.
- `npm run dev -- --mode cloud` or `npm run dev:cloud` → loads `.env.cloud` so `VITE_API_URL` points to cloud backend.

---

## Backend (Node + dotenv)

You already use `dotenv` in `index.js` (dotenv.config()). Put environment sets in these files in backend root:

- `.env` (default)
- `.env.local` (local dev DB + JWT)
- `.env.cloud` (cloud DB URL and JWT secret)
- `.env.production` (production values)

Do NOT commit secrets. Use `.gitignore` to ignore environment files with secrets.

### Option A — dotenv-cli (recommended, simple)
- Install:

```powershell
cd backend
npm install --save-dev dotenv-cli
```

- Add scripts in backend `package.json`:

```json
"scripts": {
  "start": "node index.js",
  "start:local": "dotenv -e .env.local -- node index.js",
  "start:cloud": "dotenv -e .env.cloud -- node index.js",
  "start:prod": "dotenv -e .env.production -- node index.js"
}
```

- Use:

```powershell
npm run start:local
npm run start:cloud
```

### Option B — env-cmd (alternative)
- Install: `npm install --save-dev env-cmd`
- Script example: `env-cmd -f .env.cloud node index.js`

### Option C — Node loader (no deps)
- One-liner (PowerShell):

```powershell
$env:DOTENV_CONFIG_PATH = '.env.cloud'; node -r dotenv/config index.js
```

This sets the `DOTENV_CONFIG_PATH` so the `dotenv` loader picks a specific file.

---

## Cookie / SameSite notes
- Local dev uses HTTP. Browsers reject `SameSite=None` if the cookie is not Secure (HTTPS). For local dev use:
  - `sameSite: 'Lax'`, `secure: false`
- Production/cloud (https): use:
  - `sameSite: 'None'`, `secure: true`
- Implement this in your backend auth code using NODE_ENV or a dedicated env flag.

Example in `auth.js`:

```js
res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  maxAge: 3600000
});
```

---

## PowerShell helper (optional)
Create `scripts/start-env.ps1` in repo root to start frontend+backend together in a chosen environment.

Example `start-env.ps1`:

```powershell
param([string]$env = 'local')

if ($env -eq 'cloud') {
  # start backend cloud
  Push-Location backend
  npm run start:cloud
  Pop-Location
  # frontend cloud mode
  Push-Location frontend
  npm run dev -- --mode cloud
  Pop-Location
} else {
  # start backend local
  Push-Location backend
  npm run start:local
  Pop-Location
  # frontend dev (proxy)
  Push-Location frontend
  npm run dev
  Pop-Location
}
```

Run e.g. `.	ools\start-env.ps1 -env local` (or just open two terminals and run backend/frontend scripts separately).

---

## Debugging checklist (if frontend still talks to cloud)
1. In Browser DevTools → Network, check the request URL for `/api/...`. If it points at `http://localhost:4000` or `https://talentbinder-backend.onrender.com`, the frontend code used an absolute URL.
2. Grep the frontend sources for `talentbinder-backend.onrender.com` or `localhost:4000` and replace with relative `/api` or `import.meta.env.VITE_API_URL`.
3. Confirm the running Vite server picked the expected `.env` file (use `vite --mode cloud` to force `.env.cloud`).
4. Confirm the backend was started with the intended `.env` (check the DB connection and JWT secrets printed on startup if you log them).

---

## Example package.json scripts (both sides)

Frontend `package.json` (scripts):
```json
"dev": "vite",
"dev:cloud": "vite --mode cloud",
"build": "vite build",
"preview": "vite preview"
```

Backend `package.json` (scripts) using dotenv-cli:
```json
"start": "node index.js",
"start:local": "dotenv -e .env.local -- node index.js",
"start:cloud": "dotenv -e .env.cloud -- node index.js"
```

---

## Final notes & recommended workflow
- For local development: keep `VITE_API_URL` empty in dev env and use the Vite proxy; start backend with `.env.local` via `npm run start:local`.
- For cloud testing: run frontend with `--mode cloud` so it points to the cloud backend; start backend with `.env.cloud`.
- Keep secrets out of git and use a secure place for cloud secrets (render, env variables in CI/CD or cloud provider UI).

If you want, I can now:
- (A) add the example npm scripts to both `package.json` files in the repo and create `tools/start-env.ps1` for you, and run a quick smoke test; or
- (B) scan the frontend and replace remaining absolute backend URLs with the VITE-based approach.

Which of A or B should I do next? (I can do both if you prefer.)
