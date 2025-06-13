from django.core.management.base import BaseCommand
from django.conf import settings
from apps.users.models import Role, GroupRoleMapping, User
import os
import json


class Command(BaseCommand):
    help = 'Sync role mappings from environment variables'

    def handle(self, *args, **options):
        """
        Reads role mappings from environment variable:
        AZURE_AD_ROLE_MAPPINGS='[
            {"group_id": "xxx", "group_name": "Admins", "role_name": "Administrator"},
            {"group_id": "yyy", "group_name": "Managers", "role_name": "Manager"}
        ]'
        """
        
        mappings_json = os.getenv('AZURE_AD_ROLE_MAPPINGS')
        if not mappings_json:
            self.stdout.write(
                self.style.WARNING('No AZURE_AD_ROLE_MAPPINGS environment variable found')
            )
            return

        try:
            mappings = json.loads(mappings_json)
        except json.JSONDecodeError as e:
            self.stdout.write(
                self.style.ERROR(f'Invalid JSON in AZURE_AD_ROLE_MAPPINGS: {e}')
            )
            return

        # Get or create system user
        system_user, _ = User.objects.get_or_create(
            email='system@mtkcare.com',
            defaults={
                'first_name': 'System',
                'last_name': 'Administrator',
                'is_staff': True,
                'is_superuser': True
            }
        )

        for mapping in mappings:
            try:
                role = Role.objects.get(name=mapping['role_name'])
                
                obj, created = GroupRoleMapping.objects.update_or_create(
                    azure_ad_group_id=mapping['group_id'],
                    defaults={
                        'azure_ad_group_name': mapping['group_name'],
                        'role': role,
                        'created_by': system_user
                    }
                )

                action = 'Created' if created else 'Updated'
                self.stdout.write(
                    self.style.SUCCESS(
                        f"{action} mapping: {mapping['group_name']} -> {role.name}"
                    )
                )

            except Role.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(
                        f"Role '{mapping['role_name']}' not found"
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"Error processing {mapping['group_name']}: {str(e)}"
                    )
                )

        self.stdout.write(self.style.SUCCESS('Environment role mappings sync complete!'))