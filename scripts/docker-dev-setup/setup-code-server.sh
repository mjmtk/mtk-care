#!/bin/bash

# setup-code-server.sh - Set up LinuxServer code-server for web-based development
# 
# NOTE: This is a simple localhost-only setup for development.
# For production VPS deployments, consider using Traefik reverse proxy setup
# like: https://github.com/JamesTurland/JimsGarage/blob/main/Code-Server/docker-compose.yaml
# which provides:
# - Domain-based routing (code-server.yourdomain.com)
# - Automatic HTTPS/SSL certificates with Let's Encrypt
# - Better security with network isolation
# - Production-ready reverse proxy configuration
# 
# Future enhancement: Add --production flag to enable Traefik setup
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

echo "Setting up LinuxServer code-server for MTK Care development..."
echo "============================================================"

# Load developer config if it exists
if [ -f "$PROJECT_ROOT/docker/envs/.developer-config" ]; then
    source "$PROJECT_ROOT/docker/envs/.developer-config"
fi

# Check if running in demo mode
DEMO_MODE=false
if [ "$1" == "--demo" ]; then
    DEMO_MODE=true
    echo -e "${YELLOW}⚠ Running in DEMO mode - using default credentials${NC}"
fi

# Step 1: Create code-server directories
echo -e "\n${BLUE}Step 1: Creating code-server directories...${NC}"
echo "-------------------------------------------"

mkdir -p "$PROJECT_ROOT/docker/volumes/code-server/config"
mkdir -p "$PROJECT_ROOT/docker/volumes/code-server/workspace"

echo -e "${GREEN}✓${NC} Created code-server directories"

# Step 2: Generate code-server password
echo -e "\n${BLUE}Step 2: Setting up code-server credentials...${NC}"
echo "----------------------------------------------"

if [ "$DEMO_MODE" = "true" ]; then
    CODE_SERVER_PASSWORD="demo123"
    echo -e "${YELLOW}⚠${NC}  Using demo password: demo123"
else
    # Generate secure password
    CODE_SERVER_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-12)
    echo -e "${GREEN}✓${NC} Generated secure password: $CODE_SERVER_PASSWORD"
fi

# Step 3: Create code-server configuration
echo -e "\n${BLUE}Step 3: Creating code-server configuration...${NC}"
echo "----------------------------------------------"

# Create code-server config file
cat > "$PROJECT_ROOT/docker/volumes/code-server/config/config.yaml" << EOF
bind-addr: 0.0.0.0:8080
auth: password
password: $CODE_SERVER_PASSWORD
cert: false
EOF

echo -e "${GREEN}✓${NC} Created code-server config"

# Step 4: Create VS Code settings for MTK Care
echo -e "\n${BLUE}Step 4: Creating VS Code workspace settings...${NC}"
echo "----------------------------------------------"

mkdir -p "$PROJECT_ROOT/docker/volumes/code-server/config/data/User"

# Create VS Code settings optimized for the MTK Care stack
cat > "$PROJECT_ROOT/docker/volumes/code-server/config/data/User/settings.json" << 'EOF'
{
    "workbench.colorTheme": "Default Dark+",
    "editor.fontSize": 14,
    "editor.tabSize": 2,
    "editor.insertSpaces": true,
    "editor.detectIndentation": true,
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "files.eol": "\n",
    "files.trimTrailingWhitespace": true,
    "files.insertFinalNewline": true,
    "terminal.integrated.defaultProfile.linux": "bash",
    "terminal.integrated.fontSize": 13,
    "git.enableSmartCommit": true,
    "git.confirmSync": false,
    "python.defaultInterpreterPath": "/usr/bin/python3",
    "python.terminal.activateEnvironment": false,
    "typescript.preferences.includePackageJsonAutoImports": "auto",
    "typescript.suggest.autoImports": true,
    "javascript.suggest.autoImports": true,
    "emmet.includeLanguages": {
        "typescript": "html",
        "javascript": "html"
    },
    "docker.showStartPage": false,
    "extensions.autoCheckUpdates": false,
    "extensions.autoUpdate": false,
    "telemetry.enableTelemetry": false,
    "workbench.startupEditor": "none"
}
EOF

# Create extensions list
cat > "$PROJECT_ROOT/docker/volumes/code-server/config/data/User/extensions.json" << 'EOF'
[
    "ms-python.python",
    "ms-python.flake8",
    "ms-python.black-formatter",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "ms-azuretools.vscode-docker",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-markdown"
]
EOF

echo -e "${GREEN}✓${NC} Created VS Code workspace settings"

# Step 5: Create code-server environment file
echo -e "\n${BLUE}Step 5: Creating code-server environment file...${NC}"
echo "------------------------------------------------"

cat > "$PROJECT_ROOT/docker/env-templates/code-server.env.template" << 'EOF'
# LinuxServer code-server configuration
PUID=1000
PGID=1000
TZ=UTC
PASSWORD={{CODE_SERVER_PASSWORD}}
SUDO_PASSWORD={{CODE_SERVER_PASSWORD}}
DEFAULT_WORKSPACE=/workspace
EOF

