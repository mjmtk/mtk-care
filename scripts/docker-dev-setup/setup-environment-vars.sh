#!/bin/bash

# setup-environment-vars.sh - Set up environment variables for development
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

echo "Setting up environment variables for MTK Care development..."
echo "=========================================================="

# Function to generate a secure random string
generate_secret() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-50
}

# Function to prompt for input with default value
prompt_with_default() {
    local prompt=$1
    local default=$2
    local var_name=$3
    
    read -p "$prompt [$default]: " value
    value=${value:-$default}
    eval "$var_name='$value'"
}

# Function to create env file from template
create_env_file() {
    local template=$1
    local output=$2
    local vars=("${@:3}")
    
    cp "$template" "$output"
    
    for var in "${vars[@]}"; do
        local key="${var%%=*}"
        local value="${var#*=}"
        # Escape special characters for sed
        value=$(echo "$value" | sed 's/[[\.*^$()+?{|]/\\&/g')
        sed -i "s|{{$key}}|$value|g" "$output"
    done
}

# Check if running in demo mode
DEMO_MODE=false
if [ "$1" == "--demo" ]; then
    DEMO_MODE=true
    echo -e "${YELLOW}⚠ Running in DEMO mode - using default credentials${NC}"
    echo -e "${YELLOW}⚠ DO NOT use these credentials in production!${NC}\n"
fi

# Step 1: Get developer information
echo -e "\n${BLUE}Step 1: Developer Information${NC}"
echo "------------------------------"

if [ "$DEMO_MODE" = true ]; then
    DEVELOPER_NAME="demo"
    DEVELOPER_EMAIL="demo@mtk-care.local"
else
    prompt_with_default "Enter your name (for database/git)" "$USER" DEVELOPER_NAME
    prompt_with_default "Enter your email" "$USER@mtk-care.local" DEVELOPER_EMAIL
fi

# Step 2: Generate secrets
echo -e "\n${BLUE}Step 2: Generating Secrets${NC}"
echo "---------------------------"

if [ "$DEMO_MODE" = true ]; then
    DJANGO_SECRET_KEY="demo-secret-key-do-not-use-in-production"
    NEXTAUTH_SECRET="demo-nextauth-secret-do-not-use-in-production"
    DB_PASSWORD="demo_password_123"
    REDIS_PASSWORD="demo_redis_123"
else
    DJANGO_SECRET_KEY=$(generate_secret)
    NEXTAUTH_SECRET=$(generate_secret)
    DB_PASSWORD=$(generate_secret | cut -c1-20)
    REDIS_PASSWORD=$(generate_secret | cut -c1-20)
fi

echo -e "${GREEN}✓${NC} Generated secure secrets"

# Step 3: Set database configuration
echo -e "\n${BLUE}Step 3: Database Configuration${NC}"
echo "-------------------------------"

if [ "$DEMO_MODE" = true ]; then
    DB_NAME="mtk_care_demo"
    DB_USER="mtk_demo"
else
    DB_NAME="mtk_care_${DEVELOPER_NAME//[^a-zA-Z0-9]/_}"
    DB_USER="mtk_${DEVELOPER_NAME//[^a-zA-Z0-9]/_}"
fi

echo "Database name: $DB_NAME"
echo "Database user: $DB_USER"

# Step 4: Create environment files
echo -e "\n${BLUE}Step 4: Creating Environment Files${NC}"
echo "----------------------------------"

# Create templates if they don't exist
mkdir -p "$PROJECT_ROOT/docker/env-templates"

# Backend .env template
cat > "$PROJECT_ROOT/docker/env-templates/backend.env.template" << 'EOF'
# Django Settings
DJANGO_SECRET_KEY={{DJANGO_SECRET_KEY}}
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,backend,host.docker.internal

# Database
DB_NAME={{DB_NAME}}
DB_USER={{DB_USER}}
DB_PASSWORD={{DB_PASSWORD}}
DB_HOST=postgres
DB_PORT=5432

# Redis
REDIS_URL=redis://:{{REDIS_PASSWORD}}@redis:6379/0

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://frontend:3000

# Developer Info
DEVELOPER_NAME={{DEVELOPER_NAME}}
DEVELOPER_EMAIL={{DEVELOPER_EMAIL}}

# Azure AD (Development bypass mode)
AZURE_AD_CLIENT_ID=development-bypass
AZURE_AD_TENANT_ID=development-bypass
EOF

# Frontend .env template
cat > "$PROJECT_ROOT/docker/env-templates/frontend.env.template" << 'EOF'
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_PROD_API_BASE_URL=http://backend:8000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET={{NEXTAUTH_SECRET}}

