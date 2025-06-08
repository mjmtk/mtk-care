# Django Migrations in Azure Production

## Overview

This guide covers best practices for managing Django migrations in Azure production environments, including strategies for safe deployment and rollback capabilities.

## Migration Strategy

### 1. Development to Production Workflow

#### Local Development
```bash
# Create migrations locally
python manage.py makemigrations

# Test migrations locally
python manage.py migrate

# Test rollback locally
python manage.py migrate app_name <previous_migration_number>
```

#### Pre-Production Checklist
- [ ] Review migration files for backwards compatibility
- [ ] Test migrations on a staging database
- [ ] Create database backup
- [ ] Document rollback procedure
- [ ] Test data migrations with production-like data

### 2. Azure Deployment Options

#### Option A: SSH into Web App (Recommended for Small Teams)

1. Deploy code to Azure Web App
2. SSH into the container:
```bash
# From Azure Portal or CLI
az webapp ssh --name mtkcare-backend --resource-group your-rg
```

3. Run migrations:
```bash
cd /home/site/wwwroot
python manage.py migrate --noinput
```

#### Option B: Azure DevOps Pipeline (Recommended for Teams)

```yaml
# azure-pipelines.yml
- stage: Deploy
  jobs:
  - deployment: DeployWebApp
    steps:
    - task: AzureWebApp@1
      inputs:
        azureSubscription: 'Your-Subscription'
        appName: 'mtkcare-backend'
        
    - task: AzureCLI@2
      displayName: 'Run Django Migrations'
      inputs:
        azureSubscription: 'Your-Subscription'
        scriptType: 'bash'
        scriptLocation: 'inlineScript'
        inlineScript: |
          az webapp ssh --name mtkcare-backend --resource-group your-rg --command "cd /home/site/wwwroot && python manage.py migrate --noinput"
```

#### Option C: Post-Deployment Script

Create a post-deployment script in your Django project:

```bash
# scripts/post_deployment.sh
#!/bin/bash

echo "Running Django migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Post-deployment tasks completed."
```

Configure in Azure Web App settings:
- Set `POST_BUILD_COMMAND` to `bash scripts/post_deployment.sh`

### 3. Rollback Strategies

#### Strategy 1: Backwards-Compatible Migrations (Recommended)

Make migrations that can work with both old and new code:

```python
# Good: Adding a nullable field
class Migration(migrations.Migration):
    operations = [
        migrations.AddField(
            model_name='client',
            name='new_field',
            field=models.CharField(max_length=100, null=True, blank=True),
        ),
    ]
```

Deployment process:
1. Deploy migration (old code still works)
2. Deploy new code
3. If rollback needed, just deploy old code (migration stays)

#### Strategy 2: Reversible Migrations

Ensure all migrations are reversible:

```python
# migrations/0002_add_client_field.py
from django.db import migrations, models

def populate_data(apps, schema_editor):
    Client = apps.get_model('client_management', 'Client')
    # Forward data migration
    Client.objects.filter(status='active').update(is_active=True)

def reverse_populate_data(apps, schema_editor):
    Client = apps.get_model('client_management', 'Client')
    # Reverse data migration
    Client.objects.filter(is_active=True).update(status='active')

class Migration(migrations.Migration):
    operations = [
        migrations.AddField(
            model_name='client',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
        migrations.RunPython(populate_data, reverse_populate_data),
    ]
```

#### Strategy 3: Database Snapshots

Before critical migrations:

```bash
# Azure CLI - Create database backup
az sql db export --resource-group your-rg \
  --server your-server \
  --database your-db \
  --admin-user your-user \
  --admin-password your-password \
  --storage-key your-storage-key \
  --storage-key-type StorageAccessKey \
  --storage-uri "https://yourstorage.blob.core.windows.net/backups/backup-$(date +%Y%m%d-%H%M%S).bacpac"
```

### 4. Best Practices

#### Migration Naming and Organization
```bash
# Use descriptive names when creating migrations
python manage.py makemigrations --name add_client_active_status client_management
```

