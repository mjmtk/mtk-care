# Development Environment Setup: Lessons Learned

This document captures key insights from troubleshooting development environment setup issues and analyzing existing setup scripts.

## Key Issues Encountered and Solutions

### 1. Django BASE_DIR Path Resolution
**Issue**: Django couldn't find the `.env` file because `BASE_DIR` was incorrectly going up 4 parent directories instead of 3.

**Root Cause**: The path calculation in `config/settings/base.py`:
```python
# Wrong (looking in /home/mj/dev/mtk-care/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent

# Correct (looking in /home/mj/dev/mtk-care/backend/)
BASE_DIR = Path(__file__).resolve().parent.parent.parent
```

**Lesson**: Always verify BASE_DIR points to the Django project root (where manage.py is located).

### 2. Environment Variable Naming Mismatch
**Issue**: Database connection failed with "no password supplied" error.

**Root Cause**: Multiple environment variable naming conventions:
- Docker env files used: `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Django settings expected: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`

**Solution**: Ensure consistency between environment files and Django settings, or support both naming conventions.

### 3. Docker vs Local Development Database Connection
**Issue**: When running Django locally but PostgreSQL in Docker, connection failed using `postgres` hostname.

**Solution**: 
- Docker-to-Docker: Use container name (`postgres`)
- Local-to-Docker: Use `localhost`

### 4. Virtual Environment Management
**Issue**: Commands failed because virtual environment wasn't activated.

**Lesson**: Always check for and activate the virtual environment before running Python commands:
```bash
source .venv/bin/activate  # or backend/.venv/bin/activate
```

### 5. Django Settings Module
**Issue**: Django didn't know which settings to use.

**Solution**: Set `DJANGO_SETTINGS_MODULE=config.settings.development` in `.env` file.

## Comprehensive Development Setup Checklist

### 1. Environment Files Structure
```
backend/
├── .env                    # Local development (git-ignored)
├── .env.example           # Template for developers
└── docker/
    └── envs/
        ├── backend.env    # Docker-specific backend env
        ├── postgres.env   # PostgreSQL container env
        └── frontend.env   # Frontend container env
```

### 2. Required Environment Variables

#### Backend (.env)
```bash
# Django Core
DJANGO_SECRET_KEY=<50+ character secret>
DJANGO_SETTINGS_MODULE=config.settings.development
DJANGO_DEBUG=True

# Database (both naming conventions for compatibility)
DB_CONNECTION_TYPE=local
POSTGRES_DB=mtk_care_mj
POSTGRES_USER=mtk_mj
POSTGRES_PASSWORD=<password>
POSTGRES_HOST=localhost  # or 'postgres' if in Docker
POSTGRES_PORT=5432

# Alternative: Use DATABASE_URL
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Authentication
AUTH_BYPASS_MODE=true  # For development without Azure AD

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

#### Frontend (.env)
```bash
# API Configuration
NEXT_PUBLIC_PROD_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEV_API_BASE_URL=http://localhost:8000

# Authentication
NEXT_PUBLIC_AUTH_BYPASS_MODE=true
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=development-bypass
NEXTAUTH_SECRET=<secret>
```

### 3. Development Modes

#### Mode 1: Full Docker Development
```bash
cd scripts/docker-dev-setup
./setup-dev-environment.sh
# Everything runs in containers
```

#### Mode 2: Native Development (Recommended for debugging)
```bash
cd scripts/docker-dev-setup
./setup-native-development.sh
# Creates start-dev.sh, start-backend.sh, start-frontend.sh
```

#### Mode 3: Hybrid (Our Current Setup)
- PostgreSQL & Redis in Docker
- Django & Next.js running locally
- Best for active development with debugger access

### 4. Startup Commands

#### Docker Services Only
```bash
docker compose -f docker-compose.dev.yml up postgres redis
```

#### Django (Local)
```bash
cd backend
source .venv/bin/activate
python manage.py runserver 0.0.0.0:8000  # For remote access
```

#### Next.js (Local)
```bash
cd frontend
npm run dev
```

### 5. Remote VPS Development

When developing on a remote VPS and accessing from local machine:

1. **Django**: Add to `development.py`:
   ```python
   ALLOWED_HOSTS = ['*']  # Only for development!
   ```

2. **Run servers on all interfaces**:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   npm run dev -- --hostname 0.0.0.0
   ```

3. **Access from local machine**:
   - Django: `http://YOUR_VPS_IP:8000`
   - Next.js: `http://YOUR_VPS_IP:3000`

## Setup Script Improvements

Based on our experience, the setup scripts should:

1. **Validate environment files** after creation
2. **Check Python virtual environment** activation
3. **Verify database connectivity** before starting services
4. **Support multiple environment templates** (Docker, Native, Hybrid)
5. **Add troubleshooting script** that checks common issues:
   - Environment variables loaded correctly
   - Database connection working
   - Ports available
   - Virtual environment activated

## Quick Troubleshooting Guide

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Test connection from Django
cd backend
source .venv/bin/activate
python -c "import django; django.setup(); from django.db import connection; connection.ensure_connection(); print('Connected!')"
```

### Environment Variable Issues
```bash
# Check what Django sees
python -c "import os; print('DB_HOST:', os.environ.get('POSTGRES_HOST'))"

# Verify .env is being loaded
python -c "from pathlib import Path; print('Looking for .env at:', Path.cwd() / '.env')"
```

### Port Conflicts
```bash
# Check what's using ports
lsof -i :8000  # Django
lsof -i :3000  # Next.js
lsof -i :5432  # PostgreSQL
```

## Recommendations

1. **Use provided setup scripts** - They handle all these issues automatically
2. **Keep environment files synchronized** - Update both .env and docker/envs/ when changing settings
3. **Document your development mode** - Make it clear whether using Docker, Native, or Hybrid
4. **Create a setup verification script** - Validate all components before starting development
5. **Maintain .env.example files** - Keep them updated with all required variables

The existing setup scripts are well-designed and would have prevented all the issues encountered. The key is to use them rather than manual setup.