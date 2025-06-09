#!/bin/bash

# MTK Care Development Connection Script
# This script connects to your VPS and sets up PostgreSQL port forwarding for local development

set -e

# Configuration
VPS_HOST="93.127.195.142"  # Update with your VPS IP
VPS_USER="mj"              # Update with your VPS username
LOCAL_PG_PORT="15432"      # Local port for PostgreSQL access
REMOTE_PG_PORT="5432"      # PostgreSQL port on VPS

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 MTK Care Development Connection${NC}"
echo "=================================="

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
    echo -e "${YELLOW}⚠️  No SSH key found. You may need to enter password multiple times.${NC}"
    echo -e "${YELLOW}   Consider setting up SSH key authentication for smoother experience.${NC}"
fi

# Function to check if port is already in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Port $port is already in use. Attempting to free it...${NC}"
        # Kill any existing SSH tunnels on this port
        pkill -f "ssh.*$port:localhost" 2>/dev/null || true
        sleep 2
    fi
}

# Function to test PostgreSQL connection
test_pg_connection() {
    echo -e "${BLUE}🔍 Testing PostgreSQL connection...${NC}"
    
    # Test if we can connect to PostgreSQL through the tunnel
    if command -v psql >/dev/null 2>&1; then
        if PGPASSWORD="W1xDx1vlVqFHppobZrxW" psql -h localhost -p $LOCAL_PG_PORT -U mtk_mj -d mtk_care_mj -c "SELECT 1;" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ PostgreSQL connection successful!${NC}"
            echo -e "${GREEN}   You can now connect using: localhost:$LOCAL_PG_PORT${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  PostgreSQL connection test failed (this might be normal if psql is not installed locally)${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  psql not found locally - skipping connection test${NC}"
        echo -e "${GREEN}   Port forwarding is active. Try connecting with your preferred PostgreSQL client.${NC}"
        return 0
    fi
}

# Function to show connection info
show_connection_info() {
    echo -e "\n${GREEN}🎉 Development environment ready!${NC}"
    echo "=================================="
    echo -e "${BLUE}SSH Connection:${NC} Connected to $VPS_USER@$VPS_HOST"
    echo -e "${BLUE}PostgreSQL:${NC} localhost:$LOCAL_PG_PORT"
    echo -e "${BLUE}Database:${NC} mtk_care_mj"
    echo -e "${BLUE}Username:${NC} mtk_mj"
    echo -e "${BLUE}Password:${NC} W1xDx1vlVqFHppobZrxW"
    echo ""
    echo -e "${YELLOW}💡 Connection strings for your local tools:${NC}"
    echo "   PostgreSQL: postgresql://mtk_mj:W1xDx1vlVqFHppobZrxW@localhost:$LOCAL_PG_PORT/mtk_care_mj"
    echo "   DBeaver/pgAdmin: Host=localhost, Port=$LOCAL_PG_PORT, DB=mtk_care_mj, User=mtk_mj"
    echo ""
    echo -e "${YELLOW}🔧 On the VPS, you can:${NC}"
    echo "   - cd /home/mj/dev/mtk-care"
    echo "   - Start Django: cd backend && source .venv/bin/activate && python manage.py runserver 0.0.0.0:8000"
    echo "   - Start Next.js: cd frontend && npm run dev"
    echo "   - Use tmux: tmux new-session -s dev"
    echo ""
    echo -e "${RED}Press Ctrl+C to disconnect and stop port forwarding${NC}"
}

# Main execution
echo -e "${BLUE}📡 Connecting to VPS: $VPS_USER@$VPS_HOST${NC}"

# Check and free the local port if needed
check_port $LOCAL_PG_PORT

# Test basic SSH connectivity first
echo -e "${BLUE}🔐 Testing SSH connection...${NC}"
if ! ssh -o ConnectTimeout=10 -o BatchMode=yes $VPS_USER@$VPS_HOST "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  SSH key authentication failed, you'll need to enter password${NC}"
fi

# Check if PostgreSQL is running on the VPS
echo -e "${BLUE}🐘 Checking PostgreSQL status on VPS...${NC}"
PG_STATUS=$(ssh $VPS_USER@$VPS_HOST "docker ps --filter 'name=mtk_postgres' --format '{{.Status}}'" 2>/dev/null || echo "unknown")

if [[ $PG_STATUS == *"Up"* ]]; then
    echo -e "${GREEN}✅ PostgreSQL container is running on VPS${NC}"
elif [[ $PG_STATUS == "unknown" ]]; then
    echo -e "${YELLOW}⚠️  Could not check PostgreSQL status (SSH connection issue)${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL container is not running. Starting it...${NC}"
    ssh $VPS_USER@$VPS_HOST "cd /home/mj/dev/mtk-care && docker compose -f docker-compose.dev.yml up -d postgres" || {
        echo -e "${RED}❌ Failed to start PostgreSQL container${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ PostgreSQL container started${NC}"
fi

# Create the SSH tunnel with port forwarding
echo -e "${BLUE}🌉 Setting up SSH tunnel with PostgreSQL port forwarding...${NC}"

# Setup trap to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up SSH tunnel...${NC}"
    exit 0
}
trap cleanup INT TERM

# Start SSH session with port forwarding
# -L: Local port forwarding
# -N: Don't execute remote command (just forwarding)
# -f: Fork to background  
# We don't use -f here so we can show connection info and keep it interactive

echo -e "${GREEN}✅ Starting SSH session with port forwarding...${NC}"

# Use a different approach - start tunnel in background and then interactive session
ssh -f -N -L $LOCAL_PG_PORT:localhost:$REMOTE_PG_PORT $VPS_USER@$VPS_HOST

# Give the tunnel a moment to establish
sleep 2

# Test the connection
test_pg_connection

# Show connection info
show_connection_info

# Now start an interactive SSH session
echo -e "${BLUE}🖥️  Starting interactive SSH session...${NC}"
echo -e "${YELLOW}   You'll be connected to your VPS with PostgreSQL port forwarding active${NC}"
echo ""

# Start interactive session (this will keep the script running)
ssh -t $VPS_USER@$VPS_HOST "cd /home/mj/dev/mtk-care && exec bash -l"

# Cleanup will happen automatically when SSH session ends