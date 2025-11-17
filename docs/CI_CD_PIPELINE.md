# GitLab CI/CD Pipeline Documentation

## Overview

This hybrid mono-repo uses GitLab CI/CD to automatically build and deploy the TalentBinder application. The pipeline intelligently detects changes in frontend, backend, or shared packages and only builds/deploys what has changed.

## Pipeline Architecture

### Stages

1. **Install** - Install all workspace dependencies
2. **Build** - Build shared, backend, and/or frontend based on changes
3. **Test** - Run tests (when configured)
4. **Deploy** - Deploy to production server

### Change Detection

The pipeline uses GitLab's `changes:` keyword to detect which parts of the monorepo have been modified:

- **Backend deployment triggers when:**
  - `packages/backend/**/*` changes
  - `packages/shared/**/*` changes (shared code affects backend)

- **Frontend deployment triggers when:**
  - `packages/frontend/**/*` changes
  - `packages/shared/**/*` changes (shared code affects frontend)

## Setup Instructions

### 1. GitLab CI/CD Variables

Configure these in GitLab: **Settings → CI/CD → Variables**

#### Required Variables:

| Variable Name | Description | Example | Masked |
|--------------|-------------|---------|--------|
| `SSH_PRIVATE_KEY` | Private SSH key for server access | `-----BEGIN OPENSSH PRIVATE KEY-----...` | ✅ Yes |
| `SERVER_USER` | SSH user for deployment | `deploy` or `root` | ❌ No |
| `SERVER_HOST` | Production server hostname | `www.lab.local` | ❌ No |
| `BACKEND_DEPLOY_DIR` | Backend deployment path | `/var/www/talentbinder-backend` | ❌ No |
| `FRONTEND_DEPLOY_DIR` | Frontend deployment path | `/var/www/talentbinder-frontend` | ❌ No |
| `BACKEND_SERVICE_NAME` | Systemd service name | `talentbinder-backend` | ❌ No |

#### Optional Variables:

| Variable Name | Description | Default |
|--------------|-------------|---------|
| `NODE_VERSION` | Node.js version for builds | `20` |

### 2. SSH Key Setup

Generate an SSH key pair for GitLab CI/CD:

```bash
# On your local machine or server
ssh-keygen -t ed25519 -C "gitlab-ci@talentbinder" -f gitlab-ci-key

# Copy the PUBLIC key to the server
ssh-copy-id -i gitlab-ci-key.pub user@www.lab.local

# Or manually add to authorized_keys:
cat gitlab-ci-key.pub | ssh user@www.lab.local "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

Then add the **PRIVATE** key to GitLab:
1. Copy the contents of `gitlab-ci-key` (the private key)
2. Go to GitLab → Your Project → Settings → CI/CD → Variables
3. Add variable `SSH_PRIVATE_KEY` with the private key content
4. Mark it as "Masked" and "Protected"

### 3. Server Setup

#### Initial Server Setup

On your production server, run these commands:

```bash
# 1. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Create deployment directories
sudo mkdir -p /var/www/talentbinder-backend
sudo mkdir -p /var/www/talentbinder-frontend

# 3. Copy deployment scripts to server
# From your local machine:
scp scripts/gitlab-deploy.sh user@www.lab.local:~/
scp scripts/setup-backend-service.sh user@www.lab.local:~/

# 4. Make scripts executable
ssh user@www.lab.local "chmod +x ~/gitlab-deploy.sh ~/setup-backend-service.sh"

# 5. Move scripts to proper location
ssh user@www.lab.local "sudo mv ~/gitlab-deploy.sh /usr/local/bin/ && sudo mv ~/setup-backend-service.sh /usr/local/bin/"

# 6. Setup backend systemd service
ssh user@www.lab.local "sudo /usr/local/bin/setup-backend-service.sh"
```

#### Backend Service Management

The backend runs as a systemd service. Useful commands:

```bash
# Check service status
sudo systemctl status talentbinder-backend

# View live logs
sudo journalctl -u talentbinder-backend -f

# Restart service
sudo systemctl restart talentbinder-backend

