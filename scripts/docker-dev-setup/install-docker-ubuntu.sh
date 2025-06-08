#!/bin/bash

# install-docker-ubuntu.sh - Install Docker and Docker Compose on Ubuntu VPS
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "Installing Docker and Docker Compose on Ubuntu..."
echo "================================================"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}This script should not be run as root.${NC}"
   echo -e "${YELLOW}If you're logged in as root on a VPS, use: ./install-docker-ubuntu-root.sh instead${NC}"
   echo -e "Or create a non-root user first:"
   echo -e "  adduser developer"
   echo -e "  usermod -aG sudo developer"
   echo -e "  su - developer"
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

# Step 1: Update package index
echo -e "\n${BLUE}Step 1: Updating package index...${NC}"
sudo apt update

# Step 2: Install Docker
echo -e "\n${BLUE}Step 2: Installing Docker...${NC}"

if command_exists docker; then
    echo -e "${GREEN}✓${NC} Docker is already installed"
    docker --version
else
    echo "Installing Docker..."
    
    # Install prerequisites
    sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Install docker.io package (simpler than Docker CE setup)
    sudo apt install -y docker.io
    
    # Enable and start Docker
    sudo systemctl enable docker
    sudo systemctl start docker
    
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
    
    # Try plugin first (newer Ubuntu versions)
    if sudo apt install -y docker-compose-plugin 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Docker Compose plugin installed"
        # Create symlink for backward compatibility
        if [ ! -f /usr/local/bin/docker-compose ]; then
            sudo ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose 2>/dev/null || true
        fi
    else
        echo "Plugin not available, trying standalone docker-compose..."
        # Fallback to standalone installation (older Ubuntu versions)
        if command -v curl &> /dev/null; then
            COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep -Po '"tag_name": "\K.*?(?=")')
            sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
            echo -e "${GREEN}✓${NC} Docker Compose standalone installed"
        else
            # Last fallback - try apt package
            sudo apt install -y docker-compose 2>/dev/null || {
                echo -e "${RED}✗${NC} Failed to install Docker Compose"
                echo "Please install manually: https://docs.docker.com/compose/install/"
                exit 1
            }
        fi
    fi
    
    echo -e "${GREEN}✓${NC} Docker Compose installed successfully"
    docker compose version 2>/dev/null || docker-compose --version 2>/dev/null || echo "Version check failed but installation completed"
fi

# Step 4: Add user to docker group
echo -e "\n${BLUE}Step 4: Configuring Docker permissions...${NC}"

if groups $USER | grep -q docker; then
    echo -e "${GREEN}✓${NC} User $USER is already in docker group"
else
    echo "Adding user $USER to docker group..."
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✓${NC} User added to docker group"
    echo -e "${YELLOW}⚠${NC}  You need to log out and log back in (or run 'newgrp docker') for group changes to take effect"
fi

# Step 5: Install additional tools
echo -e "\n${BLUE}Step 5: Installing additional tools...${NC}"

# Install jq for JSON processing
if command_exists jq; then
    echo -e "${GREEN}✓${NC} jq is already installed"
else
    sudo apt install -y jq
    echo -e "${GREEN}✓${NC} jq installed"
fi

# Install curl if not present
if command_exists curl; then
    echo -e "${GREEN}✓${NC} curl is already installed"
else
    sudo apt install -y curl
    echo -e "${GREEN}✓${NC} curl installed"
fi

# Install git if not present
if command_exists git; then
    echo -e "${GREEN}✓${NC} git is already installed"
else
    sudo apt install -y git
    echo -e "${GREEN}✓${NC} git installed"
fi

# Step 6: Test Docker installation
echo -e "\n${BLUE}Step 6: Testing Docker installation...${NC}"

# Check if we can run docker without sudo
if docker ps &> /dev/null; then
    echo -e "${GREEN}✓${NC} Docker is working correctly"
elif sudo docker ps &> /dev/null; then
    echo -e "${YELLOW}⚠${NC}  Docker is installed but requires sudo. Run 'newgrp docker' or log out/in"
else
    echo -e "${RED}✗${NC} Docker test failed. Please check the installation"
    exit 1
fi

# Step 7: Security recommendations
echo -e "\n${BLUE}Security Recommendations:${NC}"
echo "=========================="
echo "1. Consider enabling UFW firewall:"
echo "   sudo ufw enable"
echo "   sudo ufw allow ssh"
echo "   sudo ufw allow 80,443/tcp  # for web services"
echo ""
echo "2. Keep Docker updated:"
echo "   sudo apt update && sudo apt upgrade docker.io"
echo ""
echo "3. Limit Docker daemon exposure:"
echo "   Docker daemon is bound to localhost by default (secure)"

# Summary
echo -e "\n${GREEN}Docker installation complete!${NC}"
echo "============================"
echo -e "Docker version: $(docker --version 2>/dev/null || echo 'Not accessible without sudo')"
echo -e "Compose version: $(docker compose version 2>/dev/null || docker-compose --version 2>/dev/null || echo 'Not accessible')"

if ! docker ps &> /dev/null; then
    echo -e "\n${YELLOW}Important: Run one of these commands to use Docker without sudo:${NC}"
    echo "1. newgrp docker  # (temporary for current session)"
    echo "2. Log out and log back in  # (permanent)"
fi

echo -e "\n${GREEN}✓${NC} Ready to run MTK Care development environment setup!"
echo "Next step: Run ./setup-dev-environment.sh"