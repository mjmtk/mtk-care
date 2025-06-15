#!/bin/bash
# Pre-commit hook to validate role mappings before commits
# Install this hook by running: ln -s ../../scripts/pre-commit-role-check.sh .git/hooks/pre-commit

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Running pre-commit role mappings check...${NC}"

# Check if we're in a Django project
if [ ! -f "$BACKEND_DIR/manage.py" ]; then
    echo -e "${YELLOW}⚠️ Not a Django project, skipping role mappings check${NC}"
    exit 0
fi

# Check if role mappings related files were modified
role_files_changed=false
if git diff --cached --name-only | grep -E "(role|mapping|auth|user)" > /dev/null 2>&1; then
    role_files_changed=true
fi

# Only run check if role-related files changed or if forced
if [ "$role_files_changed" = true ] || [ "${FORCE_ROLE_CHECK:-false}" = true ]; then
    echo -e "${YELLOW}Role-related files detected, running validation...${NC}"
    
    cd "$BACKEND_DIR"
    
    # Check if we can connect to the database
    if python manage.py check --database default > /dev/null 2>&1; then
        # Run role mappings validation
        if python manage.py validate_role_mappings --output-format text > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Role mappings validation passed${NC}"
        else
            echo -e "${RED}❌ Role mappings validation failed!${NC}"
            echo "Run 'cd backend && python manage.py validate_role_mappings' for details"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️ Cannot connect to database, skipping role validation${NC}"
    fi
else
    echo -e "${GREEN}✅ No role-related changes detected${NC}"
fi

echo -e "${GREEN}✅ Pre-commit role check completed${NC}"
exit 0