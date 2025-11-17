# Git Subtree Setup for Multi-Repo Deployment

## 🎯 Goal
Work in monorepo locally → Deploy to 3 separate GitLab repos

---

## 📋 Step 1: Create GitLab Repositories

Create three **empty** repositories on GitLab:

1. **talentbinder-backend**
   - URL: `git@gitlab.com:YOUR_ORG/talentbinder-backend.git`
   
2. **talentbinder-frontend**
   - URL: `git@gitlab.com:YOUR_ORG/talentbinder-frontend.git`
   
3. **talentbinder-shared**
   - URL: `git@gitlab.com:YOUR_ORG/talentbinder-shared.git`

⚠️ **Important:** Do NOT initialize them with README, .gitignore, or any files. Keep them completely empty.

---

## 📋 Step 2: Add Git Remotes to Monorepo

```powershell
# Navigate to monorepo root
cd "c:\Users\leiff\vscProjects\talent-binder -monorepo"

# Add backend remote
git remote add backend-origin git@gitlab.com:YOUR_ORG/talentbinder-backend.git

# Add frontend remote
git remote add frontend-origin git@gitlab.com:YOUR_ORG/talentbinder-frontend.git

# Add shared remote
git remote add shared-origin git@gitlab.com:YOUR_ORG/talentbinder-shared.git

# Verify remotes
git remote -v
```

You should see:
```
backend-origin   git@gitlab.com:YOUR_ORG/talentbinder-backend.git (fetch)
backend-origin   git@gitlab.com:YOUR_ORG/talentbinder-backend.git (push)
frontend-origin  git@gitlab.com:YOUR_ORG/talentbinder-frontend.git (fetch)
frontend-origin  git@gitlab.com:YOUR_ORG/talentbinder-frontend.git (push)
shared-origin    git@gitlab.com:YOUR_ORG/talentbinder-shared.git (fetch)
shared-origin    git@gitlab.com:YOUR_ORG/talentbinder-shared.git (push)
origin           git@gitlab.com:YOUR_ORG/talentbinder-monorepo.git (fetch)
origin           git@gitlab.com:YOUR_ORG/talentbinder-monorepo.git (push)
```

---

## 📋 Step 3: Initial Push to Deployment Repos

```powershell
# Make sure everything is committed
git status
git add .
git commit -m "Prepare for multi-repo deployment"

# Push shared first (others depend on it)
git subtree push --prefix=packages/shared shared-origin main

# Push backend
git subtree push --prefix=packages/backend backend-origin main

# Push frontend
git subtree push --prefix=packages/frontend frontend-origin main
```

⏱️ **Note:** First push may take a few minutes as git subtree splits the history.

---

## 📋 Step 4: Verify Deployment Repos

Check each GitLab repo to ensure they contain the correct files:

**Backend repo should have:**
```
config/
middleware/
routes/
utils/
index.js
package.json
docker-compose.yml
README.md
```

**Frontend repo should have:**
```
src/
public/
index.html
package.json
vite.config.ts
tsconfig.json
```

**Shared repo should have:**
```
src/
  types/
  utils/
  index.ts
dist/          (if you ran prepare-deploy)
package.json
tsconfig.json
```

---

## 📋 Step 5: Configure Deployment Service (Render/etc.)

Update your deployment service to use the new repos:

### Backend Service
- **Repository:** `git@gitlab.com:YOUR_ORG/talentbinder-backend.git`
- **Branch:** `main`
- **Root Directory:** `/` (not `/packages/backend`)

### Frontend Service
- **Repository:** `git@gitlab.com:YOUR_ORG/talentbinder-frontend.git`
- **Branch:** `main`
- **Root Directory:** `/` (not `/packages/frontend`)

---

## 🚀 Future Deployments

After Step 3, use the NPM scripts:

```powershell
# Deploy everything at once
npm run deploy:all

# Or deploy individually
npm run deploy:shared
npm run deploy:backend
npm run deploy:frontend
```

---

## 🔧 Handling Shared Package in Deployment

### Current Setup (After `prepare-deploy.js`)

When you run `npm run deploy:backend` or `npm run deploy:frontend`, the script:
1. Builds shared package: `npm run build:shared`
2. Copies built shared to `packages/backend/node_modules/@talentbinder/shared`
3. Copies built shared to `packages/frontend/node_modules/@talentbinder/shared`
4. Pushes to GitLab with shared included

**Pros:**
- ✅ Simple
- ✅ No extra setup in deployment repos
- ✅ Works immediately

**Cons:**
- ❌ Shared code is duplicated in backend/frontend repos
- ❌ Large commits if shared changes frequently

### Alternative: Git Submodules (Better for Frequent Shared Updates)

If you update shared types frequently, use git submodules instead:

**In each deployment repo (backend/frontend):**

```bash
# Clone the deployment repo
git clone git@gitlab.com:YOUR_ORG/talentbinder-backend.git
cd talentbinder-backend

# Add shared as submodule
git submodule add git@gitlab.com:YOUR_ORG/talentbinder-shared.git shared

# Update package.json to use local shared
```

Update `package.json`:
```json
{
  "dependencies": {
    "@talentbinder/shared": "file:./shared"
  }
}
```

**To update shared in deployment:**
```bash
cd shared
git pull origin main
cd ..
git add shared
git commit -m "Update shared types"
git push
```

---

## 🔄 Pulling Changes from Deployment Repos

If someone makes a hotfix directly in a deployment repo:

```powershell
# Pull backend changes back to monorepo
git subtree pull --prefix=packages/backend backend-origin main

# Pull frontend changes
git subtree pull --prefix=packages/frontend frontend-origin main

# Pull shared changes
git subtree pull --prefix=packages/shared shared-origin main
```

---

## 🎉 You're Done!

Your setup:
- ✅ Develop in monorepo (`talent-binder-monorepo`)
- ✅ Share types easily via `@talentbinder/shared`
- ✅ Deploy to separate repos with `npm run deploy:all`
- ✅ No extra repo management during development

**Quick reminder:**
```powershell
# Daily work
npm run dev

# When ready to deploy
git add .
git commit -m "Add feature"
git push origin main
npm run deploy:all
```
