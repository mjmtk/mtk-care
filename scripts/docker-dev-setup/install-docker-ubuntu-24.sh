#!/bin/bash

# install-docker-ubuntu-24.sh - Install Docker using official Docker repository (Ubuntu 24.04)
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "Installing Docker CE from official repository (Ubuntu 24.04)..."
echo "============================================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (use sudo or login as root).${NC}"
   exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Remove old Docker packages
echo -e "\n${BLUE}Step 1: Removing old Docker packages...${NC}"
for pkg in docker.io docker-doc docker-compose podman-docker containerd runc; do
    apt-get remove -y $pkg 2>/dev/null || echo "$pkg not installed"
done

# Step 2: Update and install prerequisites
echo -e "\n${BLUE}Step 2: Installing prerequisites...${NC}"
apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release

# Step 3: Add Docker's official GPG key
echo -e "\n${BLUE}Step 3: Adding Docker's official GPG key...${NC}"
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Step 4: Add Docker repository
echo -e "\n${BLUE}Step 4: Adding Docker repository...${NC}"
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

# Step 5: Update package index again
echo -e "\n${BLUE}Step 5: Updating package index with Docker repository...${NC}"
apt-get update

# Step 6: Install Docker CE and Docker Compose
echo -e "\n${BLUE}Step 6: Installing Docker CE and Docker Compose...${NC}"
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Step 7: Enable and start Docker
echo -e "\n${BLUE}Step 7: Starting Docker service...${NC}"
systemctl enable docker
systemctl start docker

# Step 8: Install additional tools
echo -e "\n${BLUE}Step 8: Installing additional tools...${NC}"
apt-get install -y jq curl git

# Step 9: Test installation
echo -e "\n${BLUE}Step 9: Testing Docker installation...${NC}"
if docker --version && docker compose version; then
    echo -e "${GREEN}✓${NC} Docker and Docker Compose installed successfully!"
else
    echo -e "${RED}✗${NC} Installation verification failed"
    exit 1
fi

# Step 10: Optional user creation
echo -e "\n${BLUE}Optional: Create development user?${NC}"
read -p "Would you like to create a non-root user for development? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter username for development user: " DEV_USER
    if [ -n "$DEV_USER" ]; then
        if id "$DEV_USER" &>/dev/null; then
            echo -e "${YELLOW}⚠${NC}  User $DEV_USER already exists"
            usermod -aG docker $DEV_USER
        else
            adduser --gecos "" $DEV_USER
            usermod -aG sudo,docker $DEV_USER
            echo -e "${GREEN}✓${NC} Created user $DEV_USER with sudo and docker privileges"
        fi
        echo -e "${YELLOW}To switch to the new user: su - $DEV_USER${NC}"
    fi
fi

# Summary
echo -e "\n${GREEN}Docker CE installation complete!${NC}"
echo "============================="
echo -e "Docker version: $(docker --version)"
echo -e "Compose version: $(docker compose version)"
echo -e "Service status: $(systemctl is-active docker)"

echo -e "\n${GREEN}✓${NC} Ready to run MTK Care development environment setup!"
echo "Next step: Run ./setup-dev-environment.sh"