#!/bin/bash

# check-prerequisites.sh - Check system requirements for Docker development environment
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "Checking prerequisites for MTK Care Docker development environment..."
echo "=================================================================="

# Track if all checks pass
ALL_CHECKS_PASSED=true

# Function to check if a command exists
check_command() {
    local cmd=$1
    local min_version=$2
    local version_cmd=$3
    
    if command -v $cmd &> /dev/null; then
        if [ -n "$version_cmd" ]; then
            local version=$($version_cmd 2>&1 | head -n 1)
            echo -e "${GREEN}✓${NC} $cmd is installed: $version"
        else
            echo -e "${GREEN}✓${NC} $cmd is installed"
        fi
        return 0
    else
        echo -e "${RED}✗${NC} $cmd is not installed"
        ALL_CHECKS_PASSED=false
        return 1
    fi
}

# Function to check if a port is available
check_port() {
    local port=$1
    local service=$2
    
    if lsof -i:$port &> /dev/null || netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo -e "${RED}✗${NC} Port $port (needed for $service) is already in use"
        ALL_CHECKS_PASSED=false
        return 1
    else
        echo -e "${GREEN}✓${NC} Port $port (for $service) is available"
        return 0
    fi
}

# Function to check disk space
check_disk_space() {
    local required_gb=$1
    local available_gb=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    
    if [ $available_gb -ge $required_gb ]; then
        echo -e "${GREEN}✓${NC} Sufficient disk space: ${available_gb}GB available (${required_gb}GB required)"
        return 0
    else
        echo -e "${RED}✗${NC} Insufficient disk space: ${available_gb}GB available (${required_gb}GB required)"
        ALL_CHECKS_PASSED=false
        return 1
    fi
}

echo -e "\n${YELLOW}1. Checking required software:${NC}"
echo "------------------------------"

# Check for required commands
check_command "docker" "" "docker --version"
check_command "docker-compose" "" "docker-compose --version"
check_command "git" "" "git --version"
check_command "curl" "" "curl --version"
check_command "jq" "" "jq --version"

# Check if Docker daemon is running
echo -e "\n${YELLOW}2. Checking Docker daemon:${NC}"
echo "--------------------------"
if docker info &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker daemon is running"
else
    echo -e "${RED}✗${NC} Docker daemon is not running. Please start Docker."
    ALL_CHECKS_PASSED=false
fi

# Check for required ports
echo -e "\n${YELLOW}3. Checking port availability:${NC}"
echo "-------------------------------"
check_port 3000 "Next.js frontend"
check_port 8000 "Django backend"
check_port 8080 "Code-server (Web IDE)"
check_port 5432 "PostgreSQL"
check_port 6379 "Redis"

# Check disk space (require at least 5GB)
echo -e "\n${YELLOW}4. Checking disk space:${NC}"
echo "-----------------------"
check_disk_space 5

# Check memory
echo -e "\n${YELLOW}5. Checking system resources:${NC}"
echo "-----------------------------"
if [ -f /proc/meminfo ]; then
    total_mem=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    total_mem_gb=$((total_mem / 1024 / 1024))
    if [ $total_mem_gb -ge 4 ]; then
        echo -e "${GREEN}✓${NC} Sufficient memory: ${total_mem_gb}GB RAM"
    else
        echo -e "${YELLOW}⚠${NC}  Low memory: ${total_mem_gb}GB RAM (4GB+ recommended)"
    fi
fi

# Check Docker Compose version
echo -e "\n${YELLOW}6. Checking Docker Compose version:${NC}"
echo "------------------------------------"
if docker-compose --version &> /dev/null; then
    compose_version=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    major_version=$(echo $compose_version | cut -d. -f1)
    minor_version=$(echo $compose_version | cut -d. -f2)
    
    if [ "$major_version" -ge 2 ] || ([ "$major_version" -eq 1 ] && [ "$minor_version" -ge 27 ]); then
        echo -e "${GREEN}✓${NC} Docker Compose version $compose_version is sufficient"
    else
        echo -e "${YELLOW}⚠${NC}  Docker Compose version $compose_version is old (1.27+ recommended)"
    fi
fi

# Summary
echo -e "\n${YELLOW}Summary:${NC}"
echo "--------"
if [ "$ALL_CHECKS_PASSED" = true ]; then
    echo -e "${GREEN}✓ All prerequisites are met! You can proceed with the setup.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some prerequisites are not met. Please install missing components.${NC}"
    echo -e "\nInstallation commands for Ubuntu/Debian:"
    echo "- Docker: sudo apt update && sudo apt install docker.io"
    echo "- Docker Compose: sudo apt install docker-compose-plugin"
    echo "- Add user to docker group: sudo usermod -aG docker \$USER && newgrp docker"
    echo "- jq: sudo apt install jq"
    echo "- curl: sudo apt install curl"
    echo ""
    echo "Alternative Docker installation:"
    echo "- Via snap: sudo snap install docker"
    echo ""
    echo "For other distributions:"
    echo "- Docker: https://docs.docker.com/get-docker/"
    echo "- Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi