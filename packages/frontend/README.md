# TalentBinder Frontend

React + TypeScript + Vite frontend application.

## 🚀 Quick Start

### Local Development
```bash
# From monorepo root
npm install
npm run dev:frontend

# Or from this directory
cd packages/frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`

### Environment Variables
Create a `.env` file:
```ini
VITE_API_URL=http://localhost:4000
```

## 📦 Scripts

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "lint": "eslint ."
}
```

## 🏗️ Project Structure

```
src/
├── App.tsx               # Main app component
├── main.tsx              # Entry point
├── api/                  # API client functions
├── components/           # Reusable components
├── pages/                # Page components
├── guards/               # Route protection
├── types/                # TypeScript types
└── utils/                # Helper functions
```

## 🎨 Key Features

- **Authentication** - JWT-based auth with protected routes
- **Candidate Management** - CRUD operations for candidates
- **Event Management** - Create and manage recruitment events
- **User Management** - Admin panel for user administration
- **Reporting** - Generate and view reports

## 🚢 Deployment

**Automated via GitLab CI/CD** - See [CI_CD_PIPELINE.md](../../docs/CI_CD_PIPELINE.md)

The frontend automatically deploys to production when changes are pushed to `main`:
1. CI builds React app → static files
2. CI packages `dist/` + `setup.sh`
3. CI deploys to `/var/www/talentbinder-frontend`
4. `setup.sh` sets permissions & reloads nginx

### Manual Deployment (if needed)
```bash
# On server
cd /var/www/talentbinder-frontend
sudo ./setup.sh
sudo systemctl reload nginx
```

## 🔧 Production Configuration

The frontend is served as static files by nginx.

**Web server management:**
```bash
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx
```

See [scripts/README.md](../../scripts/README.md) for troubleshooting.

## 🧪 Testing

```bash
npm run lint  # ESLint
```

## 📚 Documentation

- [Environment Configuration](../../docs/ENV_CONFIGURATION.md)
- [CI/CD Pipeline](../../docs/CI_CD_PIPELINE.md)
- [Quick Reference](../../docs/QUICK_REFERENCE.md)


