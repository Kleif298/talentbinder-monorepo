# Monorepo → Multi-Repo Deployment Guide

## 📁 How Your Setup Works

### Local Development (Monorepo)
```
talent-binder-monorepo/
├── node_modules/              ← All dependencies (hoisted)
│   └── @talentbinder/
│       └── shared/            ← Symlink to packages/shared
├── packages/
│   ├── backend/
│   │   └── (no node_modules)  ← Uses root node_modules
│   ├── frontend/
│   │   └── (no node_modules)  ← Uses root node_modules
│   └── shared/
│       └── dist/              ← Built types and JS
└── package.json               ← Workspace configuration
```

### Key Points:
- ✅ **No separate repo for shared** - it lives in `packages/shared`
- ✅ **Not published to NPM** - it's a local workspace package
- ✅ **Symlinked automatically** - NPM workspaces creates symlinks in root `node_modules/@talentbinder/shared`
- ✅ **Backend & Frontend import it normally**: `import { User } from '@talentbinder/shared'`

---

## 🔧 How to Use

### Development Workflow

```bash
# 1. Install all dependencies (creates symlinks)
npm install

# 2. Build shared package first
npm run build:shared

# 3. Start development
npm run dev                 # Both backend & frontend
npm run dev:backend         # Backend only
npm run dev:frontend        # Frontend only
```

### Making Changes to Shared

```bash
# Edit files in packages/shared/src/
# Then rebuild:
npm run build:shared

# Backend and frontend will automatically use the updated types
```

### Adding New Shared Types

```typescript
// packages/shared/src/types/newType.ts
export interface NewType {
  id: number;
  name: string;
}
```

```typescript
// packages/shared/src/index.ts
export * from './types/newType';
```

```bash
# Rebuild shared
npm run build:shared
```

```typescript
// Use in backend or frontend
import { NewType } from '@talentbinder/shared';
```

---

## 🚀 Deployment Strategy: Git Subtree

### Setup (One-Time)

```bash
# 1. Create three separate GitLab repos:
#    - talentbinder-backend
#    - talentbinder-frontend
#    - talentbinder-shared

# 2. Add them as remotes
git remote add backend-origin git@gitlab.com:your-org/talentbinder-backend.git
git remote add frontend-origin git@gitlab.com:your-org/talentbinder-frontend.git
git remote add shared-origin git@gitlab.com:your-org/talentbinder-shared.git

# 3. Initial push
git subtree push --prefix=packages/backend backend-origin main
git subtree push --prefix=packages/frontend frontend-origin main
git subtree push --prefix=packages/shared shared-origin main
```

### Deploy After Changes

```bash
# Deploy shared first (others may depend on it)
git subtree push --prefix=packages/shared shared-origin main

# Deploy backend
git subtree push --prefix=packages/backend backend-origin main

# Deploy frontend
git subtree push --prefix=packages/frontend frontend-origin main
```

### Automated Deployment Script

Add to root `package.json`:

```json
{
  "scripts": {
    "deploy:shared": "git subtree push --prefix=packages/shared shared-origin main",
    "deploy:backend": "git subtree push --prefix=packages/backend backend-origin main",
    "deploy:frontend": "git subtree push --prefix=packages/frontend frontend-origin main",
    "deploy:all": "npm run deploy:shared && npm run deploy:backend && npm run deploy:frontend",
    "predeploy:all": "npm run build:shared"
  }
}
```

Usage:
```bash
npm run deploy:all
```

---

## 🎯 Handling Shared in Deployment Repos

### Option A: Include Built Shared in Backend/Frontend (Simplest)

Before deploying, copy the built shared package into backend/frontend:

**Create `scripts/prepare-deploy.js`:**
```javascript
import { cpSync } from 'fs';
import { join } from 'path';

// Copy built shared to backend
cpSync(
  'packages/shared/dist',
  'packages/backend/node_modules/@talentbinder/shared/dist',
  { recursive: true }
);

// Copy built shared to frontend
cpSync(
  'packages/shared/dist',
  'packages/frontend/node_modules/@talentbinder/shared/dist',
  { recursive: true }
);

console.log('✅ Shared package prepared for deployment');
```

**Update `package.json`:**
```json
{
  "scripts": {
    "predeploy:backend": "npm run build:shared && node scripts/prepare-deploy.js",
    "predeploy:frontend": "npm run build:shared && node scripts/prepare-deploy.js"
  }
}
```

### Option B: Git Submodules in Deployment Repos

In your separate backend/frontend repos on GitLab:

```bash
# In backend repo
git submodule add git@gitlab.com:your-org/talentbinder-shared.git shared
npm install ./shared

# In frontend repo
git submodule add git@gitlab.com:your-org/talentbinder-shared.git shared
npm install ./shared
```

Update imports:
```typescript
// Change from:
import { User } from '@talentbinder/shared';

// To:
import { User } from '../shared';
```

### Option C: Keep Workspace Configuration in Deployment

In backend/frontend `package.json` on GitLab:

```json
{
  "dependencies": {
    "@talentbinder/shared": "git+https://gitlab.com/your-org/talentbinder-shared.git"
  }
}
```

This makes NPM fetch shared directly from GitLab during deployment.

---

## 🔄 Complete Workflow Example

### Day-to-Day Development

```bash
# 1. Pull latest changes
git pull origin main

# 2. Install dependencies
npm install

# 3. Build shared
npm run build:shared

# 4. Make your changes
# - Edit backend files
# - Edit frontend files
# - Edit shared types

# 5. Rebuild shared if changed
npm run build:shared

# 6. Test locally
npm run dev

# 7. Commit to monorepo
git add .
git commit -m "Add new feature"
git push origin main
```

### Deployment to GitLab

```bash
# After testing and committing to monorepo:

# Deploy all services
npm run deploy:all

# Or deploy individually
npm run deploy:shared
npm run deploy:backend
npm run deploy:frontend
```

### Pull Hotfixes from Deployment Repos

If someone makes changes directly in the deployment repo:

```bash
# Pull backend changes back to monorepo
git subtree pull --prefix=packages/backend backend-origin main

# Pull frontend changes
git subtree pull --prefix=packages/frontend frontend-origin main

# Pull shared changes
git subtree pull --prefix=packages/shared shared-origin main
```

---

## 📋 Troubleshooting

### Shared types not found

```bash
# Rebuild shared
npm run build:shared

# Check if dist folder exists
ls packages/shared/dist
```

### Import errors

Make sure you're importing from `@talentbinder/shared`:
```typescript
// ✅ Correct
import { User } from '@talentbinder/shared';

// ❌ Wrong
import { User } from '../../shared/src/types/user';
```

### Workspace not linking

```bash
# Clean and reinstall
npm run clean
npm install
npm run build:shared
```

---

## 🎯 Summary

**You have:**
- ✅ Monorepo for easy local development
- ✅ Local NPM package (not published, no extra repo needed initially)
- ✅ Git subtree for deploying to separate GitLab repos
- ✅ Shared types available to both backend and frontend

**You DON'T need:**
- ❌ Separate repo for shared during development
- ❌ Publishing to NPM registry
- ❌ Complex package management

**For Deployment:**
- Create 3 separate GitLab repos (backend, frontend, shared)
- Use git subtree to push each package to its own repo
- Use Option A (copy built files) for simplest deployment