# Stop/Start service
sudo systemctl stop talentbinder-backend
sudo systemctl start talentbinder-backend
```

#### Frontend Web Server Setup

Configure nginx to serve the frontend:

```nginx
# /etc/nginx/sites-available/talentbinder-frontend
server {
    listen 80;
    server_name talentbinder.yourdomain.com;
    
    root /var/www/talentbinder-frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/talentbinder-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Pipeline Workflow

### Automatic Deployment Flow

1. **Developer pushes to `main` branch**
2. **GitLab detects changes** in specific packages
3. **Pipeline runs:**
   - Installs dependencies (if package.json changed)
   - Builds shared package (if changed)
   - Builds backend/frontend (if changed)
   - Runs tests (if configured)
   - Deploys to server (if builds successful)

### Example Scenarios

#### Scenario 1: Backend-only change
```
Developer changes: packages/backend/src/routes/auth.ts
Pipeline runs:
  ✓ install_dependencies
  ✓ build_shared (skipped - no changes)
  ✓ build_backend
  ✓ test_backend
  ✓ deploy_backend
  ✗ build_frontend (skipped - no changes)
  ✗ deploy_frontend (skipped - no changes)
```

#### Scenario 2: Shared package change
```
Developer changes: packages/shared/src/types/user.ts
Pipeline runs:
  ✓ install_dependencies
  ✓ build_shared
  ✓ build_backend (shared affects backend)
  ✓ build_frontend (shared affects frontend)
  ✓ test_backend
  ✓ test_frontend
  ✓ deploy_backend
  ✓ deploy_frontend
```

#### Scenario 3: Frontend-only change
```
Developer changes: packages/frontend/src/pages/Login/Login.tsx
Pipeline runs:
  ✓ install_dependencies
  ✓ build_shared (skipped - no changes)
  ✗ build_backend (skipped - no changes)
  ✓ build_frontend
  ✓ test_frontend
  ✗ deploy_backend (skipped - no changes)
  ✓ deploy_frontend
```

## Manual Deployment

Sometimes you need to manually trigger a full deployment:

1. Go to GitLab → CI/CD → Pipelines
2. Click on the latest pipeline
3. Find the `deploy_all` job
4. Click the "Play" button ▶️

This will deploy both frontend and backend regardless of what changed.

## Troubleshooting

### Pipeline Fails at Install Stage

**Problem:** `npm ci` fails with dependency errors

**Solutions:**
- Check that all `package.json` files are valid
- Ensure `package-lock.json` is committed
- Clear GitLab cache: CI/CD → Pipelines → Clear Runner Caches

### Build Fails for Backend/Frontend

**Problem:** TypeScript compilation errors

**Solutions:**
- Run `npm run build` locally to see errors
- Check `tsconfig.json` configurations
- Ensure shared package builds first

### Deployment Fails: SSH Connection

**Problem:** `Permission denied (publickey)`

**Solutions:**
1. Verify SSH key in GitLab variables
2. Test SSH connection manually:
   ```bash
   # Use the same key GitLab uses
   ssh -i gitlab-ci-key user@www.lab.local
   ```
3. Check server's `~/.ssh/authorized_keys` contains the public key

### Deployment Fails: Service Won't Start

**Problem:** Backend service fails to start after deployment

**Solutions:**
1. Check service logs:
   ```bash
   ssh user@www.lab.local "sudo journalctl -u talentbinder-backend -n 100"
   ```
2. Common issues:
   - Missing `.env` file → Copy `.env.render` to `.env`
   - Database not accessible → Check `DB_*` env variables
   - Port already in use → Check if old process is running
   - Missing dependencies → Run `npm ci` in deploy directory

### Frontend Shows Old Version

**Problem:** Deployed frontend shows old content

**Solutions:**
1. Clear browser cache (Ctrl+F5)
2. Check deployment directory:
   ```bash
   ssh user@www.lab.local "ls -la /var/www/talentbinder-frontend/dist"
   ```
3. Verify nginx is serving correct directory
4. Check nginx error logs:
   ```bash
   ssh user@www.lab.local "sudo tail -f /var/log/nginx/error.log"
   ```

## CI/CD Best Practices

### Branch Protection

Configure GitLab to require CI to pass before merging:

1. Settings → Repository → Protected Branches
2. Protect `main` branch
3. Enable "Require pipeline to succeed"

### Environment-Specific Deployments

Currently configured for production only. To add staging:

1. Duplicate `deploy_backend` and `deploy_frontend` jobs
2. Rename to `deploy_backend_staging`, etc.
3. Change variables to staging values
4. Update rules to trigger on `staging` branch

### Monitoring Deployments

Set up GitLab's environment monitoring:

1. Settings → Monitor → Environments
2. Configure health check URLs
3. Get notified when deployments fail

## Security Considerations

1. **Never commit secrets** - Use GitLab variables for sensitive data
2. **Use masked variables** - Mark SSH keys and passwords as masked
3. **Limit SSH access** - Use a dedicated deployment user with minimal permissions
4. **Audit deployments** - Review GitLab deployment logs regularly
5. **Use HTTPS** - Configure SSL certificates for production domains

## Maintenance

### Updating Deployment Scripts

If you modify `gitlab-deploy.sh` or `setup-backend-service.sh`:

```bash
# Copy updated scripts to server
scp scripts/gitlab-deploy.sh user@www.lab.local:/usr/local/bin/
scp scripts/setup-backend-service.sh user@www.lab.local:/usr/local/bin/

# Make executable
ssh user@www.lab.local "sudo chmod +x /usr/local/bin/gitlab-deploy.sh /usr/local/bin/setup-backend-service.sh"
```

### Cleaning Up Old Deployments

The deployment script automatically keeps the last 5 backups. To manually clean:

```bash
ssh user@www.lab.local "sudo rm -rf /var/www/talentbinder-backend_backup_*"
ssh user@www.lab.local "sudo rm -rf /var/www/talentbinder-frontend_backup_*"
```

## Performance Optimization

### Caching

The pipeline caches `node_modules` to speed up builds. Cache is invalidated when:
- `package-lock.json` changes
- Any `packages/*/package-lock.json` changes

### Parallel Builds

Frontend and backend builds run in parallel (when both change) to reduce total pipeline time.

### Artifacts

Build artifacts are kept for 1 hour to allow debugging failed deployments without rebuilding.

## Support

For issues or questions:
1. Check GitLab pipeline logs
2. Review server logs (`journalctl` for backend, nginx logs for frontend)
3. Consult this documentation
4. Contact the DevOps team

---

**Last Updated:** November 2025  
**Pipeline Version:** 1.0
