#!/bin/bash

# setup-docker-compose.sh - Set up Docker Compose configuration
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." &> /dev/null && pwd )"

echo "Setting up Docker Compose configuration..."
echo "========================================"

# Create Docker directories
echo -e "\n${BLUE}Creating Docker directories...${NC}"
mkdir -p "$PROJECT_ROOT/docker/volumes/postgres"
mkdir -p "$PROJECT_ROOT/docker/volumes/redis"
mkdir -p "$PROJECT_ROOT/docker/nginx"

# Create Dockerfiles
echo -e "\n${BLUE}Creating Dockerfiles...${NC}"

# Backend Dockerfile
cat > "$PROJECT_ROOT/backend/Dockerfile.dev" << 'EOF'
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    python3-dev \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy project
COPY . .

# Create media and static directories
RUN mkdir -p /app/media /app/staticfiles

# Run Django development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
EOF

# Frontend Dockerfile
cat > "$PROJECT_ROOT/frontend/Dockerfile.dev" << 'EOF'
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]
EOF

echo -e "${GREEN}✓${NC} Created Dockerfiles"

# Create docker-compose.dev.yml
echo -e "\n${BLUE}Creating docker-compose.dev.yml...${NC}"

cat > "$PROJECT_ROOT/docker-compose.dev.yml" << 'EOF'
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: mtk_postgres
    env_file:
      - ./docker/envs/postgres.env
    volumes:
      - ./docker/volumes/postgres:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - mtk_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: mtk_redis
    command: >
      sh -c 'if [ -n "$${REDIS_PASSWORD}" ]; then
        redis-server --requirepass $${REDIS_PASSWORD}
      else
        redis-server
      fi'
    env_file:
      - ./docker/envs/redis.env
    volumes:
      - ./docker/volumes/redis:/data
    ports:
      - "6379:6379"
    networks:
      - mtk_network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Django Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: mtk_backend
    env_file:
      - ./docker/envs/backend.env
    volumes:
      - ./backend:/app
      - backend_static:/app/staticfiles
      - backend_media:/app/media
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - mtk_network
    command: >
      sh -c "
        echo 'Waiting for database...' &&
        while ! nc -z postgres 5432; do sleep 1; done &&
        echo 'Database is ready!' &&
        python manage.py migrate &&
        python manage.py runserver 0.0.0.0:8000
      "

  # Next.js Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: mtk_frontend
    env_file:
      - ./docker/envs/frontend.env
    environment:
      - NODE_ENV=development
      - WATCHPACK_POLLING=true
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - mtk_network
    command: npm run dev

  # LinuxServer Code-Server (Web-based VS Code)
  code-server:
    image: lscr.io/linuxserver/code-server:latest
    container_name: mtk_code_server
    env_file:
      - ./docker/envs/code-server.env
    environment:
      - GIT_USER_NAME=${DEVELOPER_NAME:-developer}
      - GIT_USER_EMAIL=${DEVELOPER_EMAIL:-developer@mtk-care.local}
    volumes:
      - ./docker/volumes/code-server/config:/config
      - .:/workspace:cached
      - /var/run/docker.sock:/var/run/docker.sock:ro
    ports:
      - "8080:8443"
    networks:
      - mtk_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8443"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  backend_static:
  backend_media:

networks:
  mtk_network:
    driver: bridge
EOF

echo -e "${GREEN}✓${NC} Created docker-compose.dev.yml"

# Create docker-compose override template
echo -e "\n${BLUE}Creating docker-compose.override.yml template...${NC}"

cat > "$PROJECT_ROOT/docker-compose.override.yml.template" << 'EOF'
# docker-compose.override.yml
# This file is for developer-specific overrides
# Copy to docker-compose.override.yml and customize

version: '3.8'

services:
  backend:
    # Example: Mount additional volumes
    # volumes:
    #   - ./my-scripts:/app/scripts

  frontend:
    # Example: Change port mapping
    # ports:
    #   - "3001:3000"

  # Example: Add additional services
  # mailhog:
  #   image: mailhog/mailhog
  #   ports:
  #     - "1025:1025"
  #     - "8025:8025"
  #   networks:
  #     - mtk_network
EOF

echo -e "${GREEN}✓${NC} Created docker-compose.override.yml template"

# Create helper scripts
echo -e "\n${BLUE}Creating helper scripts...${NC}"

# Create docker helper script
cat > "$PROJECT_ROOT/scripts/docker-dev-setup/docker-helpers.sh" << 'EOF'
#!/bin/bash

# Docker helper functions for MTK Care development

# Get the project root directory
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )/../.." &> /dev/null && pwd )"

# Function to run Django management commands
django_manage() {
    docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" exec backend python manage.py "$@"
}

# Function to access Django shell
django_shell() {
    docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" exec backend python manage.py shell
}

# Function to run backend tests
backend_test() {
    docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" exec backend python manage.py test "$@"
}

# Function to access PostgreSQL
psql_shell() {
    docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" exec postgres psql -U ${DB_USER:-mtk_dev} ${DB_NAME:-mtk_care_dev}
}

# Function to view logs
dev_logs() {
    docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" logs -f "$@"
}

# Function to restart a service
dev_restart() {
    docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" restart "$@"
}

# Function to rebuild a service
dev_rebuild() {
    docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" up -d --build "$@"
}

# Print available commands
if [ "$1" == "help" ]; then
    echo "Available helper functions:"
    echo "  django_manage [command]  - Run Django management command"
    echo "  django_shell            - Access Django shell"
    echo "  backend_test [args]     - Run backend tests"
    echo "  psql_shell              - Access PostgreSQL shell"
    echo "  dev_logs [service]      - View service logs"
    echo "  dev_restart [service]   - Restart a service"
    echo "  dev_rebuild [service]   - Rebuild and restart a service"
fi
EOF

chmod +x "$PROJECT_ROOT/scripts/docker-dev-setup/docker-helpers.sh"

echo -e "${GREEN}✓${NC} Created helper scripts"

# Create nginx configuration (optional)
echo -e "\n${BLUE}Creating nginx configuration (optional)...${NC}"

cat > "$PROJECT_ROOT/docker/nginx/nginx.dev.conf" << 'EOF'
# Nginx configuration for development (optional)
# This can be used if you want to test nginx routing locally

upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name localhost;

    # Frontend requests
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API requests
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Django admin
    location /admin {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /static {
        proxy_pass http://backend;
    }

    # Media files
    location /media {
        proxy_pass http://backend;
    }
}
EOF

echo -e "${GREEN}✓${NC} Created nginx configuration"

# Summary
echo -e "\n${GREEN}Docker Compose setup complete!${NC}"
echo "=============================="
echo -e "Configuration files created:"
echo -e "  - ${BLUE}docker-compose.dev.yml${NC}"
echo -e "  - ${BLUE}backend/Dockerfile.dev${NC}"
echo -e "  - ${BLUE}frontend/Dockerfile.dev${NC}"
echo -e "  - ${BLUE}docker/nginx/nginx.dev.conf${NC} (optional)"
echo -e "  - ${BLUE}scripts/docker-dev-setup/docker-helpers.sh${NC}"
echo -e "\nTo start the development environment, run:"
echo -e "  ${YELLOW}docker compose -f docker-compose.dev.yml up${NC}"
echo -e "  OR (legacy): ${YELLOW}docker-compose -f docker-compose.dev.yml up${NC}"