#### Testing Migrations
```python
# tests/test_migrations.py
from django_migration_testcase import MigrationTest

class TestClientMigrations(MigrationTest):
    migrate_from = '0001_initial'
    migrate_to = '0002_add_client_field'
    
    def test_field_added(self):
        Client = self.get_model('client_management.Client')
        self.assertTrue(hasattr(Client, 'is_active'))
```

#### Zero-Downtime Deployments

1. **Phase 1**: Deploy backwards-compatible migration
2. **Phase 2**: Deploy new code
3. **Phase 3**: Clean up deprecated fields (optional)

Example:
```python
# Phase 1: Add new field (nullable)
migrations.AddField(
    model_name='client',
    name='uuid',
    field=models.UUIDField(null=True),
)

# Phase 2: Populate data and make required
migrations.RunPython(populate_uuids),
migrations.AlterField(
    model_name='client',
    name='uuid',
    field=models.UUIDField(unique=True),
)

# Phase 3: Remove old field (in future release)
migrations.RemoveField(
    model_name='client',
    name='old_id',
)
```

### 5. Automation Script

Create a deployment helper script:

```python
# scripts/deploy_migrations.py
import os
import sys
import subprocess
from datetime import datetime

def create_backup():
    """Create database backup before migration"""
    timestamp = datetime.now().strftime('%Y%m%d-%H%M%S')
    backup_name = f"pre-migration-backup-{timestamp}"
    
    # Add your backup logic here
    print(f"Creating backup: {backup_name}")
    
def run_migrations():
    """Run Django migrations"""
    try:
        subprocess.run(['python', 'manage.py', 'migrate', '--noinput'], check=True)
        print("Migrations completed successfully")
        return True
    except subprocess.CalledProcessError:
        print("Migration failed!")
        return False

def rollback_migrations(app_name, migration_name):
    """Rollback to specific migration"""
    try:
        subprocess.run(['python', 'manage.py', 'migrate', app_name, migration_name], check=True)
        print(f"Rolled back to {app_name} {migration_name}")
        return True
    except subprocess.CalledProcessError:
        print("Rollback failed!")
        return False

if __name__ == "__main__":
    # Set Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')
    
    # Create backup
    create_backup()
    
    # Run migrations
    if not run_migrations():
        print("Deployment failed. Check logs for details.")
        sys.exit(1)
```

### 6. Monitoring and Alerts

Set up monitoring for migration issues:

```python
# backend/apps/common/management/commands/check_migrations.py
from django.core.management.base import BaseCommand
from django.db.migrations.executor import MigrationExecutor
from django.db import connection

class Command(BaseCommand):
    def handle(self, *args, **options):
        executor = MigrationExecutor(connection)
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        
        if plan:
            self.stdout.write(
                self.style.WARNING(f'Found {len(plan)} unapplied migrations')
            )
            for migration, backwards in plan:
                self.stdout.write(f"  - {migration}")
            return
            
        self.stdout.write(self.style.SUCCESS('All migrations applied'))
```

### 7. Emergency Rollback Procedure

If a migration causes issues in production:

1. **Immediate Response**:
```bash
# SSH into Azure Web App
az webapp ssh --name mtkcare-backend --resource-group your-rg

# Rollback specific app
python manage.py migrate app_name previous_migration_number

# Or rollback all apps to specific point in time
python manage.py migrate --fake app_name zero
python manage.py migrate app_name target_migration
```

2. **Code Rollback**:
```bash
# Deploy previous version from Azure Portal
# Or use Azure CLI
az webapp deployment source config-zip \
  --resource-group your-rg \
  --name mtkcare-backend \
  --src previous-version.zip
```

3. **Database Restore** (Last Resort):
```bash
# Restore from backup
az sql db restore --resource-group your-rg \
  --server your-server \
  --name your-db \
  --dest-name your-db-restored \
  --time "2025-01-06T10:00:00Z"
```

## Summary

Key recommendations:
1. Always make backwards-compatible migrations when possible
2. Test migrations thoroughly in staging
3. Create backups before major migrations
4. Use automated deployment pipelines
5. Have a clear rollback procedure documented
6. Monitor migration status in production

For this project specifically, consider using Option A (SSH) for now, and move to Option B (Pipeline) as the team grows.