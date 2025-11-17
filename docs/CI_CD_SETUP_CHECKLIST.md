# CI/CD Setup Checklist

Use this checklist when setting up GitLab CI/CD for the first time or on a new server.

## Phase 1: Local Repository Setup

- [ ] Verify monorepo structure is correct
  ```powershell
  cd c:\Users\leiff\vscProjects\talentbinder-monorepo
  npm install
  npm run build
  ```

- [ ] Verify `.gitlab-ci.yml` exists in root
  ```powershell
  Test-Path .\.gitlab-ci.yml
  ```

- [ ] Verify deployment scripts exist
  ```powershell
  Test-Path .\scripts\gitlab-deploy.sh
  Test-Path .\scripts\setup-backend-service.sh
  ```

- [ ] Commit and push to GitLab
  ```powershell
  git add .
  git commit -m "Add CI/CD pipeline configuration"
  git push origin main
  ```

---

## Phase 2: GitLab Configuration

### 2.1 Generate SSH Key for CI/CD

- [ ] Generate SSH key pair
  ```bash
  # On your local machine or server
  ssh-keygen -t ed25519 -C "gitlab-ci@talentbinder" -f gitlab-ci-key -N ""
  ```

- [ ] View and copy the public key
  ```bash
  cat gitlab-ci-key.pub
  ```

- [ ] View and copy the private key (keep secure!)
  ```bash
  cat gitlab-ci-key
  ```

### 2.2 Add Public Key to Server

- [ ] SSH to production server
  ```bash
  ssh user@www.lab.local
  ```

- [ ] Add public key to authorized_keys
  ```bash
  mkdir -p ~/.ssh
  chmod 700 ~/.ssh
  
  # Paste the public key content here:
  echo "ssh-ed25519 AAAA... gitlab-ci@talentbinder" >> ~/.ssh/authorized_keys
  
  chmod 600 ~/.ssh/authorized_keys
  ```

- [ ] Test SSH connection from local machine
  ```bash
  ssh -i gitlab-ci-key user@www.lab.local
  exit
  ```

### 2.3 Configure GitLab CI/CD Variables

Go to: **GitLab → Your Project → Settings → CI/CD → Variables**

- [ ] Add `SSH_PRIVATE_KEY`
  - **Value:** Paste entire private key content (including `-----BEGIN` and `-----END` lines)
  - **Type:** Variable
  - **Protected:** ✅ Yes
  - **Masked:** ✅ Yes

- [ ] Add `SERVER_USER`
  - **Value:** Your SSH username (e.g., `deploy` or `root`)
  - **Type:** Variable
  - **Protected:** ✅ Yes
  - **Masked:** ❌ No

- [ ] Add `SERVER_HOST`
  - **Value:** `www.lab.local` (or your server hostname/IP)
  - **Type:** Variable
  - **Protected:** ✅ Yes
  - **Masked:** ❌ No

- [ ] Add `BACKEND_DEPLOY_DIR`
  - **Value:** `/var/www/talentbinder-backend`
  - **Type:** Variable
  - **Protected:** ❌ No
  - **Masked:** ❌ No

- [ ] Add `FRONTEND_DEPLOY_DIR`
  - **Value:** `/var/www/talentbinder-frontend`
  - **Type:** Variable
  - **Protected:** ❌ No
  - **Masked:** ❌ No

- [ ] Add `BACKEND_SERVICE_NAME`
  - **Value:** `talentbinder-backend`
  - **Type:** Variable
  - **Protected:** ❌ No
  - **Masked:** ❌ No

---

## Phase 3: Server Setup

### 3.1 Install Prerequisites

- [ ] SSH to production server
  ```bash
  ssh user@www.lab.local
  ```

