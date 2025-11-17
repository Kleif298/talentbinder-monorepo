# Quick Reference: TalentBinder Monorepo

## ✅ What You Have Now

**Hybrid Monorepo with Automated CI/CD**
- Work in one repo: `talentbinder-monorepo`
- Shared package is a local workspace package via NPM Workspaces
- All packages use `node_modules` in root (hoisted)
- GitLab CI/CD handles building and deploying automatically
- Smart change detection - only builds/deploys what changed

---

## 🚀 Setup (One Time)

### 1. Configure GitLab CI/CD Variables

Go to GitLab → Settings → CI/CD → Variables and add:

| Variable | Value | Masked |
|----------|-------|--------|
| `SSH_PRIVATE_KEY` | Your SSH private key | ✅ |
| `SERVER_USER` | Server SSH user (e.g., `deploy`) | ❌ |
| `SERVER_HOST` | `www.lab.local` | ❌ |

### 2. Setup Server

```bash
# SSH into your server
ssh user@www.lab.local

# Run the backend service setup script
sudo /usr/local/bin/setup-backend-service.sh
```

---

## 📦 Daily Development

```powershell
# 1. Install dependencies
npm install

# 2. Build shared package (if you made changes to it)
npm run build:shared

# 3. Start development servers
npm run dev

# Or start individually:
npm run dev:backend   # Backend on port 4000
npm run dev:frontend  # Frontend on port 5173

# 4. Make your changes to any package

# 5. Commit and push
git add .
git commit -m "Your message"
git push origin main
```

**That's it!** GitLab CI/CD automatically:
- Detects what changed (backend/frontend/shared)
- Builds only what needs building
- Deploys to your server

---

## 🚢 Deployment (Automatic)

### What Triggers Deployment?

**Backend deploys when you change:**
- `packages/backend/**/*`
- `packages/shared/**/*`

**Frontend deploys when you change:**
- `packages/frontend/**/*`
- `packages/shared/**/*`

**Both deploy when you change:**
- `packages/shared/**/*`

### Manual Full Deployment

If you need to force deploy everything:

1. Go to GitLab → CI/CD → Pipelines
2. Click on latest pipeline
3. Find `deploy_all` job and click "Play" ▶️

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

### In Production
Same imports work because:
- CI/CD builds shared package first
- Backend/frontend have shared as a workspace dependency
- Node resolves via workspace symlink

---

## 🛠️ Available Commands

```powershell
# Development
npm run dev                  # Start both backend & frontend
npm run dev:backend          # Start backend only (port 4000)
npm run dev:frontend         # Start frontend only (port 5173)

# Building
npm run build:shared         # Build shared package (types & JS)
npm run build:backend        # Build backend
npm run build:frontend       # Build frontend
npm run build                # Build all (shared first, then others)

# Testing
npm run lint                 # Lint all packages
npm run test                 # Test all packages

# Maintenance
npm run clean                # Clean all node_modules and dist
npm install                  # Install & link all packages
```

---

## 🔧 CI/CD Commands (Server)

```bash
# Check backend service status
sudo systemctl status talentbinder-backend

# View backend logs (live)
sudo journalctl -u talentbinder-backend -f

# View recent backend logs
sudo journalctl -u talentbinder-backend -n 100 --no-pager

# Restart backend manually
sudo systemctl restart talentbinder-backend

# Stop/Start backend
sudo systemctl stop talentbinder-backend
sudo systemctl start talentbinder-backend

# Check deployment directory
ls -la /var/www/talentbinder-backend
ls -la /var/www/talentbinder-frontend

# View deployment backups
ls -la /var/www/talentbinder-backend_backup_*

# Check nginx status
sudo systemctl status nginx

# Reload nginx
sudo systemctl reload nginx

# View nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 📂 Where Is Everything?

```
monorepo/
├── .gitlab-ci.yml             ← CI/CD pipeline configuration
│
├── node_modules/
│   └── @talentbinder/
│       └── shared/            ← Symlink to packages/shared
│
├── packages/
│   ├── backend/
│   │   ├── (no node_modules)  ← Uses root node_modules
│   │   ├── dist/              ← Built files (after npm run build:backend)
│   │   └── package.json       ← Has "@talentbinder/shared": "*"
│   │
│   ├── frontend/
│   │   ├── (no node_modules)  ← Uses root node_modules
│   │   ├── dist/              ← Built files (after npm run build:frontend)
│   │   └── package.json       ← Has "@talentbinder/shared": "*"
│   │
│   └── shared/
│       ├── dist/              ← Built types & JS (after npm run build:shared)
│       ├── src/               ← Source TypeScript files
│       └── package.json       ← Name: "@talentbinder/shared"
│
├── scripts/
│   ├── gitlab-deploy.sh       ← Server deployment script
│   └── setup-backend-service.sh  ← Backend service setup
│
├── docs/
│   ├── CI_CD_PIPELINE.md      ← Complete CI/CD documentation
│   └── QUICK_REFERENCE.md     ← This file
│
└── package.json               ← Workspace config with all scripts
```

---

## ❓ FAQ

### Do I need to publish `shared` to NPM?
**No.** It's a local workspace package managed by NPM workspaces.

### How does deployment work?
Push to `main` branch → GitLab CI/CD automatically builds and deploys. See [CI_CD_PIPELINE.md](CI_CD_PIPELINE.md) for details.

### What if I only change the backend?
CI/CD detects the change and only builds/deploys the backend. Frontend is skipped.

### What if I change shared types?
CI/CD rebuilds shared first, then rebuilds and deploys both backend and frontend (since both depend on shared).

### How do I see what the pipeline is doing?
Go to GitLab → CI/CD → Pipelines → Click on the latest pipeline to see each job's output.

### Can I deploy manually?
Yes! In GitLab → Pipelines → Click pipeline → Find `deploy_all` → Click "Play" ▶️

### How do I rollback a deployment?
SSH to server and restore from backup:
```bash
ssh user@www.lab.local
sudo systemctl stop talentbinder-backend
sudo mv /var/www/talentbinder-backend /var/www/talentbinder-backend_failed
sudo mv /var/www/talentbinder-backend_backup_TIMESTAMP /var/www/talentbinder-backend
sudo systemctl start talentbinder-backend
```

---

## 🎯 Quick Deploy Checklist

- [ ] Make your changes locally
- [ ] Test locally: `npm run dev`
- [ ] Build locally to check for errors: `npm run build`
- [ ] Commit changes: `git commit -am "Your message"`
- [ ] Push to GitLab: `git push origin main`
- [ ] Watch pipeline in GitLab CI/CD dashboard
- [ ] Verify deployment on production server
- [ ] Deploy to GitLab: `npm run deploy:all`
- [ ] Verify deployment on Render/your hosting service

Done! 🎉
