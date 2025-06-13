from django.core.management.base import BaseCommand
from django.conf import settings
from apps.users.models import Role, GroupRoleMapping, User
import requests
import json


class Command(BaseCommand):
    help = 'Setup Azure AD group to role mappings for production deployment'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without making changes',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force overwrite existing mappings',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        force = options['force']

        self.stdout.write(self.style.SUCCESS('Setting up Azure AD group role mappings...'))

        # Default role mappings (customize these for your organization)
        default_mappings = [
            {
                'group_id': '99e3e88f-8d13-4b47-b0ff-bd80f40c545f',
                'group_name': 'MTK Care Administrators',
                'role_name': 'Administrator'
            },
            {
                'group_id': '4e74cb4d-8664-4303-91d8-cf189f1537cd',
                'group_name': 'MTK Care Managers',
                'role_name': 'Manager'
            },
            # Add more mappings as needed
        ]

        # Ensure we have a system user for created_by
        system_user, created = User.objects.get_or_create(
            email='system@mtkcare.com',
            defaults={
                'first_name': 'System',
                'last_name': 'Administrator',
                'is_staff': True,
                'is_superuser': True
            }
        )

        for mapping in default_mappings:
            try:
                role = Role.objects.get(name=mapping['role_name'])
                
                existing = GroupRoleMapping.objects.filter(
                    azure_ad_group_id=mapping['group_id']
                ).first()

                if existing and not force:
                    self.stdout.write(
                        self.style.WARNING(
                            f"Mapping for group {mapping['group_name']} already exists (use --force to overwrite)"
                        )
                    )
                    continue

                if dry_run:
                    self.stdout.write(
                        f"Would create mapping: {mapping['group_name']} -> {role.name}"
                    )
                    continue

                if existing:
                    existing.delete()

                GroupRoleMapping.objects.create(
                    azure_ad_group_id=mapping['group_id'],
                    azure_ad_group_name=mapping['group_name'],
                    role=role,
                    created_by=system_user
                )

                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created mapping: {mapping['group_name']} -> {role.name}"
                    )
                )

            except Role.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(
                        f"Role '{mapping['role_name']}' not found. Run seed_roles first."
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"Error creating mapping for {mapping['group_name']}: {str(e)}"
                    )
                )

        if not dry_run:
            self.stdout.write(
                self.style.SUCCESS('Role mappings setup complete!')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS('Dry run complete. Use without --dry-run to create mappings.')
            )

    def fetch_azure_groups(self):
        """Optional: Fetch groups from Azure AD via Graph API"""
        # This would use the Graph API client from your reference project
        # Implementation depends on your Azure AD setup and permissions
        pass