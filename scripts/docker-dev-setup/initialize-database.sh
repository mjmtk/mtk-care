#!/bin/bash

# initialize-database.sh - Initialize database with migrations and seed data
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

echo "Initializing MTK Care database..."
echo "================================"

# Load developer config if it exists
if [ -f "$PROJECT_ROOT/docker/envs/.developer-config" ]; then
    source "$PROJECT_ROOT/docker/envs/.developer-config"
fi

# Function to run Django management commands
run_django_command() {
    docker-compose -f "$PROJECT_ROOT/docker-compose.dev.yml" exec -T backend python manage.py "$@"
}

# Function to check if container is running
check_container() {
    local container=$1
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        return 0
    else
        return 1
    fi
}

# Function to wait for database
wait_for_db() {
    echo -e "${BLUE}Waiting for database to be ready...${NC}"
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose -f "$PROJECT_ROOT/docker-compose.dev.yml" exec -T postgres pg_isready -U "${DB_USER:-mtk_dev}" > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC} Database is ready!"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e "\n${RED}✗${NC} Database failed to start after $max_attempts attempts"
    return 1
}

# Step 1: Check if containers are running
echo -e "\n${BLUE}Step 1: Checking containers...${NC}"
echo "------------------------------"

if ! check_container "mtk_backend" || ! check_container "mtk_postgres"; then
    echo -e "${YELLOW}⚠${NC}  Containers not running. Starting services..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.dev.yml" up -d postgres redis backend
    sleep 5
fi

# Step 2: Wait for database
echo -e "\n${BLUE}Step 2: Database connection...${NC}"
echo "------------------------------"

if ! wait_for_db; then
    echo -e "${RED}Failed to connect to database. Please check Docker logs.${NC}"
    exit 1
fi

# Step 3: Run Django migrations
echo -e "\n${BLUE}Step 3: Running Django migrations...${NC}"
echo "------------------------------------"

echo "Running database migrations..."
if run_django_command migrate; then
    echo -e "${GREEN}✓${NC} Migrations completed successfully"
else
    echo -e "${RED}✗${NC} Migration failed"
    exit 1
fi

# Step 4: Load initial data fixtures
echo -e "\n${BLUE}Step 4: Loading initial data...${NC}"
echo "-------------------------------"

# Define fixtures to load in order
FIXTURES=(
    "optionlists/fixtures/*.json"
    "reference_data/fixtures/languages.json"
    "reference_data/fixtures/countries.json"
    "users/fixtures/grouprolemapping.json"
)

for fixture_pattern in "${FIXTURES[@]}"; do
    # Check if fixtures exist
    if docker-compose -f "$PROJECT_ROOT/docker-compose.dev.yml" exec -T backend bash -c "ls /app/apps/$fixture_pattern 2>/dev/null" > /dev/null; then
        echo "Loading fixtures: $fixture_pattern"
        if run_django_command loaddata "apps/$fixture_pattern"; then
            echo -e "${GREEN}✓${NC} Loaded $fixture_pattern"
        else
            echo -e "${YELLOW}⚠${NC}  Failed to load $fixture_pattern (continuing...)"
        fi
    else
        echo -e "${YELLOW}⚠${NC}  No fixtures found for pattern: $fixture_pattern"
    fi
done

# Step 5: Create superuser
echo -e "\n${BLUE}Step 5: Creating superuser...${NC}"
echo "-----------------------------"

# Check if we're in demo mode
if [ "$DEMO_MODE" = "true" ]; then
    SUPERUSER_EMAIL="admin@mtk-care.local"
    SUPERUSER_USERNAME="admin"
    SUPERUSER_PASSWORD="admin123"
    echo -e "${YELLOW}⚠${NC}  Creating demo superuser (admin/admin123)"
else
    SUPERUSER_EMAIL="${DEVELOPER_EMAIL:-developer@mtk-care.local}"
    SUPERUSER_USERNAME="${DEVELOPER_NAME:-developer}"
    SUPERUSER_PASSWORD=$(openssl rand -base64 12)
fi

# Create superuser using Django shell
echo "from django.contrib.auth import get_user_model; \
User = get_user_model(); \
if not User.objects.filter(username='$SUPERUSER_USERNAME').exists(): \
    User.objects.create_superuser('$SUPERUSER_USERNAME', '$SUPERUSER_EMAIL', '$SUPERUSER_PASSWORD'); \
    print('Superuser created successfully'); \
else: \
    print('Superuser already exists')" | run_django_command shell

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Superuser configured"
    if [ "$DEMO_MODE" != "true" ]; then
        echo -e "${YELLOW}Superuser credentials:${NC}"
        echo -e "  Username: ${BLUE}$SUPERUSER_USERNAME${NC}"
        echo -e "  Password: ${BLUE}$SUPERUSER_PASSWORD${NC}"
        echo -e "  ${YELLOW}⚠ Save these credentials securely!${NC}"
        
        # Save to a secure file
        echo "# Django Superuser Credentials (DELETE AFTER SAVING)" > "$PROJECT_ROOT/docker/envs/.superuser-credentials"
        echo "Username: $SUPERUSER_USERNAME" >> "$PROJECT_ROOT/docker/envs/.superuser-credentials"
        echo "Password: $SUPERUSER_PASSWORD" >> "$PROJECT_ROOT/docker/envs/.superuser-credentials"
        chmod 600 "$PROJECT_ROOT/docker/envs/.superuser-credentials"
    fi