# Azure AD (Development bypass mode)
NEXT_PUBLIC_AZURE_AD_CLIENT_ID=development-bypass
NEXT_PUBLIC_AZURE_AD_TENANT_ID=development-bypass

# Developer Info
NEXT_PUBLIC_DEVELOPER_NAME={{DEVELOPER_NAME}}
EOF

# PostgreSQL .env template
cat > "$PROJECT_ROOT/docker/env-templates/postgres.env.template" << 'EOF'
POSTGRES_DB={{DB_NAME}}
POSTGRES_USER={{DB_USER}}
POSTGRES_PASSWORD={{DB_PASSWORD}}
EOF

# Redis .env template
cat > "$PROJECT_ROOT/docker/env-templates/redis.env.template" << 'EOF'
REDIS_PASSWORD={{REDIS_PASSWORD}}
EOF

# Create actual env files
mkdir -p "$PROJECT_ROOT/docker/envs"

create_env_file \
    "$PROJECT_ROOT/docker/env-templates/backend.env.template" \
    "$PROJECT_ROOT/docker/envs/backend.env" \
    "DJANGO_SECRET_KEY=$DJANGO_SECRET_KEY" \
    "DB_NAME=$DB_NAME" \
    "DB_USER=$DB_USER" \
    "DB_PASSWORD=$DB_PASSWORD" \
    "REDIS_PASSWORD=$REDIS_PASSWORD" \
    "DEVELOPER_NAME=$DEVELOPER_NAME" \
    "DEVELOPER_EMAIL=$DEVELOPER_EMAIL"

create_env_file \
    "$PROJECT_ROOT/docker/env-templates/frontend.env.template" \
    "$PROJECT_ROOT/docker/envs/frontend.env" \
    "NEXTAUTH_SECRET=$NEXTAUTH_SECRET" \
    "DEVELOPER_NAME=$DEVELOPER_NAME"

create_env_file \
    "$PROJECT_ROOT/docker/env-templates/postgres.env.template" \
    "$PROJECT_ROOT/docker/envs/postgres.env" \
    "DB_NAME=$DB_NAME" \
    "DB_USER=$DB_USER" \
    "DB_PASSWORD=$DB_PASSWORD"

create_env_file \
    "$PROJECT_ROOT/docker/env-templates/redis.env.template" \
    "$PROJECT_ROOT/docker/envs/redis.env" \
    "REDIS_PASSWORD=$REDIS_PASSWORD"

echo -e "${GREEN}✓${NC} Created environment files in docker/envs/"

# Step 5: Create developer config file
echo -e "\n${BLUE}Step 5: Creating Developer Config${NC}"
echo "---------------------------------"

cat > "$PROJECT_ROOT/docker/envs/.developer-config" << EOF
# Developer configuration (DO NOT COMMIT)
DEVELOPER_NAME="$DEVELOPER_NAME"
DEVELOPER_EMAIL="$DEVELOPER_EMAIL"
DB_NAME="$DB_NAME"
DB_USER="$DB_USER"
SETUP_DATE="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"
DEMO_MODE=$DEMO_MODE
EOF

echo -e "${GREEN}✓${NC} Created developer configuration"

# Step 6: Update .gitignore
echo -e "\n${BLUE}Step 6: Updating .gitignore${NC}"
echo "----------------------------"

# Check if entries already exist in .gitignore
if ! grep -q "docker/envs/" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
    cat >> "$PROJECT_ROOT/.gitignore" << EOF

# Docker development environment
docker/envs/
docker/volumes/
.developer-config
docker-compose.override.yml
EOF
    echo -e "${GREEN}✓${NC} Updated .gitignore"
else
    echo -e "${GREEN}✓${NC} .gitignore already configured"
fi

# Summary
echo -e "\n${GREEN}Environment setup complete!${NC}"
echo "=========================="
echo -e "Developer: ${BLUE}$DEVELOPER_NAME${NC} <$DEVELOPER_EMAIL>"
echo -e "Database: ${BLUE}$DB_NAME${NC} (user: $DB_USER)"
echo -e "Environment files created in: ${BLUE}$PROJECT_ROOT/docker/envs/${NC}"

if [ "$DEMO_MODE" = true ]; then
    echo -e "\n${YELLOW}⚠ DEMO MODE CREDENTIALS:${NC}"
    echo "  Database: $DB_USER / demo_password_123"
    echo "  Redis: demo_redis_123"
    echo -e "${RED}  DO NOT use these in production!${NC}"
fi

echo -e "\n${GREEN}✓${NC} Environment variables setup complete!"