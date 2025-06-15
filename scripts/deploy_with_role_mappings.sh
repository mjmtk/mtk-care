#!/bin/bash
set -euo pipefail

# MTK Care Deployment Script with Role Mappings Management
# This script handles the complete deployment process including fetching
# current Entra ID groups and setting up role mappings.

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_DIR/backend"
TEMP_DIR="/tmp/mtkcare-deploy"
ROLE_MAPPINGS_FILE="$TEMP_DIR/role_mappings.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${BLUE}==== $1 ====${NC}"
}

# Error handling
cleanup() {
    if [ -d "$TEMP_DIR" ]; then
        log_info "Cleaning up temporary files..."
        rm -rf "$TEMP_DIR"
    fi
}

error_exit() {
    log_error "$1"
    cleanup
    exit 1
}

# Set up error handling
trap cleanup EXIT
trap 'error_exit "Script interrupted by user"' INT TERM

# Check prerequisites
check_prerequisites() {
    log_step "Checking Prerequisites"
    
    # Check required environment variables
    local required_vars=(
        "AZURE_TENANT_ID"
        "AZURE_CLIENT_ID" 
        "AZURE_CLIENT_SECRET"
        "DJANGO_SECRET_KEY"
        "DATABASE_URL"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var:-}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        log_error "Missing required environment variables:"
        printf ' - %s\n' "${missing_vars[@]}"
        error_exit "Please set all required environment variables"
    fi
    
    # Check if Python is available
    if ! command -v python3 &> /dev/null; then
        error_exit "Python 3 is required but not installed"
    fi
    
    # Check if we're in the right directory
    if [ ! -f "$BACKEND_DIR/manage.py" ]; then
        error_exit "Backend directory not found. Are you running from the project root?"
    fi
    
    log_success "All prerequisites met"
}

# Create temporary directory
setup_temp_dir() {
    log_step "Setting Up Temporary Directory"
    mkdir -p "$TEMP_DIR"
    log_success "Temporary directory created: $TEMP_DIR"
}