else
    echo -e "${YELLOW}⚠${NC}  Could not create superuser (may already exist)"
fi

# Step 6: Collect static files
echo -e "\n${BLUE}Step 6: Collecting static files...${NC}"
echo "----------------------------------"

if run_django_command collectstatic --noinput; then
    echo -e "${GREEN}✓${NC} Static files collected"
else
    echo -e "${YELLOW}⚠${NC}  Failed to collect static files (non-critical)"
fi

# Step 7: Create sample data (optional)
echo -e "\n${BLUE}Step 7: Sample data (optional)...${NC}"
echo "---------------------------------"

read -p "Would you like to create sample data for testing? [y/N]: " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create a simple Django command to generate sample data
    cat << 'EOF' | run_django_command shell
from apps.client_management.models import Client
from apps.external_organisation_management.models import ExternalOrganisation
from apps.referral_management.models import Referral, ServiceProvider
from django.contrib.auth import get_user_model
from datetime import date, timedelta
import random

User = get_user_model()

# Create sample external organizations
orgs = []
for i in range(5):
    org, _ = ExternalOrganisation.objects.get_or_create(
        name=f"Test Organization {i+1}",
        defaults={
            'organisation_type': 'healthcare',
            'is_active': True
        }
    )
    orgs.append(org)

# Create sample service providers
providers = []
for i in range(3):
    provider, _ = ServiceProvider.objects.get_or_create(
        name=f"Test Service Provider {i+1}",
        defaults={
            'is_active': True,
            'contact_email': f'provider{i+1}@test.com'
        }
    )
    providers.append(provider)

# Create sample clients
clients = []
for i in range(10):
    client, _ = Client.objects.get_or_create(
        first_name=f"Test{i+1}",
        last_name=f"Client{i+1}",
        defaults={
            'date_of_birth': date.today() - timedelta(days=365*random.randint(20, 60)),
            'email': f'client{i+1}@test.com',
            'phone': f'555-000{i+1:04d}',
            'is_active': True
        }
    )
    clients.append(client)

# Create sample referrals
for i in range(15):
    client = random.choice(clients)
    provider = random.choice(providers)
    referral, _ = Referral.objects.get_or_create(
        client=client,
        referring_organisation=random.choice(orgs),
        defaults={
            'service_provider': provider,
            'referral_date': date.today() - timedelta(days=random.randint(0, 30)),
            'priority': random.choice(['low', 'medium', 'high']),
            'status': random.choice(['pending', 'accepted', 'in_progress']),
            'notes': f'Sample referral {i+1} for testing'
        }
    )

print(f"Created {len(orgs)} organizations, {len(providers)} providers, {len(clients)} clients, and {Referral.objects.count()} referrals")
EOF

    echo -e "${GREEN}✓${NC} Sample data created"
fi

# Step 8: Database info
echo -e "\n${BLUE}Step 8: Database information...${NC}"
echo "-------------------------------"

# Get database stats
echo "Database statistics:"
docker-compose -f "$PROJECT_ROOT/docker-compose.dev.yml" exec -T postgres psql -U "${DB_USER:-mtk_dev}" -d "${DB_NAME:-mtk_care_dev}" -c "\dt" | grep -E "apps_|auth_|django_" | wc -l | xargs -I {} echo "  Tables created: {}"

# Summary
echo -e "\n${GREEN}Database initialization complete!${NC}"
echo "=================================="
echo -e "Database: ${BLUE}${DB_NAME:-mtk_care_dev}${NC}"
echo -e "User: ${BLUE}${DB_USER:-mtk_dev}${NC}"

if [ "$DEMO_MODE" = "true" ]; then
    echo -e "\n${YELLOW}Demo credentials:${NC}"
    echo -e "  Django admin: ${BLUE}admin / admin123${NC}"
    echo -e "  ${RED}⚠ For development only!${NC}"
else
    echo -e "\n${YELLOW}Check docker/envs/.superuser-credentials for admin login${NC}"
fi

echo -e "\nAccess Django admin at: ${BLUE}http://localhost:8000/admin${NC}"