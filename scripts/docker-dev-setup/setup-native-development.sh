#!/bin/bash

# setup-native-development.sh - Set up native development environment (no Docker)
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." &> /dev/null && pwd )"

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║     MTK Care Native Development Environment Setup            ║"
echo "║        (Frontend & Backend running directly on VPS)         ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        local node_version=$(node --version | sed 's/v//')
        local major_version=$(echo $node_version | cut -d. -f1)
        if [ "$major_version" -ge 20 ]; then
            echo -e "${GREEN}✓${NC} Node.js $node_version is compatible"
            return 0
        else
            echo -e "${YELLOW}⚠${NC} Node.js $node_version is too old (need 20+)"
            return 1
        fi
    else
        echo -e "${RED}✗${NC} Node.js is not installed"
        return 1
    fi
}

# Step 1: Stop Docker containers if running
echo -e "\n${BLUE}Step 1: Stopping Docker containers...${NC}"
echo "------------------------------------"

if docker ps | grep -q "mtk_"; then
    echo "Stopping Docker containers..."
    docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" down 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Docker containers stopped"
else
    echo -e "${GREEN}✓${NC} No Docker containers running"
fi

# Step 2: Install/Update Node.js
echo -e "\n${BLUE}Step 2: Installing/Updating Node.js...${NC}"
echo "-------------------------------------"

if ! check_node_version; then
    echo "Installing Node.js 20..."
    
    # Remove old Node.js if present
    if command_exists node; then
        echo "Removing old Node.js version..."
        sudo apt remove -y nodejs npm 2>/dev/null || true
    fi
    
    # Install Node.js 20 via NodeSource
    echo "Adding NodeSource repository..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    
    echo "Installing Node.js 20..."
    sudo apt-get install -y nodejs
    
    # Verify installation
    if check_node_version; then
        echo -e "${GREEN}✓${NC} Node.js installed successfully"
    else
        echo -e "${RED}✗${NC} Node.js installation failed"
        exit 1
    fi
else
    echo -e "${GREEN}✓${NC} Node.js is already up to date"
fi

# Step 3: Install Python dependencies
echo -e "\n${BLUE}Step 3: Setting up Python environment...${NC}"
echo "----------------------------------------"

# Check Python version
if command_exists python3; then
    python_version=$(python3 --version)
    echo -e "${GREEN}✓${NC} Python is installed: $python_version"
else
    echo "Installing Python3..."
    sudo apt update
    sudo apt install -y python3 python3-pip python3-venv
fi

# Ensure python3-venv is installed (often missing on Ubuntu)
if ! dpkg -l | grep -q python3.*-venv; then
    echo "Installing python3-venv package..."
    sudo apt install -y python3-venv python3-dev
    echo -e "${GREEN}✓${NC} python3-venv installed"
fi

# Create virtual environment for backend
echo "Setting up Python virtual environment..."
cd "$PROJECT_ROOT/backend"

if [ ! -d ".venv" ]; then
    python3 -m venv .venv
    echo -e "${GREEN}✓${NC} Created Python virtual environment"
else
    echo -e "${GREEN}✓${NC} Python virtual environment already exists"
fi

# Activate and install dependencies
echo "Installing Python dependencies..."
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo -e "${GREEN}✓${NC} Python dependencies installed"

# Step 4: Install Node.js dependencies
echo -e "\n${BLUE}Step 4: Installing Node.js dependencies...${NC}"
echo "------------------------------------------"

cd "$PROJECT_ROOT/frontend"

# Fix any permission issues
sudo chown -R $(whoami):$(whoami) . 2>/dev/null || true

# Clean install
if [ -d "node_modules" ]; then
    echo "Removing existing node_modules..."
    rm -rf node_modules package-lock.json
fi

echo "Installing Node.js dependencies..."
npm install

echo -e "${GREEN}✓${NC} Node.js dependencies installed"

# Step 5: Set up PostgreSQL
echo -e "\n${BLUE}Step 5: Setting up PostgreSQL...${NC}"
echo "--------------------------------"

if ! command_exists psql; then
    echo "Installing PostgreSQL..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
    echo -e "${GREEN}✓${NC} PostgreSQL installed"
else
    echo -e "${GREEN}✓${NC} PostgreSQL is already installed"
fi

# Step 6: Set up Redis
echo -e "\n${BLUE}Step 6: Setting up Redis...${NC}"
echo "---------------------------"

if ! command_exists redis-cli; then
    echo "Installing Redis..."
    sudo apt update
    sudo apt install -y redis-server
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
    echo -e "${GREEN}✓${NC} Redis installed"
else
    echo -e "${GREEN}✓${NC} Redis is already installed"
