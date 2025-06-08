#!/bin/bash

# verify-setup.sh - Verify the development environment is working correctly
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

echo "Verifying MTK Care development environment..."
echo "==========================================="

# Track verification status
VERIFICATION_PASSED=true

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $description... "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
        echo -e "${GREEN}✓${NC} Available"
        return 0
    else
        echo -e "${RED}✗${NC} Not responding"
        VERIFICATION_PASSED=false
        return 1
    fi
}

# Function to check container health
check_container_health() {
    local container=$1
    local service=$2
    
    echo -n "Checking $service container... "
    
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        # Check if container is healthy
        local health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")
        if [ "$health" = "healthy" ] || [ "$health" = "none" ]; then
            echo -e "${GREEN}✓${NC} Running"
            return 0
        else
            echo -e "${YELLOW}⚠${NC}  Running but unhealthy"
            return 0
        fi
    else
        echo -e "${RED}✗${NC} Not running"
        VERIFICATION_PASSED=false
        return 1
    fi
}

# Function to test database connection
test_database_connection() {
    echo -n "Testing database connection... "
    
    if docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" exec -T postgres pg_isready -U "${DB_USER:-mtk_dev}" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Connected"
        return 0
    else
        echo -e "${RED}✗${NC} Cannot connect"
        VERIFICATION_PASSED=false
        return 1
    fi
}

# Function to test Redis connection
test_redis_connection() {
    echo -n "Testing Redis connection... "
    
    if docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" exec -T redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Connected"
        return 0
    else
        echo -e "${RED}✗${NC} Cannot connect"
        VERIFICATION_PASSED=false
        return 1
    fi
}

# Step 1: Check containers
echo -e "\n${BLUE}1. Checking Docker containers:${NC}"
echo "------------------------------"

check_container_health "mtk_postgres" "PostgreSQL"
check_container_health "mtk_redis" "Redis"
check_container_health "mtk_backend" "Django Backend"
check_container_health "mtk_frontend" "Next.js Frontend"
check_container_health "mtk_code_server" "Code-server (Web IDE)"

# Step 2: Check services connectivity
echo -e "\n${BLUE}2. Checking service connectivity:${NC}"
echo "---------------------------------"

test_database_connection
test_redis_connection

# Step 3: Check HTTP endpoints
echo -e "\n${BLUE}3. Checking HTTP endpoints:${NC}"
echo "---------------------------"

# Wait a bit for services to be ready
sleep 2

check_endpoint "http://localhost:8000/api/v1/health/" "Backend health check" "200"
check_endpoint "http://localhost:8000/admin/" "Django admin" "200"
check_endpoint "http://localhost:3000" "Frontend homepage" "200"
check_endpoint "http://localhost:8080" "Code-server Web IDE" "200"

# Step 4: Check API functionality
echo -e "\n${BLUE}4. Checking API functionality:${NC}"
echo "-------------------------------"

echo -n "Testing API response... "
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/api/v1/optionlists/")
if [ "$API_RESPONSE" = "200" ] || [ "$API_RESPONSE" = "401" ]; then
    echo -e "${GREEN}✓${NC} API responding correctly"
else
    echo -e "${RED}✗${NC} API not responding (status: $API_RESPONSE)"
    VERIFICATION_PASSED=false
fi

# Step 5: Check volumes
echo -e "\n${BLUE}5. Checking Docker volumes:${NC}"
echo "---------------------------"

echo -n "Checking PostgreSQL data volume... "
if docker volume ls | grep -q "postgres"; then
    echo -e "${GREEN}✓${NC} Exists"
else
    echo -e "${YELLOW}⚠${NC}  Not found (will be created on first run)"
fi

# Step 6: Check environment files
echo -e "\n${BLUE}6. Checking environment files:${NC}"
echo "------------------------------"

ENV_FILES=(
    "docker/envs/backend.env"
    "docker/envs/frontend.env"
    "docker/envs/postgres.env"
    "docker/envs/redis.env"
    "docker/envs/code-server.env"
)

for env_file in "${ENV_FILES[@]}"; do
    echo -n "Checking $env_file... "
    if [ -f "$PROJECT_ROOT/$env_file" ]; then
        echo -e "${GREEN}✓${NC} Exists"
    else
        echo -e "${RED}✗${NC} Missing"
        VERIFICATION_PASSED=false
    fi
done

# Step 7: Test Django management commands
echo -e "\n${BLUE}7. Testing Django management:${NC}"
echo "-----------------------------"

echo -n "Running Django check... "
if docker compose -f "$PROJECT_ROOT/docker-compose.dev.yml" exec -T backend python manage.py check > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} No issues found"
else
    echo -e "${YELLOW}⚠${NC}  Some warnings (non-critical)"
fi

# Step 8: Display service URLs
echo -e "\n${BLUE}8. Service URLs:${NC}"
echo "----------------"
echo -e "Frontend:        ${GREEN}http://localhost:3000${NC}"
echo -e "Backend API:     ${GREEN}http://localhost:8000/api/v1/${NC}"
echo -e "Django Admin:    ${GREEN}http://localhost:8000/admin/${NC}"
echo -e "Code-server IDE: ${GREEN}http://localhost:8080${NC}"
echo -e "API Docs:        ${GREEN}http://localhost:8000/api/docs/${NC}"

# Step 9: Display logs location
echo -e "\n${BLUE}9. Useful commands:${NC}"
echo "-------------------"
echo "View logs:        docker compose -f docker-compose.dev.yml logs -f [service]"
echo "Django shell:     docker compose -f docker-compose.dev.yml exec backend python manage.py shell"
echo "PostgreSQL:       docker compose -f docker-compose.dev.yml exec postgres psql -U \${DB_USER} \${DB_NAME}"
echo "Stop services:    docker compose -f docker-compose.dev.yml down"
echo "Restart service:  docker compose -f docker-compose.dev.yml restart [service]"

# Load and use helper functions
if [ -f "$PROJECT_ROOT/scripts/docker-dev-setup/docker-helpers.sh" ]; then
    echo -e "\nHelper functions available: source scripts/docker-dev-setup/docker-helpers.sh"
fi

# Summary
echo -e "\n${YELLOW}Verification Summary:${NC}"
echo "===================="

if [ "$VERIFICATION_PASSED" = true ]; then
    echo -e "${GREEN}✓ All checks passed! Your development environment is ready.${NC}"
    
    # Check for credentials file
    if [ -f "$PROJECT_ROOT/docker/envs/.superuser-credentials" ]; then
        echo -e "\n${YELLOW}Don't forget to check your superuser credentials in:${NC}"
        echo -e "${BLUE}docker/envs/.superuser-credentials${NC}"
    fi
    
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the output above.${NC}"
    echo -e "\nTroubleshooting tips:"
    echo "1. Check Docker logs: docker compose -f docker-compose.dev.yml logs"
    echo "2. Ensure all containers are running: docker compose -f docker-compose.dev.yml ps"
    echo "3. Try restarting services: docker compose -f docker-compose.dev.yml restart"
    echo "4. Check environment files exist in docker/envs/"
    
    exit 1
fi