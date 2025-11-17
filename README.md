# TalentBinder Monorepo

Recruitment management application with React frontend and Express backend.

## 🏗️ Project Structure

```
talentbinder-monorepo/
├── packages/
│   ├── backend/          # Express.js API
│   ├── frontend/         # React + Vite app
│   └── shared/           # Shared types & utilities
├── scripts/              # Deployment scripts
├── docs/                 # Documentation
└── sql/                  # Database schemas
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 14+

### Installation
```bash
# Install all dependencies
npm install

# Start development servers
npm run dev           # Both frontend & backend
npm run dev:backend   # Backend only
npm run dev:frontend  # Frontend only
```

### Environment Setup
Copy `.env.example` files in each package and configure:
- `packages/backend/.env` - Database, JWT secret
- `packages/frontend/.env` - API URL

See [QUICKSTART_ENV.md](docs/QUICKSTART_ENV.md) for details.

## 📦 Available Scripts

```bash
# Development
npm run dev              # Start both frontend & backend
npm run dev:backend      # Start backend only
npm run dev:frontend     # Start frontend only

# Building
npm run build            # Build all packages
npm run build:backend    # Build backend only
npm run build:frontend   # Build frontend only
npm run build:shared     # Build shared package

# Testing
npm run lint             # Lint all packages
```

## 🚢 Deployment

**Automated CI/CD via GitLab:**
- Push to `main` → Automatic deployment
- Only changed packages are rebuilt and deployed
- See [CI_CD_PIPELINE.md](docs/CI_CD_PIPELINE.md)

## 📚 Documentation

- **[QUICKSTART_ENV.md](docs/QUICKSTART_ENV.md)** - Environment setup guide
- **[CI_CD_PIPELINE.md](docs/CI_CD_PIPELINE.md)** - CI/CD documentation
- **[AUTHENTICATION.md](docs/AUTHENTICATION.md)** - Authentication flow
- **[QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)** - Command reference

### Package Documentation
- [Backend README](packages/backend/README.md)
- [Frontend README](packages/frontend/README.md)

## 🛠️ Tech Stack

**Frontend:**
- React 19
- TypeScript
- Vite
- React Router

**Backend:**
- Node.js
- Express
- TypeScript
- PostgreSQL

**Deployment:**
- GitLab CI/CD
- Nginx (frontend)
- Systemd (backend service)

## 👥 Team

Developed for TalentBinder recruitment management.

## 📄 License

[Add your license here]