#!/bin/bash

# Development Environment Verification Script
# This script checks common setup issues based on lessons learned

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 MTK Care Development Environment Verification"
echo "================================================"

# Track overall status
ERRORS=0
WARNINGS=0

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ERRORS=$((ERRORS + 1))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

# 1. Check Docker
echo -e "\n📦 Checking Docker..."
if command -v docker &> /dev/null; then
    check_pass "Docker is installed"
    
    # Check if PostgreSQL container is running
    if docker ps | grep -q "mtk_postgres"; then
        check_pass "PostgreSQL container is running"
    else
        check_warn "PostgreSQL container is not running (run: docker compose -f docker-compose.dev.yml up postgres)"
    fi
    
    # Check if Redis container is running
    if docker ps | grep -q "mtk_redis"; then
        check_pass "Redis container is running"
    else
        check_warn "Redis container is not running (run: docker compose -f docker-compose.dev.yml up redis)"
    fi
else
    check_fail "Docker is not installed"
fi

# 2. Check Node.js
echo -e "\n📦 Checking Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    check_pass "Node.js is installed: $NODE_VERSION"
    
    # Check if it's version 20
    if [[ $NODE_VERSION == v20* ]]; then
        check_pass "Node.js version 20 detected"
    else
        check_warn "Node.js version 20 recommended (found: $NODE_VERSION)"
    fi
else
    check_fail "Node.js is not installed"
fi

# 3. Check Python Virtual Environment
echo -e "\n🐍 Checking Python environment..."
if [ -d "backend/.venv" ]; then
    check_pass "Python virtual environment found at backend/.venv"
    
    # Check if it's activated
    if [ -n "${VIRTUAL_ENV:-}" ]; then
        check_pass "Virtual environment is activated"
    else
        check_warn "Virtual environment exists but not activated (run: source backend/.venv/bin/activate)"
    fi
else
    check_fail "Python virtual environment not found (run setup script or: cd backend && python3 -m venv .venv)"
fi

# 4. Check Backend Environment Files
echo -e "\n🔧 Checking backend environment..."
if [ -f "backend/.env" ]; then
    check_pass "Backend .env file exists"
    
    # Check critical variables
    cd backend
    
    # Check Django secret key
    if grep -q "DJANGO_SECRET_KEY=" .env && ! grep -q "DJANGO_SECRET_KEY=your" .env; then
        check_pass "DJANGO_SECRET_KEY is set"
    else
        check_fail "DJANGO_SECRET_KEY needs to be set properly"
    fi
    
    # Check database configuration
    if grep -q "POSTGRES_PASSWORD=" .env || grep -q "DATABASE_URL=" .env; then
        check_pass "Database configuration found"
    else
        check_fail "Database configuration missing (POSTGRES_PASSWORD or DATABASE_URL)"
    fi
    
    # Check if BASE_DIR fix is needed
    if [ -f "config/settings/base.py" ]; then
        if grep -q "parent.parent.parent.parent" config/settings/base.py; then
            check_warn "BASE_DIR may need fixing (too many parent directories)"
        else
            check_pass "BASE_DIR path looks correct"
        fi
    fi
    
    cd ..
else
    check_fail "Backend .env file not found"
fi

# 5. Check Frontend Environment Files
echo -e "\n🎨 Checking frontend environment..."
if [ -f "frontend/.env" ] || [ -f "frontend/.env.local" ]; then
    check_pass "Frontend environment file exists"
    
    # Check for auth bypass mode
    if [ -f "frontend/.env" ] && grep -q "NEXT_PUBLIC_AUTH_BYPASS_MODE=true" frontend/.env; then
        check_pass "Frontend auth bypass mode enabled for development"
    elif [ -f "frontend/.env.local" ] && grep -q "NEXT_PUBLIC_AUTH_BYPASS_MODE=true" frontend/.env.local; then
        check_pass "Frontend auth bypass mode enabled for development"
    else
        check_warn "Frontend auth bypass mode not explicitly set (may cause auth issues)"
    fi
else
    check_fail "Frontend environment file not found (.env or .env.local)"
fi

# 6. Check Port Availability
echo -e "\n🔌 Checking port availability..."
for port in 8000 3000 5432 6379; do
    if lsof -i :$port &> /dev/null; then
        SERVICE=$(lsof -i :$port | grep LISTEN | awk '{print $1}' | head -1)
        check_pass "Port $port is in use by $SERVICE"
    else
        if [ $port -eq 8000 ] || [ $port -eq 3000 ]; then
            check_warn "Port $port is not in use (expected for Django/Next.js)"
        else
            check_warn "Port $port is not in use (expected for PostgreSQL/Redis)"
        fi
    fi
done

# 7. Test Database Connection (if virtual env is activated)
echo -e "\n🗄️  Testing database connection..."
if [ -n "${VIRTUAL_ENV:-}" ] && [ -f "backend/manage.py" ]; then
    cd backend
    if python -c "import os; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development'); import django; django.setup(); from django.db import connection; connection.ensure_connection()" 2>/dev/null; then
        check_pass "Database connection successful"
    else
        check_fail "Database connection failed (check credentials and PostgreSQL status)"
    fi
    cd ..
else
    check_warn "Skipping database test (activate virtual environment first)"
fi

# 8. Check for common issues
echo -e "\n🔍 Checking for common issues..."

# Check if running on remote VPS
if [ -n "${SSH_CONNECTION:-}" ]; then
    check_warn "Running on remote server - ensure ALLOWED_HOSTS=['*'] in development.py for remote access"
fi

# Check tmux guide
if [ -f "tmux-guide.md" ]; then
    check_pass "Tmux guide found (useful for remote development)"
fi

# Summary
echo -e "\n📊 Summary:"
echo "==========="
if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✅ All checks passed! Your development environment is ready.${NC}"
    else
        echo -e "${GREEN}✅ Setup is functional with $WARNINGS warnings.${NC}"
    fi
else
    echo -e "${RED}❌ Found $ERRORS errors and $WARNINGS warnings that need attention.${NC}"
fi

# Provide next steps
if [ $ERRORS -gt 0 ] || [ $WARNINGS -gt 0 ]; then
    echo -e "\n📝 Recommended actions:"
    
    if ! docker ps | grep -q "mtk_postgres"; then
        echo "  - Start PostgreSQL: docker compose -f docker-compose.dev.yml up -d postgres"
    fi
    
    if [ ! -d "backend/.venv" ]; then
        echo "  - Create Python venv: cd backend && python3 -m venv .venv"
    fi
    
    if [ -z "${VIRTUAL_ENV:-}" ]; then
        echo "  - Activate venv: source backend/.venv/bin/activate"
    fi
    
    if [ ! -f "backend/.env" ]; then
        echo "  - Run setup script: ./scripts/docker-dev-setup/setup-native-development.sh"
    fi
fi

echo -e "\n✨ To start development:"
echo "  1. Terminal 1: cd backend && source .venv/bin/activate && python manage.py runserver 0.0.0.0:8000"
echo "  2. Terminal 2: cd frontend && npm run dev"
echo "  3. Access at: http://localhost:3000 (or http://YOUR_IP:3000 for remote)"

exit $ERRORS