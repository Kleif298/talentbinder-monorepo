# Deployment Scripts

This directory contains setup scripts for the TalentBinder application deployment.

## Scripts Overview

### `setup-backend-service.sh`

One-time setup script for configuring the backend as a systemd service.

**Purpose:** Creates and configures a systemd service to run the TalentBinder backend.

**Features:**
- Creates systemd service file
- Configures automatic restart on failure
- Sets up proper environment variables
- Enables service to start on boot
- Manages service lifecycle

**Usage:**
```bash
# On the production server (one-time setup):
sudo ./setup-backend-service.sh
```

**Run this:**
- Once during initial server setup
- After major configuration changes
- When setting up a new server

---

## Package-Level Setup Scripts

Each package has its own `setup.sh` script that is run during CI/CD deployment:

### `packages/backend/setup.sh`

Automatically run during backend deployment. This script:
- Creates/updates the systemd service
- Installs production dependencies
- Checks for .env file
- Restarts the backend service

### `packages/frontend/setup.sh`

Automatically run during frontend deployment. This script:
- Sets correct file permissions for web server
- Reloads nginx/apache2

---

## Server Setup Instructions

### Initial Setup (One Time)

1. **Install Node.js 20:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   node -v  # Should show v20.x.x
   ```

2. **Create deployment directories:**
   ```bash
   sudo mkdir -p /var/www/talentbinder-backend
   sudo mkdir -p /var/www/talentbinder-frontend
   ```

3. **Install nginx (for frontend):**
   ```bash
   sudo apt-get install -y nginx
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

4. **Configure nginx** (see CI_CD_PIPELINE.md for configuration)

5. **Setup backend environment file:**
   ```bash
   sudo nano /var/www/talentbinder-backend/.env
   ```
   Add required variables (see ENV_CONFIGURATION.md)

---

## How CI/CD Works

The deployment process is **simple and automatic**:

1. **GitLab Runner** builds the application
2. **Runner creates** a deployment package with build artifacts + setup.sh
3. **Runner copies** package to server via SCP
4. **Runner extracts** package in deployment directory
5. **Runner executes** the package's `setup.sh` script
6. **setup.sh** installs dependencies and restarts services

### Backend Deployment Flow

```yaml
build_backend:
  - Build backend
  - Create artifacts: dist/, package.json, setup.sh, .env.render

deploy_backend:
  - Package artifacts into tar.gz
  - Copy to server: /tmp/backend-deploy.tar.gz
  - Extract in: /var/www/talentbinder-backend
  - Run: ./setup.sh
  - Service automatically restarts
```

### Frontend Deployment Flow

```yaml
build_frontend:
  - Build frontend
  - Create artifacts: dist/, setup.sh

deploy_frontend:
  - Package artifacts into tar.gz
  - Copy to server: /tmp/frontend-deploy.tar.gz
  - Extract in: /var/www/talentbinder-frontend
  - Run: ./setup.sh
  - Nginx automatically reloads
```

---

## Troubleshooting

### Service Won't Start

**Problem:** Backend service fails to start after deployment

**Solution:**
```bash
# Check service status
sudo systemctl status talentbinder-backend

# View logs
sudo journalctl -u talentbinder-backend -n 100 --no-pager

# Common issues:
# - Missing .env file
# - Database connection issues
# - Port already in use
# - Node.js not found
```

### Frontend Shows 404

**Problem:** Nginx returns 404 for all routes

**Solution:**
```bash
# Check if files exist
ls -la /var/www/talentbinder-frontend/dist/

# Check nginx configuration
sudo nginx -t

# View nginx logs
sudo tail -f /var/log/nginx/error.log

# Reload nginx
sudo systemctl reload nginx
```

### Permission Denied

**Problem:** setup.sh fails with permission errors

**Solution:**
```bash
# Make sure deployment directories have correct ownership
sudo chown -R root:root /var/www/talentbinder-backend
sudo chown -R www-data:www-data /var/www/talentbinder-frontend

# Make setup.sh executable
sudo chmod +x /var/www/talentbinder-backend/setup.sh
sudo chmod +x /var/www/talentbinder-frontend/setup.sh
```

---

## Useful Commands

### Backend Service Management

```bash
# Check status
sudo systemctl status talentbinder-backend

# View live logs
sudo journalctl -u talentbinder-backend -f

# View recent logs
sudo journalctl -u talentbinder-backend -n 100 --no-pager

# Restart service
sudo systemctl restart talentbinder-backend

# Stop/Start service
sudo systemctl stop talentbinder-backend
sudo systemctl start talentbinder-backend

# Check if service is running
sudo systemctl is-active talentbinder-backend
```

### Frontend Management

```bash
# Check nginx status
sudo systemctl status nginx

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# View access logs
sudo tail -f /var/log/nginx/access.log

# View error logs
sudo tail -f /var/log/nginx/error.log

# Check deployment directory
ls -la /var/www/talentbinder-frontend/dist/
```

### General Server Management

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep node
ps aux | grep nginx

# Check open ports
sudo netstat -tulpn | grep LISTEN

# View system logs
sudo journalctl -xe
```

---

## Directory Structure on Server

After deployment, the server will have:

```
/var/www/
├── talentbinder-backend/
│   ├── dist/                    # Built backend code
│   ├── node_modules/            # Production dependencies
│   ├── package.json
│   ├── package-lock.json
│   ├── setup.sh                 # Setup script
│   └── .env                     # Environment config
│
└── talentbinder-frontend/
    ├── dist/                    # Built frontend files
    │   ├── index.html
    │   ├── assets/
    │   └── ...
    └── setup.sh                 # Setup script
```

---

## Security Notes

1. **Scripts run as root** - Setup scripts use `sudo` for system operations
2. **SSH keys** - GitLab CI uses SSH keys to authenticate (stored in GitLab variables)
3. **File permissions** - Scripts set appropriate ownership and permissions
4. **Environment variables** - Never commit secrets, use server's .env file

---

For complete CI/CD documentation, see:
- [CI_CD_PIPELINE.md](../docs/CI_CD_PIPELINE.md) - Complete pipeline documentation
- [CI_CD_SETUP_CHECKLIST.md](../docs/CI_CD_SETUP_CHECKLIST.md) - Setup checklist
- [QUICK_REFERENCE.md](../docs/QUICK_REFERENCE.md) - Quick reference guide