- [ ] Install Node.js 20
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  node -v  # Should show v20.x.x
  ```

- [ ] Install nginx (for frontend)
  ```bash
  sudo apt-get install -y nginx
  sudo systemctl start nginx
  sudo systemctl enable nginx
  ```

- [ ] Verify PostgreSQL is running (for backend)
  ```bash
  sudo systemctl status postgresql
  ```

### 3.2 Create Deployment Directories

- [ ] Create backend deployment directory
  ```bash
  sudo mkdir -p /var/www/talentbinder-backend
  sudo chown -R $USER:$USER /var/www/talentbinder-backend
  ```

- [ ] Create frontend deployment directory
  ```bash
  sudo mkdir -p /var/www/talentbinder-frontend
  sudo chown -R www-data:www-data /var/www/talentbinder-frontend
  ```

### 3.3 Deploy Scripts to Server

- [ ] Copy deployment scripts from local machine
  ```bash
  # From your local machine
  scp c:\Users\leiff\vscProjects\talentbinder-monorepo\scripts\gitlab-deploy.sh user@www.lab.local:~/
  scp c:\Users\leiff\vscProjects\talentbinder-monorepo\scripts\setup-backend-service.sh user@www.lab.local:~/
  ```

- [ ] Move scripts to system location (on server)
  ```bash
  sudo mv ~/gitlab-deploy.sh /usr/local/bin/
  sudo mv ~/setup-backend-service.sh /usr/local/bin/
  sudo chmod +x /usr/local/bin/gitlab-deploy.sh
  sudo chmod +x /usr/local/bin/setup-backend-service.sh
  ```

- [ ] Verify scripts are accessible
  ```bash
  which gitlab-deploy.sh
  which setup-backend-service.sh
  ```

### 3.4 Setup Backend Service

- [ ] Run backend service setup script
  ```bash
  sudo /usr/local/bin/setup-backend-service.sh
  ```

- [ ] Verify service was created
  ```bash
  sudo systemctl status talentbinder-backend
  ```

- [ ] Configure backend environment variables
  ```bash
  sudo nano /var/www/talentbinder-backend/.env
  ```
  
  Add required variables:
  ```bash
  NODE_ENV=production
  PORT=4000
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=talentbinder
  DB_USER=your_db_user
  DB_PASSWORD=your_db_password
  JWT_SECRET=your_jwt_secret
  FRONTEND_URL=https://talentbinder.yourdomain.com
  ```

### 3.5 Setup Frontend Web Server

- [ ] Create nginx configuration
  ```bash
  sudo nano /etc/nginx/sites-available/talentbinder-frontend
  ```

- [ ] Add nginx configuration (see below)

- [ ] Enable the site
  ```bash
  sudo ln -s /etc/nginx/sites-available/talentbinder-frontend /etc/nginx/sites-enabled/
  sudo nginx -t  # Test configuration
  sudo systemctl reload nginx
  ```

<details>
<summary>📄 Nginx Configuration Template</summary>

```nginx
server {
    listen 80;
    server_name talentbinder.yourdomain.com;
    
    root /var/www/talentbinder-frontend/dist;
    index index.html;
    
    # Frontend static files
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API proxy
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

</details>

---

## Phase 4: Test Deployment

### 4.1 Trigger First Pipeline

- [ ] Make a small change to trigger pipeline
  ```powershell
  # On your local machine
  cd c:\Users\leiff\vscProjects\talentbinder-monorepo
  
  # Make a test change
  echo "# Test" >> README.md
  
  git add README.md
  git commit -m "Test CI/CD pipeline"
  git push origin main
  ```

- [ ] Go to GitLab → CI/CD → Pipelines

- [ ] Watch the pipeline run

- [ ] Verify all stages complete successfully
  - ✅ install_dependencies
  - ✅ build_shared
  - ✅ build_backend
  - ✅ build_frontend
  - ✅ test_backend
  - ✅ test_frontend
  - ✅ deploy_backend
  - ✅ deploy_frontend

### 4.2 Verify Deployment

- [ ] Check backend service is running
  ```bash
  ssh user@www.lab.local "sudo systemctl status talentbinder-backend"
  ```

- [ ] View backend logs
  ```bash
  ssh user@www.lab.local "sudo journalctl -u talentbinder-backend -n 50 --no-pager"
  ```

- [ ] Test backend API
  ```bash
  curl http://www.lab.local:4000/api/health  # Or your health endpoint
  ```

- [ ] Check frontend files deployed
  ```bash
  ssh user@www.lab.local "ls -la /var/www/talentbinder-frontend/dist/"
  ```

- [ ] Test frontend in browser
  - Open: `http://talentbinder.yourdomain.com` (or your domain)
  - Verify page loads correctly
  - Check browser console for errors

### 4.3 Test Change Detection

- [ ] Make backend-only change
  ```powershell
  # Edit a backend file
  echo "// Test comment" >> packages/backend/src/index.ts
  git add packages/backend/src/index.ts
  git commit -m "Test backend-only deployment"
  git push origin main
  ```

- [ ] Verify in GitLab pipeline that only backend jobs run
  - ✅ build_backend
  - ✅ deploy_backend
  - ❌ build_frontend (skipped)
  - ❌ deploy_frontend (skipped)

- [ ] Make frontend-only change
  ```powershell
  # Edit a frontend file
  echo "// Test comment" >> packages/frontend/src/App.tsx
  git add packages/frontend/src/App.tsx
  git commit -m "Test frontend-only deployment"
  git push origin main
  ```

- [ ] Verify in GitLab pipeline that only frontend jobs run
  - ❌ build_backend (skipped)
  - ❌ deploy_backend (skipped)
  - ✅ build_frontend
  - ✅ deploy_frontend

---

## Phase 5: Production Readiness

### 5.1 Security

- [ ] Setup SSL/TLS certificates (Let's Encrypt)
  ```bash
  sudo apt-get install certbot python3-certbot-nginx
  sudo certbot --nginx -d talentbinder.yourdomain.com
  ```

- [ ] Configure firewall
  ```bash
  sudo ufw allow 22    # SSH
  sudo ufw allow 80    # HTTP
  sudo ufw allow 443   # HTTPS
  sudo ufw enable
  ```

- [ ] Secure SSH (optional but recommended)
  ```bash
  # Disable password authentication
  sudo nano /etc/ssh/sshd_config
  # Set: PasswordAuthentication no
  sudo systemctl restart sshd
  ```

### 5.2 Monitoring

- [ ] Setup log rotation
  ```bash
  sudo nano /etc/logrotate.d/talentbinder
  ```
  
  Add:
  ```
  /var/www/talentbinder-backend/*.log {
      daily
      rotate 14
      compress
      delaycompress
      missingok
      notifempty
  }
  ```

- [ ] Test backend service restart
  ```bash
  sudo systemctl restart talentbinder-backend
  sudo systemctl status talentbinder-backend
  ```

- [ ] Monitor resource usage
  ```bash
  htop  # Install with: sudo apt-get install htop
  ```

### 5.3 Documentation

- [ ] Update deployment URLs in documentation
  - Edit `docs/DEPLOYMENT.md`
  - Edit `docs/QUICK_REFERENCE.md`
  - Update API URLs in `.env` files

- [ ] Document server credentials (in secure location)
  - Server IP/hostname
  - SSH username
  - Database credentials
  - Any API keys

- [ ] Share documentation with team
  - CI/CD pipeline documentation
  - Deployment procedures
  - Rollback procedures
  - Emergency contacts

---

## Phase 6: Team Onboarding

### 6.1 Developer Setup

- [ ] Share repository access
  - Add developers to GitLab project
  - Set appropriate permission levels

- [ ] Share documentation
  - `docs/QUICK_REFERENCE.md` - Quick start guide
  - `docs/CI_CD_PIPELINE.md` - Detailed pipeline docs
  - `docs/DEPLOYMENT.md` - Deployment configuration

### 6.2 Training

- [ ] Demonstrate development workflow
  - Making changes
  - Local testing
  - Committing and pushing
  - Watching pipeline

- [ ] Demonstrate monitoring
  - Checking pipeline status
  - Viewing logs
  - Verifying deployments

- [ ] Practice rollback procedure
  - Identifying issues
  - Stopping service
  - Restoring from backup
  - Restarting service

---

## Troubleshooting Common Issues

### Pipeline Fails: SSH Connection

**Symptoms:** `Permission denied (publickey)`

**Fix:**
1. Verify SSH key in GitLab variables is correct
2. Verify public key is in server's `~/.ssh/authorized_keys`
3. Test SSH manually with the same key

### Backend Service Won't Start

**Symptoms:** Service fails immediately after deployment

**Fix:**
1. Check logs: `sudo journalctl -u talentbinder-backend -n 100`
2. Verify `.env` file exists and is correct
3. Check database connection
4. Verify Node.js version

### Frontend Shows 404

**Symptoms:** Nginx returns 404 for all routes

**Fix:**
1. Check nginx configuration
2. Verify files in `/var/www/talentbinder-frontend/dist/`
3. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
4. Reload nginx: `sudo systemctl reload nginx`

### Deployment Takes Too Long

**Symptoms:** Pipeline timeout or very slow

**Fix:**
1. Check server disk space: `df -h`
2. Check server memory: `free -h`
3. Optimize GitLab cache settings
4. Consider using GitLab Runner on the server itself

---

## Maintenance Schedule

### Daily
- [ ] Monitor pipeline status
- [ ] Check for failed deployments

### Weekly
- [ ] Review deployment logs
- [ ] Check disk space on server
- [ ] Review security logs

### Monthly
- [ ] Update dependencies
- [ ] Review and update documentation
- [ ] Test backup/restore procedures
- [ ] Clean up old deployment backups

### Quarterly
- [ ] Security audit
- [ ] Performance review
- [ ] Update CI/CD scripts if needed
- [ ] Team training refresh

---

## ✅ Setup Complete!

If all items are checked, your CI/CD pipeline is ready for production use!

**Next Steps:**
1. Make your first real feature change
2. Watch it automatically deploy
3. Celebrate! 🎉

**Resources:**
- [CI/CD Pipeline Documentation](../docs/CI_CD_PIPELINE.md)
- [Quick Reference Guide](../docs/QUICK_REFERENCE.md)
- [Deployment Configuration](../docs/DEPLOYMENT.md)
