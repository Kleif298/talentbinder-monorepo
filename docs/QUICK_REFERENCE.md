# Quick Reference: Monorepo + Multi-Repo Deployment

## ✅ What You Have Now

**Local Development = Monorepo**
- Work in one repo: `talent-binder-monorepo`
- Shared package is NOT a separate repo
- Shared package is NOT published to NPM
- It's a local workspace package via NPM Workspaces
- All packages use `node_modules` in root (hoisted)

**Deployment = Multi-Repo**
- Push to 3 separate GitLab repos using git subtree
- Backend repo, Frontend repo, Shared repo
- Deployment services (Render) pull from individual repos

---

## 🚀 Setup Git Remotes (One Time)

```powershell
# In your monorepo root
cd "c:\Users\leiff\vscProjects\talent-binder -monorepo"

# Add remotes (replace with your actual GitLab URLs)
git remote add backend-origin git@gitlab.com:YOUR_ORG/talentbinder-backend.git
git remote add frontend-origin git@gitlab.com:YOUR_ORG/talentbinder-frontend.git
git remote add shared-origin git@gitlab.com:YOUR_ORG/talentbinder-shared.git

# Verify
git remote -v
```

---

## 📦 Daily Development

```powershell
# 1. Install dependencies (creates symlinks)
npm install

# 2. Build shared package
npm run build:shared

# 3. Start development
npm run dev

# 4. Make changes to any package (backend, frontend, or shared)

# 5. If you changed shared types, rebuild:
npm run build:shared

# 6. Commit to monorepo
git add .
git commit -m "Your message"
git push origin main
```

---

## 🚢 Deployment to GitLab

### Option 1: Deploy Everything
```powershell
npm run deploy:all
```

This will:
1. Build shared package
2. Copy shared to backend/frontend node_modules
3. Push shared to GitLab
4. Push backend to GitLab
5. Push frontend to GitLab

### Option 2: Deploy Individually
```powershell
# Deploy shared only
npm run deploy:shared

# Deploy backend only
npm run deploy:backend

# Deploy frontend only
npm run deploy:frontend
```

---

## 🔍 How Imports Work

### In Development (Monorepo)
```typescript
// Backend or Frontend
import { User, Event } from '@talentbinder/shared';
import type { Candidate } from '@talentbinder/shared';
```

**How it resolves:**
1. NPM looks for `@talentbinder/shared` in `node_modules`
2. Finds symlink at `node_modules/@talentbinder/shared`
3. Symlink points to `packages/shared`
4. Loads types from `packages/shared/dist/`

### In Deployment (Multi-Repo)
Same imports work because:
- `prepare-deploy.js` copies built shared to `node_modules/@talentbinder/shared`
- OR you use git submodule in deployment repos
- OR deployment installs shared from GitLab

---

## 🛠️ Available Commands

```powershell
# Development
npm run dev                  # Start both backend & frontend
npm run dev:backend          # Start backend only
npm run dev:frontend         # Start frontend only

# Building
npm run build:shared         # Build shared package (types & JS)
npm run build:backend        # Build backend
npm run build:frontend       # Build frontend
npm run build                # Build all (shared first, then others)

# Deployment
npm run prepare-deploy       # Copy shared to backend/frontend
npm run deploy:shared        # Push shared to GitLab
npm run deploy:backend       # Build & push backend to GitLab
npm run deploy:frontend      # Build & push frontend to GitLab
npm run deploy:all           # Deploy everything

# Maintenance
npm run clean                # Clean all node_modules and dist
npm install                  # Install & link all packages
npm run lint                 # Lint all packages
npm run test                 # Test all packages
```

---

## 📂 Where Is Everything?

```
monorepo/
├── node_modules/
│   └── @talentbinder/
│       └── shared/            ← Symlink to packages/shared
│
├── packages/
│   ├── backend/
│   │   ├── (no node_modules)  ← Uses root node_modules
│   │   └── package.json       ← Has "@talentbinder/shared": "*"
│   │
│   ├── frontend/
│   │   ├── (no node_modules)  ← Uses root node_modules
│   │   └── package.json       ← Has "@talentbinder/shared": "*"
│   │
│   └── shared/
│       ├── dist/              ← Built types & JS (after npm run build:shared)
│       ├── src/               ← Source TypeScript files
│       └── package.json       ← Name: "@talentbinder/shared"
│
├── scripts/
│   └── prepare-deploy.js      ← Copies shared for deployment
│
└── package.json               ← Workspace config with all scripts
```

---

## ❓ FAQ

### Do I need to publish `shared` to NPM?
**No.** It's a local workspace package.

### Do I need a separate repo for `shared` during development?
**No.** It lives in `packages/shared` in your monorepo.

### Do I need separate repos for deployment?
**Yes.** Create 3 GitLab repos (backend, frontend, shared) for deployment services.

### How does shared get into backend/frontend?
**Development:** NPM workspaces creates symlinks automatically.
**Deployment:** The `prepare-deploy.js` script copies it, or you use git submodules.

### What if I change shared types?
Run `npm run build:shared` to rebuild. Backend/frontend will pick up changes immediately via the symlink.

### Can I still use git normally?
**Yes.** Keep using `git add`, `git commit`, `git push` for your monorepo. The deployment scripts use `git subtree` to push to separate repos.

---

## 🎯 Quick Deploy Checklist

- [ ] Commit all changes to monorepo: `git commit -am "Your message"`
- [ ] Push to monorepo: `git push origin main`
- [ ] Deploy to GitLab: `npm run deploy:all`
- [ ] Verify deployment on Render/your hosting service

Done! 🎉
