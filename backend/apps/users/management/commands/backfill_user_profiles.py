from django.core.management.base import BaseCommand
from django.conf import settings
from django.apps import apps
from apps.users.models import UserProfile

class Command(BaseCommand):
    help = 'Ensures all users have a UserProfile. Creates missing profiles.'

    def handle(self, *args, **options):
        User = apps.get_model(settings.AUTH_USER_MODEL)
        users_without_profiles = User.objects.filter(profile__isnull=True)
        
        count_created = 0
        if not users_without_profiles.exists():
            self.stdout.write(self.style.SUCCESS('All users already have a UserProfile.'))
            return

        self.stdout.write(f'Found {users_without_profiles.count()} user(s) missing a UserProfile. Creating profiles...')
        
        for user in users_without_profiles:
            try:
                UserProfile.objects.create(user=user)
                count_created += 1
                self.stdout.write(self.style.SUCCESS(f'Successfully created profile for user: {user.username} (ID: {user.id})'))
            except Exception as e:
                self.stderr.write(self.style.ERROR(f'Error creating profile for user {user.username} (ID: {user.id}): {e}'))
        
        if count_created > 0:
            self.stdout.write(self.style.SUCCESS(f'Successfully created {count_created} UserProfile(s).'))
        else:
            self.stdout.write(self.style.WARNING('No new profiles were created, though some users were identified as missing profiles. Check for errors above.'))
