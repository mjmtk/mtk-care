#!/bin/bash

# setup-development.sh - Main entry point for MTK Care development environment setup
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
DOCKER_SETUP_DIR="$SCRIPT_DIR/docker-dev-setup"

# Banner
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║               MTK Care Development Setup                     ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}Choose your development environment setup:${NC}\n"

echo -e "${GREEN}Option A: Docker Development${NC} (Recommended for beginners)"
echo -e "  ✅ Isolated containers"
echo -e "  ✅ Easy cleanup"
echo -e "  ✅ Includes web-based VS Code"
echo -e "  🟡 Requires Docker knowledge"
echo -e "  🟡 Container overhead"
echo ""

echo -e "${GREEN}Option B: Native Development${NC} (Recommended for traditional workflow)"
echo -e "  ✅ Best performance"
echo -e "  ✅ Traditional dev workflow"
echo -e "  ✅ Direct file editing"
echo -e "  🟡 Shares system dependencies"
echo -e "  🟡 Manual service management"
echo ""

# Function to check if Docker is installed
check_docker() {
    if command -v docker &> /dev/null && docker --version &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# Get user choice
while true; do
    echo -e "${YELLOW}Select setup type:${NC}"
    echo "  [A] Docker Development (containerized)"
    echo "  [B] Native Development (traditional)"
    echo "  [Q] Quit"
    echo ""
    read -p "Your choice [A/B/Q]: " -n 1 -r choice
    echo ""
    
    case $choice in
        [Aa]* )
            echo -e "\n${BLUE}Setting up Docker Development Environment...${NC}"
            echo "============================================"
            
            # Check if Docker is installed
            if ! check_docker; then
                echo -e "${YELLOW}Docker is not installed. Installing Docker first...${NC}"
                
                if [[ $EUID -eq 0 ]]; then
                    "$DOCKER_SETUP_DIR/install-docker-ubuntu-root.sh"
                else
                    "$DOCKER_SETUP_DIR/install-docker-ubuntu.sh"
                fi
                
                echo -e "\n${GREEN}Docker installation complete!${NC}"
                echo -e "${YELLOW}You may need to log out and back in for Docker permissions to take effect.${NC}"
                read -p "Press Enter to continue with setup..." -r
            fi
            
            # Run Docker setup
            "$DOCKER_SETUP_DIR/setup-dev-environment.sh"
            break
            ;;
        [Bb]* )
            echo -e "\n${BLUE}Setting up Native Development Environment...${NC}"
            echo "==========================================="
            
            # Check if Docker is installed (still needed for some services)
            if ! check_docker; then
                echo -e "${YELLOW}Docker is needed for some services. Installing Docker first...${NC}"
                
                if [[ $EUID -eq 0 ]]; then
                    "$DOCKER_SETUP_DIR/install-docker-ubuntu-root.sh"
                else
                    "$DOCKER_SETUP_DIR/install-docker-ubuntu.sh"
                fi
                
                echo -e "\n${GREEN}Docker installation complete!${NC}"
                read -p "Press Enter to continue with native setup..." -r
            fi
            
            # Run Native setup
            "$DOCKER_SETUP_DIR/setup-native-development.sh"
            break
            ;;
        [Qq]* )
            echo -e "\n${YELLOW}Setup cancelled.${NC}"
            exit 0
            ;;
        * )
            echo -e "${RED}Invalid choice. Please enter A, B, or Q.${NC}\n"
            ;;
    esac
done

echo -e "\n${GREEN}✓ Development environment setup complete!${NC}"
echo -e "\n${CYAN}Happy coding! 🚀${NC}"