fi

# Step 7: Create environment files for native development
echo -e "\n${BLUE}Step 7: Creating native development environment files...${NC}"
echo "-------------------------------------------------------"

# Backend .env file
cat > "$PROJECT_ROOT/backend/.env" << EOF
# Django Settings
DJANGO_SECRET_KEY=$(openssl rand -base64 32)
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,$(hostname -I | awk '{print $1}')

# Database (local PostgreSQL)
DB_NAME=mtk_care_dev
DB_USER=mtk_dev
DB_PASSWORD=dev_password_123
DB_HOST=localhost
DB_PORT=5432

# Redis (local Redis)
REDIS_URL=redis://localhost:6379/0

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Development mode
AUTH_BYPASS_MODE=true
EOF

# Frontend .env.local file
cat > "$PROJECT_ROOT/frontend/.env.local" << EOF
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Development mode
NEXT_PUBLIC_AUTH_BYPASS_MODE=true

# Developer Info
NEXT_PUBLIC_DEVELOPER_NAME=$(whoami)
EOF

echo -e "${GREEN}✓${NC} Environment files created"

# Step 8: Set up database
echo -e "\n${BLUE}Step 8: Setting up database...${NC}"
echo "------------------------------"

# Create database user and database
sudo -u postgres psql << EOF
-- Create user if not exists
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'mtk_dev') THEN
        CREATE USER mtk_dev WITH PASSWORD 'dev_password_123';
    END IF;
END
\$\$;

-- Create database if not exists
SELECT 'CREATE DATABASE mtk_care_dev OWNER mtk_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'mtk_care_dev');

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mtk_care_dev TO mtk_dev;
EOF

echo -e "${GREEN}✓${NC} Database and user created"

# Run migrations
echo "Running Django migrations..."
cd "$PROJECT_ROOT/backend"
source .venv/bin/activate
python manage.py migrate
echo -e "${GREEN}✓${NC} Migrations completed"

# Step 9: Create startup scripts
echo -e "\n${BLUE}Step 9: Creating startup scripts...${NC}"
echo "----------------------------------"

# Backend start script
cat > "$PROJECT_ROOT/start-backend.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/backend"
source .venv/bin/activate
echo "Starting Django development server..."
echo "Backend will be available at: http://localhost:8000"
python manage.py runserver 0.0.0.0:8000
EOF
chmod +x "$PROJECT_ROOT/start-backend.sh"

# Frontend start script
cat > "$PROJECT_ROOT/start-frontend.sh" << 'EOF'
#!/bin/bash
cd "$(dirname "$0")/frontend"
echo "Starting Next.js development server..."
echo "Frontend will be available at: http://localhost:3000"
npm run dev
EOF
chmod +x "$PROJECT_ROOT/start-frontend.sh"

# Combined start script
cat > "$PROJECT_ROOT/start-dev.sh" << 'EOF'
#!/bin/bash
echo "Starting MTK Care development servers..."

# Function to kill background processes on exit
cleanup() {
    echo "Stopping development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend in background
echo "Starting backend server..."
./start-backend.sh &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend in background
echo "Starting frontend server..."
./start-frontend.sh &
FRONTEND_PID=$!

echo ""
echo "✓ Development servers started!"
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for background processes
wait
EOF
chmod +x "$PROJECT_ROOT/start-dev.sh"

echo -e "${GREEN}✓${NC} Startup scripts created"

# Summary
echo -e "\n${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                 Native Development Setup Complete!           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${GREEN}✓ MTK Care native development environment is ready!${NC}\n"

echo -e "${BLUE}Quick Start Commands:${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Start both servers:     ${YELLOW}./start-dev.sh${NC}"
echo -e "Start backend only:     ${YELLOW}./start-backend.sh${NC}"
echo -e "Start frontend only:    ${YELLOW}./start-frontend.sh${NC}"
echo ""
echo -e "Individual commands:"
echo -e "Backend (Django):       ${YELLOW}cd backend && source .venv/bin/activate && python manage.py runserver${NC}"
echo -e "Frontend (Next.js):     ${YELLOW}cd frontend && npm run dev${NC}"

echo -e "\n${BLUE}Access URLs:${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Frontend:     ${GREEN}http://localhost:3000${NC}"
echo -e "Backend API:  ${GREEN}http://localhost:8000/api/v1/${NC}"
echo -e "Django Admin: ${GREEN}http://localhost:8000/admin/${NC}"

echo -e "\n${YELLOW}Note: Docker containers have been stopped. Services now run natively on VPS.${NC}"
echo -e "${GREEN}Happy coding! 🚀${NC}\n"