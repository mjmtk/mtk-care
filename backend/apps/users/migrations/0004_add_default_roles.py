from django.db import migrations

def create_default_roles(apps, schema_editor):
    """Create default roles if they don't exist."""
    Role = apps.get_model('users', 'Role')
    
    # Default roles with their levels and descriptions
    DEFAULT_ROLES = [
        {
            'name': 'Admin',
            'level': 1,
            'description': 'Full system access with all permissions.'
        },
        {
            'name': 'Manager',
            'level': 2,
            'description': 'Can manage users and content within their department.'
        },
        {
            'name': 'Provider',
            'level': 3,
            'description': 'Healthcare provider with access to patient records and care plans.'
        },
        {
            'name': 'Staff',
            'level': 4,
            'description': 'General staff with limited access to system features.'
        },
    ]
    
    for role_data in DEFAULT_ROLES:
        Role.objects.get_or_create(
            name=role_data['name'],
            defaults={
                'level': role_data['level'],
                'description': role_data['description']
            }
        )

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0003_grouprolemapping'),
    ]

    operations = [
        migrations.RunPython(
            create_default_roles,
            # No reverse operation needed as this is a data migration
            reverse_code=migrations.RunPython.noop,
        ),
    ]