# Create actual env file
if [ -f "$PROJECT_ROOT/docker/env-templates/code-server.env.template" ]; then
    cp "$PROJECT_ROOT/docker/env-templates/code-server.env.template" "$PROJECT_ROOT/docker/envs/code-server.env"
    sed -i "s/{{CODE_SERVER_PASSWORD}}/$CODE_SERVER_PASSWORD/g" "$PROJECT_ROOT/docker/envs/code-server.env"
fi

echo -e "${GREEN}✓${NC} Created code-server environment file"

# Step 6: Create code-server startup script
echo -e "\n${BLUE}Step 6: Creating code-server startup script...${NC}"
echo "----------------------------------------------"

cat > "$PROJECT_ROOT/docker/volumes/code-server/config/startup.sh" << 'EOF'
#!/bin/bash

# Install extensions on first startup
EXTENSION_FLAG="/config/.extensions_installed"

if [ ! -f "$EXTENSION_FLAG" ]; then
    echo "Installing VS Code extensions..."
    
    # Core extensions for MTK Care development
    code-server --install-extension ms-python.python
    code-server --install-extension ms-python.flake8
    code-server --install-extension ms-python.black-formatter
    code-server --install-extension bradlc.vscode-tailwindcss
    code-server --install-extension esbenp.prettier-vscode
    code-server --install-extension dbaeumer.vscode-eslint
    code-server --install-extension ms-vscode.vscode-typescript-next
    code-server --install-extension ms-azuretools.vscode-docker
    code-server --install-extension ms-vscode.vscode-json
    code-server --install-extension redhat.vscode-yaml
    code-server --install-extension formulahendry.auto-rename-tag
    code-server --install-extension christian-kohler.path-intellisense
    code-server --install-extension ms-vscode.vscode-markdown
    
    # Create flag file
    touch "$EXTENSION_FLAG"
    echo "Extensions installed successfully!"
fi

# Set up git configuration if provided
if [ -n "$GIT_USER_NAME" ] && [ -n "$GIT_USER_EMAIL" ]; then
    git config --global user.name "$GIT_USER_NAME"
    git config --global user.email "$GIT_USER_EMAIL"
fi

echo "Code-server startup complete!"
EOF

chmod +x "$PROJECT_ROOT/docker/volumes/code-server/config/startup.sh"

echo -e "${GREEN}✓${NC} Created startup script"

# Step 7: Update .gitignore for code-server
echo -e "\n${BLUE}Step 7: Updating .gitignore...${NC}"
echo "------------------------------"

if ! grep -q "code-server" "$PROJECT_ROOT/.gitignore" 2>/dev/null; then
    cat >> "$PROJECT_ROOT/.gitignore" << EOF

# Code-server configuration
docker/volumes/code-server/
.vscode/
EOF
    echo -e "${GREEN}✓${NC} Updated .gitignore"
else
    echo -e "${GREEN}✓${NC} .gitignore already configured"
fi

# Step 8: Save credentials
echo -e "\n${BLUE}Step 8: Saving credentials...${NC}"
echo "------------------------------"

# Save code-server credentials
if [ "$DEMO_MODE" != "true" ]; then
    cat >> "$PROJECT_ROOT/docker/envs/.developer-config" << EOF

# Code-server credentials
CODE_SERVER_PASSWORD="$CODE_SERVER_PASSWORD"
CODE_SERVER_URL="http://localhost:8080"
EOF

    # Also create a separate credentials file
    cat > "$PROJECT_ROOT/docker/envs/.code-server-credentials" << EOF
# Code-server Web IDE Credentials
URL: http://localhost:8080
Password: $CODE_SERVER_PASSWORD

# SSH Access (if needed)
User: abc
Password: $CODE_SERVER_PASSWORD

# Generated on: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# Developer: ${DEVELOPER_NAME:-unknown}
EOF
    chmod 600 "$PROJECT_ROOT/docker/envs/.code-server-credentials"
    
    echo -e "${GREEN}✓${NC} Credentials saved to docker/envs/.code-server-credentials"
fi

# Summary
echo -e "\n${GREEN}Code-server setup complete!${NC}"
echo "=========================="
echo -e "Web IDE URL:      ${BLUE}http://localhost:8080${NC}"
echo -e "Password:         ${BLUE}$CODE_SERVER_PASSWORD${NC}"

if [ "$DEMO_MODE" = "true" ]; then
    echo -e "\n${YELLOW}⚠ DEMO MODE CREDENTIALS:${NC}"
    echo -e "  Password: ${BLUE}demo123${NC}"
    echo -e "${RED}  DO NOT use these in production!${NC}"
else
    echo -e "\n${YELLOW}Security notes:${NC}"
    echo -e "  • Credentials saved in docker/envs/.code-server-credentials"
    echo -e "  • Save password securely and delete the credentials file"
    echo -e "  • Access is limited to localhost by default"
fi

echo -e "\n${BLUE}Next steps:${NC}"
echo "1. Update docker-compose.dev.yml to include code-server service"
echo "2. Start the environment with: docker-compose -f docker-compose.dev.yml up -d"
echo "3. Access the web IDE at http://localhost:8080"

echo -e "\n${GREEN}✓${NC} Code-server configuration complete!"