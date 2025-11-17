# TalentBinder Backend

Express.js backend API with PostgreSQL database.

## 🚀 Quick Start

### Local Development
```bash
# From monorepo root
npm install
npm run dev:backend

# Or from this directory
cd packages/backend
npm install
npm run dev
```

### Environment Variables
Create a `.env` file (see `.env.development` for template):
```ini
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://user:pass@localhost:5432/talentBinder_db
JWT_SECRET=your-dev-secret
```

## 📦 Scripts

```json
{
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

## 🏗️ Project Structure

```
src/
├── index.ts           # Entry point
├── config/            # DB & LDAP config
├── middleware/        # Auth, logging
├── routes/            # API endpoints
└── utils/             # Helpers
```

## 🔌 API Endpoints

- `POST /auth/login` - User authentication
- `GET /candidates` - List candidates
- `POST /candidates` - Create candidate
- `GET /events` - List events
- ... (see route files for complete list)

## 🚢 Deployment

**Automated via GitLab CI/CD** - See [CI_CD_PIPELINE.md](../../docs/CI_CD_PIPELINE.md)

The backend automatically deploys to production when changes are pushed to `main`:
1. CI builds TypeScript → JavaScript
2. CI packages artifacts + `setup.sh`
3. CI deploys to `/var/www/talentbinder-backend`
4. `setup.sh` installs dependencies & restarts systemd service

### Manual Deployment (if needed)
```bash
# On server
cd /var/www/talentbinder-backend
sudo ./setup.sh
```

## 🔧 Production Configuration

The backend runs as a systemd service (managed automatically by CI/CD).

**Service management:**
```bash
sudo systemctl status talentbinder-backend
sudo journalctl -u talentbinder-backend -f
```

See [scripts/README.md](../../scripts/README.md) for troubleshooting.

## 🧪 Testing

```bash
npm run test  # (not yet implemented)
```

## 📚 Documentation

- [Authentication](../../docs/AUTHENTICATION.md)
- [Environment Configuration](../../docs/ENV_CONFIGURATION.md)
- [CI/CD Pipeline](../../docs/CI_CD_PIPELINE.md)
