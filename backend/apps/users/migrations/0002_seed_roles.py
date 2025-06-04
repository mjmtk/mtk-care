from django.db import migrations
import uuid

ROLE_DATA = [
    {
        "id": uuid.UUID("81aecd02-0000-0000-0000-000000000000"),
        "name": "Superuser",
        "description": "Full system access",
        "level": 1,
    },
    {
        "id": uuid.UUID("6f747867-0000-0000-0000-000000000000"),
        "name": "Manager",
        "description": "Can manage staff and operations",
        "level": 2,
    },
    {
        "id": uuid.UUID("71214387-0000-0000-0000-000000000000"),
        "name": "Provider",
        "description": "Healthcare provider",
        "level": 3,
    },
    {
        "id": uuid.UUID("b9f44d10-0000-0000-0000-000000000000"),
        "name": "Staff",
        "description": "General staff",
        "level": 4,
    },
]

def seed_roles(apps, schema_editor):
    Role = apps.get_model("users", "Role")
    for role_data in ROLE_DATA:
        Role.objects.update_or_create(
            id=role_data["id"],
            defaults={
                "name": role_data["name"],
                "description": role_data["description"],
                "level": role_data["level"],
            },
        )

class Migration(migrations.Migration):
    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_roles, reverse_code=migrations.RunPython.noop),
    ]
