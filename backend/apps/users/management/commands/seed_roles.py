import uuid
from django.core.management.base import BaseCommand
from apps.users.models import Role, GroupRoleMapping

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

# GROUP_ROLE_MAPPINGS = [
#     {
#         "azure_ad_group_id": "4e74cb4d-8664-4303-91d8-cf189f1537cd",
#         "azure_ad_group_name": "MC_Admin",
#         "role_id": uuid.UUID("81aecd02-0000-0000-0000-000000000000"),
#     },
#     {
#         "azure_ad_group_id": "6a6cf256-ef54-4063-a06e-fcb8f0bcb082",
#         "azure_ad_group_name": "MC_Managers",
#         "role_id": uuid.UUID("6f747867-0000-0000-0000-000000000000"),
#     },
#     {
#         "azure_ad_group_id": "edbe21c1-bf1b-4ade-85db-02367f5ac9af",
#         "azure_ad_group_name": "MC_Providers",
#         "role_id": uuid.UUID("71214387-0000-0000-0000-000000000000"),
#     },
#     {
#         "azure_ad_group_id": "23c2e67-ae64-41e6-902a-4533534a437b",
#         "azure_ad_group_name": "MC_Staff",
#         "role_id": uuid.UUID("b9f44d10-0000-0000-0000-000000000000"),
#     },
# ]

class Command(BaseCommand):
    help = "Seeds the database with standard roles and Azure group mappings."

    def handle(self, *args, **options):
        # Seed roles
        for role_data in ROLE_DATA:
            obj, created = Role.objects.update_or_create(
                id=role_data["id"],
                defaults={
                    "name": role_data["name"],
                    "description": role_data["description"],
                    "level": role_data["level"],
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created role: {obj.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Updated role: {obj.name}"))
        self.stdout.write(self.style.SUCCESS("Role seeding complete."))

        # Seed group-role mappings
        # for mapping in GROUP_ROLE_MAPPINGS:
        #     role = Role.objects.get(id=mapping["role_id"])
        #     obj, created = GroupRoleMapping.objects.update_or_create(
        #         azure_ad_group_id=mapping["azure_ad_group_id"],
        #         role=role,
        #         defaults={
        #             "azure_ad_group_name": mapping["azure_ad_group_name"],
        #         },
        #     )
        #     if created:
        #         self.stdout.write(self.style.SUCCESS(f"Created mapping: {mapping['azure_ad_group_name']} -> {role.name}"))
        #     else:
        #         self.stdout.write(self.style.WARNING(f"Updated mapping: {mapping['azure_ad_group_name']} -> {role.name}"))
        # self.stdout.write(self.style.SUCCESS("Group-role mapping seeding complete."))
