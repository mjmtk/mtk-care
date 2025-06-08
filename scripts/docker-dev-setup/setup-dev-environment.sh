#!/bin/bash

# setup-dev-environment.sh - Main orchestrator script for MTK Care Docker development setup
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." &> /dev/null && pwd )"

# Make all scripts executable (in case they weren't committed with execute permissions)
find "$SCRIPT_DIR" -name "*.sh" -type f -exec chmod +x {} \;

# Banner
echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║     MTK Care Docker Development Environment Setup            ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to print step headers
print_step() {
    echo -e "\n${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Function to handle errors
handle_error() {
    echo -e "\n${RED}✗ Error occurred during: $1${NC}"
    echo -e "${RED}Please check the output above for details.${NC}"
    exit 1
}

# Parse command line arguments
SKIP_PREREQUISITES=false
SKIP_BUILD=false
DEMO_MODE=false
AUTO_YES=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-prereq)
            SKIP_PREREQUISITES=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --demo)
            DEMO_MODE=true
            shift
            ;;
        --yes|-y)
            AUTO_YES=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-prereq    Skip prerequisite checks"
            echo "  --skip-build     Skip Docker image building"
            echo "  --demo           Use demo credentials (insecure)"
            echo "  --yes, -y        Auto-confirm all prompts"
            echo "  --help, -h       Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0               # Full setup with prompts"
            echo "  $0 --demo --yes  # Quick demo setup"
            echo "  $0 --skip-build  # Setup without rebuilding images"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Confirm setup
if [ "$AUTO_YES" != "true" ]; then
    echo -e "${YELLOW}This script will set up a complete Docker development environment for MTK Care.${NC}"
    echo -e "It will:"
    echo -e "  • Check system prerequisites"
    echo -e "  • Create environment configuration files"
    echo -e "  • Set up Docker Compose services"
    echo -e "  • Initialize the database"
    echo -e "  • Verify the installation"
    echo ""
    read -p "Continue with setup? [Y/n] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]] && [[ ! -z $REPLY ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Track overall status
SETUP_COMPLETE=true

# Step 1: Check prerequisites
if [ "$SKIP_PREREQUISITES" != "true" ]; then
    print_step "Step 1/5: Checking Prerequisites"
    
    if "$SCRIPT_DIR/check-prerequisites.sh"; then
        echo -e "${GREEN}✓ Prerequisites check passed${NC}"
    else
        handle_error "Prerequisites check"
    fi
else
    echo -e "${YELLOW}⚠ Skipping prerequisites check${NC}"
fi

# Step 2: Set up environment variables
print_step "Step 2/5: Setting Up Environment Variables"

ENV_ARGS=""
if [ "$DEMO_MODE" = "true" ]; then
    ENV_ARGS="--demo"
fi

if "$SCRIPT_DIR/setup-environment-vars.sh" $ENV_ARGS; then
    echo -e "${GREEN}✓ Environment variables configured${NC}"
    
    # Load the developer config
    if [ -f "$PROJECT_ROOT/docker/envs/.developer-config" ]; then
        source "$PROJECT_ROOT/docker/envs/.developer-config"
    fi
else
    handle_error "Environment setup"
fi

# Step 3: Set up Docker Compose
print_step "Step 3/6: Setting Up Docker Compose"

if "$SCRIPT_DIR/setup-docker-compose.sh"; then
    echo -e "${GREEN}✓ Docker Compose configured${NC}"
else
    handle_error "Docker Compose setup"
fi

# Step 3.5: Set up Code-server
print_step "Step 3.5/6: Setting Up Code-server (Web IDE)"

CODE_SERVER_ARGS=""
if [ "$DEMO_MODE" = "true" ]; then
    CODE_SERVER_ARGS="--demo"
fi

if "$SCRIPT_DIR/setup-code-server.sh" $CODE_SERVER_ARGS; then
    echo -e "${GREEN}✓ Code-server configured${NC}"
else
    handle_error "Code-server setup"
fi

# Step 4: Build and start services
print_step "Step 4/6: Building and Starting Services"

