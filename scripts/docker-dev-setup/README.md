# MTK Care Docker Development Environment Setup

This directory contains scripts to set up a complete Dockerized development environment for the MTK Care application.

## Prerequisites

If Docker is not installed on your system (common on fresh VPS installations):

```bash
# For Ubuntu/Debian systems - install Docker first
./install-docker-ubuntu.sh

# Then log out and back in, or run:
newgrp docker
```

## Quick Start

```bash
# Full setup with prompts
./setup-dev-environment.sh

# Quick demo setup (insecure credentials)
./setup-dev-environment.sh --demo --yes

# Setup without rebuilding Docker images
./setup-dev-environment.sh --skip-build
```

## Scripts Overview

### 1. `setup-dev-environment.sh` (Main Orchestrator)
The main script that runs all other scripts in sequence. Use this for complete setup.

**Options:**
- `--skip-prereq`: Skip prerequisite checks
- `--skip-build`: Skip Docker image building
- `--demo`: Use demo credentials (insecure, for testing only)
- `--yes`, `-y`: Auto-confirm all prompts
- `--help`, `-h`: Show help message

### 2. Individual Scripts (Run Independently)

#### `install-docker-ubuntu.sh`
Installs Docker and Docker Compose on Ubuntu/Debian systems:
- Installs docker.io package and docker-compose plugin
- Adds user to docker group for sudo-less operation
- Installs additional tools (jq, curl, git)
- Provides security recommendations

#### `check-prerequisites.sh`
Verifies system requirements:
- Docker and Docker Compose installation
- Required ports availability (3000, 8000, 5432, 6379)
- Disk space (5GB minimum)
- Memory requirements (4GB recommended)

#### `setup-environment-vars.sh`
Creates environment configuration files:
- Generates secure secrets for Django and NextAuth
- Sets up per-developer database credentials
- Creates env files for all services
- Updates .gitignore

**Options:**
- `--demo`: Use demo credentials instead of generating secure ones

#### `setup-docker-compose.sh`
Sets up Docker infrastructure:
- Creates Docker Compose configuration with code-server
- Generates Dockerfiles for development
- Sets up volume directories
- Creates helper scripts

#### `setup-code-server.sh`
Configures LinuxServer code-server (Web IDE):
- Sets up VS Code workspace with MTK Care extensions
- Generates secure access credentials
- Configures development environment settings
- Creates startup scripts for automatic extension installation

**Options:**
- `--demo`: Use demo credentials instead of generating secure ones

#### `initialize-database.sh`
Initializes the database:
- Runs Django migrations
- Loads initial fixtures
- Creates superuser account
- Optionally creates sample data

#### `verify-setup.sh`
Verifies the installation:
- Checks all containers are running
- Tests service connectivity
- Validates API endpoints
- Displays service URLs

## Helper Functions

After setup, source the helper functions:

```bash
source scripts/docker-dev-setup/docker-helpers.sh
```

Available functions:
- `django_manage [command]`: Run Django management commands
- `django_shell`: Access Django shell
- `backend_test [args]`: Run backend tests
- `psql_shell`: Access PostgreSQL shell
- `dev_logs [service]`: View service logs
- `dev_restart [service]`: Restart a service
- `dev_rebuild [service]`: Rebuild and restart a service

## Directory Structure

After setup, the following structure is created:

```
mtk-care/
├── docker/
│   ├── envs/                    # Environment files (git-ignored)
│   │   ├── backend.env
│   │   ├── frontend.env
│   │   ├── postgres.env
│   │   ├── redis.env
│   │   ├── code-server.env
│   │   ├── .developer-config
│   │   └── .code-server-credentials
│   ├── env-templates/           # Environment templates
│   ├── volumes/                 # Docker volumes (git-ignored)
│   │   ├── postgres/
│   │   ├── redis/
│   │   └── code-server/         # Code-server config and workspace
│   └── nginx/                   # Nginx configuration
├── docker-compose.dev.yml       # Main Docker Compose file
├── docker-compose.override.yml  # Developer overrides (git-ignored)
├── backend/Dockerfile.dev       # Backend development Dockerfile
└── frontend/Dockerfile.dev      # Frontend development Dockerfile
```

## Common Commands

### Start all services
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Stop all services
```bash
docker-compose -f docker-compose.dev.yml down
```

### View logs
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Access containers
```bash
# Django shell
docker-compose -f docker-compose.dev.yml exec backend python manage.py shell

# PostgreSQL
docker-compose -f docker-compose.dev.yml exec postgres psql -U mtk_dev mtk_care_dev

# Bash shell in container
docker-compose -f docker-compose.dev.yml exec backend bash
```

## Service URLs

After setup, services are available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/v1/
- **Django Admin**: http://localhost:8000/admin/
- **Code-server (Web IDE)**: http://localhost:8080
- **API Docs**: http://localhost:8000/api/docs/

## Troubleshooting

### Port conflicts
If ports are already in use, either:
1. Stop conflicting services, or
2. Modify port mappings in `docker-compose.dev.yml`

Default ports used:
- 3000: Next.js frontend
- 8000: Django backend
- 8080: Code-server Web IDE
- 5432: PostgreSQL
- 6379: Redis

### Container startup issues
```bash
# Check container status
docker-compose -f docker-compose.dev.yml ps

# View detailed logs
docker-compose -f docker-compose.dev.yml logs backend

# Restart specific service
docker-compose -f docker-compose.dev.yml restart backend
```

### Database connection issues
```bash
# Check if PostgreSQL is ready
docker-compose -f docker-compose.dev.yml exec postgres pg_isready

# Manually run migrations
docker-compose -f docker-compose.dev.yml exec backend python manage.py migrate
```

### Clean slate setup
```bash
# Stop and remove all containers, volumes
docker-compose -f docker-compose.dev.yml down -v

# Remove environment files
rm -rf docker/envs/

# Run setup again
./setup-dev-environment.sh
```

## Security Notes

- The `--demo` flag uses insecure credentials - NEVER use in production
- Generated passwords are stored in `docker/envs/` - keep these secure
- Superuser credentials are saved to `.superuser-credentials` - save and delete
- Code-server credentials are saved to `.code-server-credentials` - save and delete
- All sensitive files are git-ignored by default
- Code-server is accessible only from localhost by default

## Customization

### Per-developer overrides
Create `docker-compose.override.yml` for personal customizations:

```yaml
version: '3.8'
services:
  frontend:
    ports:
      - "3001:3000"  # Use different port
  backend:
    volumes:
      - ./my-scripts:/app/scripts  # Mount additional directories
  code-server:
    ports:
      - "8081:8443"  # Use different port for Web IDE
```

### Environment variables
Modify files in `docker/envs/` to customize settings. These files are not tracked by git.

## Contributing

When modifying these scripts:
1. Test each script independently
2. Ensure scripts are idempotent (can be run multiple times)
3. Add appropriate error handling
4. Update this README with any new features