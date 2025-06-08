#!/bin/bash

# install-docker-ubuntu-root.sh - Install Docker and Docker Compose on Ubuntu VPS (root version)
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "Installing Docker and Docker Compose on Ubuntu (as root)..."
echo "=========================================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (use sudo or login as root).${NC}"
   exit 1
fi

# Check if Ubuntu/Debian
if ! command -v apt &> /dev/null; then
    echo -e "${RED}This script is for Ubuntu/Debian systems only.${NC}"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Get the actual user who will use Docker (if script was run with sudo)
REAL_USER=${SUDO_USER:-$(whoami)}
if [ "$REAL_USER" = "root" ]; then
    echo -e "${YELLOW}Running as root user. Docker will be available system-wide.${NC}"
    echo -e "${YELLOW}Consider creating a non-root user for development work.${NC}"
fi

# Step 1: Update package index
echo -e "\n${BLUE}Step 1: Updating package index...${NC}"
apt update

# Step 2: Install Docker
echo -e "\n${BLUE}Step 2: Installing Docker...${NC}"

if command_exists docker; then
    echo -e "${GREEN}✓${NC} Docker is already installed"
    docker --version
else
    echo "Installing Docker..."
    
    # Install prerequisites
    apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Install docker.io package (simpler than Docker CE setup)
    apt install -y docker.io
    
    # Enable and start Docker
    systemctl enable docker
    systemctl start docker
    
    echo -e "${GREEN}✓${NC} Docker installed successfully"
    docker --version
fi

# Step 3: Install Docker Compose
echo -e "\n${BLUE}Step 3: Installing Docker Compose...${NC}"

if command_exists docker-compose; then
    echo -e "${GREEN}✓${NC} Docker Compose is already installed"
    docker-compose --version
else
    echo "Installing Docker Compose..."
    apt install -y docker-compose-plugin
    
    # Create symlink for backward compatibility
    if [ ! -f /usr/local/bin/docker-compose ]; then
        ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✓${NC} Docker Compose installed successfully"
    docker compose version || docker-compose --version
fi

# Step 4: Configure Docker permissions (if not root user)
echo -e "\n${BLUE}Step 4: Configuring Docker permissions...${NC}"

if [ "$REAL_USER" != "root" ]; then
    if groups $REAL_USER | grep -q docker; then
        echo -e "${GREEN}✓${NC} User $REAL_USER is already in docker group"
    else
        echo "Adding user $REAL_USER to docker group..."
        usermod -aG docker $REAL_USER
        echo -e "${GREEN}✓${NC} User $REAL_USER added to docker group"
        echo -e "${YELLOW}⚠${NC}  User $REAL_USER needs to log out and log back in for group changes to take effect"
    fi
else
    echo -e "${YELLOW}⚠${NC}  Running as root - Docker commands will work immediately"
    echo -e "${YELLOW}⚠${NC}  Consider creating a non-root user for security:"
    echo "    adduser developer"
    echo "    usermod -aG sudo,docker developer"
fi

# Step 5: Install additional tools
echo -e "\n${BLUE}Step 5: Installing additional tools...${NC}"

# Install jq for JSON processing
if command_exists jq; then
    echo -e "${GREEN}✓${NC} jq is already installed"
else
    apt install -y jq
    echo -e "${GREEN}✓${NC} jq installed"
fi

# Install curl if not present
if command_exists curl; then
    echo -e "${GREEN}✓${NC} curl is already installed"
else
    apt install -y curl
    echo -e "${GREEN}✓${NC} curl installed"
fi

# Install git if not present
if command_exists git; then
    echo -e "${GREEN}✓${NC} git is already installed"
else
    apt install -y git
    echo -e "${GREEN}✓${NC} git installed"
fi

# Step 6: Test Docker installation
echo -e "\n${BLUE}Step 6: Testing Docker installation...${NC}"

if docker ps &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is working correctly"
else
    echo -e "${RED}✗${NC} Docker test failed. Please check the installation"
    exit 1
fi

# Step 7: Security recommendations for root usage
echo -e "\n${BLUE}Security Recommendations (Root User):${NC}"
echo "======================================"
echo "1. Create a non-root user for development:"
echo "   adduser developer"
echo "   usermod -aG sudo,docker developer"
echo "   su - developer  # switch to non-root user"
echo ""
echo "2. Enable UFW firewall:"
echo "   ufw enable"
echo "   ufw allow ssh"
echo "   ufw allow 3000,8000,8080/tcp  # for development services"
echo ""
echo "3. Keep Docker updated:"
echo "   apt update && apt upgrade docker.io"
echo ""
echo "4. Secure SSH access:"
echo "   - Disable root login via SSH"
echo "   - Use SSH keys instead of passwords"
echo "   - Change default SSH port"

# Step 8: Optional user creation
echo -e "\n${BLUE}Optional: Create development user?${NC}"
read -p "Would you like to create a non-root user for development? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter username for development user: " DEV_USER
    if [ -n "$DEV_USER" ]; then
        if id "$DEV_USER" &>/dev/null; then
            echo -e "${YELLOW}⚠${NC}  User $DEV_USER already exists"
        else
            adduser --gecos "" $DEV_USER
            usermod -aG sudo,docker $DEV_USER
            echo -e "${GREEN}✓${NC} Created user $DEV_USER with sudo and docker privileges"
            echo -e "${YELLOW}To switch to the new user: su - $DEV_USER${NC}"
        fi
    fi
fi

# Summary
echo -e "\n${GREEN}Docker installation complete!${NC}"
echo "============================"
echo -e "Docker version: $(docker --version)"
echo -e "Compose version: $(docker compose version 2>/dev/null || docker-compose --version)"
echo -e "Running as: $(whoami)"

echo -e "\n${GREEN}✓${NC} Ready to run MTK Care development environment setup!"
echo "Next step: Run ./setup-dev-environment.sh"

if [ "$REAL_USER" = "root" ]; then
    echo -e "\n${YELLOW}Running as root - consider creating a development user for security${NC}"
fi