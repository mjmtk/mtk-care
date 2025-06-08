#!/bin/bash

# Azure Django Migration Script
# Usage: ./azure_migrate.sh [production|staging]

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Configuration
if [ "$ENVIRONMENT" = "production" ]; then
    WEBAPP_NAME="mtkcare-backend"
    RESOURCE_GROUP="your-production-rg"
    DB_NAME="your-prod-db"
else
    WEBAPP_NAME="mtkcare-backend-staging"
    RESOURCE_GROUP="your-staging-rg"
    DB_NAME="your-staging-db"
fi

echo "=== Django Migration Script for $ENVIRONMENT ==="
echo "Timestamp: $TIMESTAMP"

# Function to run commands via SSH
run_ssh_command() {
    az webapp ssh --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP --command "$1"
}

# 1. Check current migration status
echo "1. Checking current migration status..."
run_ssh_command "cd /home/site/wwwroot && python manage.py showmigrations --list | tail -20"

# 2. Create backup (optional - uncomment if you have backup configured)
# echo "2. Creating database backup..."
# az sql db export --resource-group $RESOURCE_GROUP \
#   --server your-server \
#   --database $DB_NAME \
#   --admin-user $DB_USER \
#   --admin-password $DB_PASSWORD \
#   --storage-key $STORAGE_KEY \
#   --storage-key-type StorageAccessKey \
#   --storage-uri "https://yourstorage.blob.core.windows.net/backups/pre-migration-$TIMESTAMP.bacpac"

# 3. Run migrations
echo "3. Running migrations..."
run_ssh_command "cd /home/site/wwwroot && python manage.py migrate --noinput"

# 4. Verify migrations
echo "4. Verifying migrations..."
run_ssh_command "cd /home/site/wwwroot && python manage.py showmigrations --list | grep '\[X\]' | tail -10"

echo "=== Migration completed ==="
echo "If you need to rollback, use:"
echo "az webapp ssh --name $WEBAPP_NAME --resource-group $RESOURCE_GROUP"
echo "Then run: python manage.py migrate <app_name> <migration_number>"