# Fetch current role mappings from Entra ID
fetch_role_mappings() {
    log_step "Fetching Role Mappings from Entra ID"
    
    log_info "Connecting to Entra ID to fetch MC_ groups..."
    
    # Run the fetch script
    if python3 "$SCRIPT_DIR/fetch_entra_groups.py" --output "$ROLE_MAPPINGS_FILE"; then
        log_success "Role mappings fetched successfully"
        
        # Show summary
        if [ -f "$ROLE_MAPPINGS_FILE" ]; then
            local group_count=$(python3 -c "
import json
with open('$ROLE_MAPPINGS_FILE', 'r') as f:
    data = json.load(f)
print(data.get('total_groups', 0))
")
            log_info "Found $group_count MC_ groups in Entra ID"
        fi
    else
        log_warning "Failed to fetch role mappings from Entra ID"
        log_info "Will use default hardcoded mappings as fallback"
        return 1
    fi
}

# Setup Django backend
setup_backend() {
    log_step "Setting Up Django Backend"
    
    cd "$BACKEND_DIR"
    
    # Activate virtual environment if it exists
    if [ -f ".venv/bin/activate" ]; then
        log_info "Activating virtual environment..."
        source .venv/bin/activate
    else
        log_warning "No virtual environment found, using system Python"
    fi
    
    # Install/update dependencies
    log_info "Installing Python dependencies..."
    pip install -q -r requirements.txt
    
    # Run migrations
    log_info "Running database migrations..."
    python manage.py migrate --noinput
    
    # Seed roles (ensure all required roles exist)
    log_info "Seeding application roles..."
    python manage.py seed_roles
    
    log_success "Backend setup complete"
}

# Setup role mappings
setup_role_mappings() {
    log_step "Setting Up Role Mappings"
    
    cd "$BACKEND_DIR"
    
    # First, validate current state
    log_info "Validating current role mappings..."
    python manage.py validate_role_mappings --output-format text || {
        log_warning "Role mappings validation found issues"
    }
    
    # Setup new mappings
    if [ -f "$ROLE_MAPPINGS_FILE" ]; then
        log_info "Setting up role mappings from fetched Entra ID groups..."
        python manage.py setup_role_mappings --mappings-file "$ROLE_MAPPINGS_FILE" --force
    else
        log_warning "Using default role mappings (Entra ID fetch failed)"
        python manage.py setup_role_mappings --use-defaults --force
    fi
    
    log_success "Role mappings configured"
}

# Validate deployment
validate_deployment() {
    log_step "Validating Deployment"
    
    cd "$BACKEND_DIR"
    
    # Run comprehensive health check
    log_info "Running role mappings health check..."
    if python manage.py validate_role_mappings --check-azure --fail-on-warnings; then
        log_success "All health checks passed"
    else
        error_exit "Health checks failed - deployment aborted"
    fi
    
    # Test database connection
    log_info "Testing database connection..."
    python manage.py check --deploy
    
    log_success "Deployment validation complete"
}

# Collect static files (for production)
collect_static() {
    log_step "Collecting Static Files"
    
    cd "$BACKEND_DIR"
    
    log_info "Collecting static files..."
    python manage.py collectstatic --noinput --clear
    
    log_success "Static files collected"
}

# Display final summary
show_summary() {
    log_step "Deployment Summary"
    
    cd "$BACKEND_DIR"
    
    # Show role mappings summary
    log_info "Current role mappings:"
    python manage.py list_role_mappings
    
    # Show deployment info
    log_info "Deployment completed successfully!"
    log_info "Backend directory: $BACKEND_DIR"
    log_info "Environment: ${DEPLOYMENT_ENV:-production}"
    log_info "Timestamp: $(date)"
    
    if [ -f "$ROLE_MAPPINGS_FILE" ]; then
        log_info "Role mappings source: Entra ID (live fetch)"
    else
        log_warning "Role mappings source: Default hardcoded values"
    fi
}

# Main deployment process
main() {
    log_info "Starting MTK Care deployment with role mappings..."
    log_info "Timestamp: $(date)"
    
    check_prerequisites
    setup_temp_dir
    
    # Fetch role mappings (non-blocking)
    fetch_role_mappings || true
    
    setup_backend
    setup_role_mappings
    
    # Only collect static in production
    if [ "${DEPLOYMENT_ENV:-production}" = "production" ]; then
        collect_static
    fi
    
    validate_deployment
    show_summary
    
    log_success "🎉 Deployment completed successfully!"
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "fetch-only")
        log_step "Fetching Role Mappings Only"
        check_prerequisites
        setup_temp_dir
        fetch_role_mappings
        if [ -f "$ROLE_MAPPINGS_FILE" ]; then
            log_info "Role mappings saved to: $ROLE_MAPPINGS_FILE"
            cat "$ROLE_MAPPINGS_FILE"
        fi
        ;;
    "validate-only")
        log_step "Validation Only"
        cd "$BACKEND_DIR"
        python manage.py validate_role_mappings --check-azure
        ;;
    "help"|"-h"|"--help")
        echo "MTK Care Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy       Full deployment with role mappings (default)"
        echo "  fetch-only   Only fetch role mappings from Entra ID"
        echo "  validate-only Only validate current role mappings"
        echo "  help         Show this help message"
        echo ""
        echo "Environment Variables Required:"
        echo "  AZURE_TENANT_ID     - Azure tenant ID"
        echo "  AZURE_CLIENT_ID     - Azure application client ID"
        echo "  AZURE_CLIENT_SECRET - Azure application client secret"
        echo "  DJANGO_SECRET_KEY   - Django secret key"
        echo "  DATABASE_URL        - Database connection string"
        echo ""
        echo "Optional Environment Variables:"
        echo "  DEPLOYMENT_ENV      - Set to 'development' to skip static collection"
        ;;
    *)
        error_exit "Unknown command: $1. Use '$0 help' for usage information."
        ;;
esac