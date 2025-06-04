from django.core.management.base import BaseCommand
from apps.users.models import GroupRoleMapping

# python manage.py list_role_mappings
class Command(BaseCommand):
    help = 'List all Azure AD group to role mappings'

    def handle(self, *args, **options):
        mappings = GroupRoleMapping.objects.select_related('role').all()
        
        if not mappings.exists():
            self.stdout.write(self.style.WARNING('No role mappings found!'))
            return
            
        self.stdout.write('\nAzure AD Group to Role Mappings:')
        self.stdout.write('-' * 80)
        self.stdout.write(f"{'Azure AD Group ID':<40} | {'Role':<20} | Level")
        self.stdout.write('-' * 80)
        
        for mapping in mappings:
            self.stdout.write(
                f"{mapping.azure_ad_group_id:<40} | "
                f"{mapping.role.name:<20} | {mapping.role.level}"
            )
        
        self.stdout.write('\nTo add a new mapping, use the admin interface or create a migration.')