cd "$PROJECT_ROOT"

if [ "$SKIP_BUILD" != "true" ]; then
    echo "Building Docker images (this may take a few minutes)..."
    if docker compose -f docker-compose.dev.yml build; then
        echo -e "${GREEN}✓ Docker images built${NC}"
    else
        handle_error "Docker build"
    fi
else
    echo -e "${YELLOW}⚠ Skipping Docker build${NC}"
fi

echo "Starting services..."
if docker compose -f docker-compose.dev.yml up -d; then
    echo -e "${GREEN}✓ Services started${NC}"
    
    # Wait for services to be ready
    echo -n "Waiting for services to be ready"
    for i in {1..30}; do
        echo -n "."
        sleep 2
        if docker compose -f docker-compose.dev.yml exec -T backend curl -s http://localhost:8000/api/v1/health/ > /dev/null 2>&1; then
            echo -e "\n${GREEN}✓ Services are ready${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "\n${YELLOW}⚠ Services taking longer than expected to start${NC}"
        fi
    done
else
    handle_error "Docker Compose start"
fi

# Step 5: Initialize database
print_step "Step 5/6: Initializing Database"

if "$SCRIPT_DIR/initialize-database.sh"; then
    echo -e "${GREEN}✓ Database initialized${NC}"
else
    echo -e "${YELLOW}⚠ Database initialization had some issues (non-critical)${NC}"
fi

# Final verification
print_step "Step 6/6: Final Verification"

if "$SCRIPT_DIR/verify-setup.sh"; then
    echo -e "${GREEN}✓ Verification passed${NC}"
else
    echo -e "${YELLOW}⚠ Some verification checks failed${NC}"
    SETUP_COMPLETE=false
fi

# Summary
echo -e "\n${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                      Setup Complete!                         ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}\n"

if [ "$SETUP_COMPLETE" = "true" ]; then
    echo -e "${GREEN}✓ MTK Care development environment is ready!${NC}\n"
else
    echo -e "${YELLOW}⚠ Setup completed with some warnings.${NC}\n"
fi

echo -e "${BLUE}Quick Start Guide:${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "1. Access the application:"
echo -e "   Frontend:     ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend API:  ${GREEN}http://localhost:8000/api/v1/${NC}"
echo -e "   Django Admin: ${GREEN}http://localhost:8000/admin/${NC}"
echo -e "   Web IDE:      ${GREEN}http://localhost:8080${NC}"
echo ""
echo -e "2. Common commands:"
echo -e "   View logs:    ${YELLOW}docker-compose -f docker-compose.dev.yml logs -f [service]${NC}"
echo -e "   Stop all:     ${YELLOW}docker-compose -f docker-compose.dev.yml down${NC}"
echo -e "   Restart:      ${YELLOW}docker-compose -f docker-compose.dev.yml restart [service]${NC}"
echo ""
echo -e "3. Helper functions:"
echo -e "   Source this:  ${YELLOW}source scripts/docker-dev-setup/docker-helpers.sh${NC}"
echo -e "   Then use:     ${YELLOW}django_manage, django_shell, dev_logs, etc.${NC}"

if [ "$DEMO_MODE" = "true" ]; then
    echo -e "\n${YELLOW}Demo Mode Credentials:${NC}"
    echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "Django Admin: ${BLUE}admin / admin123${NC}"
    echo -e "${RED}⚠ These are insecure demo credentials - DO NOT use in production!${NC}"
elif [ -f "$PROJECT_ROOT/docker/envs/.superuser-credentials" ]; then
    echo -e "\n${YELLOW}Your superuser credentials have been saved to:${NC}"
    echo -e "${BLUE}docker/envs/.superuser-credentials${NC}"
    echo -e "${RED}Please save these credentials securely and delete the file!${NC}"
fi

echo -e "\n${GREEN}Happy coding! 🚀${NC}\n"

# Optionally open browser
if [ "$AUTO_YES" != "true" ] && command -v xdg-open &> /dev/null; then
    read -p "Would you like to open the frontend in your browser? [y/N] " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open http://localhost:3000
    fi
fi