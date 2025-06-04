from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings # Using settings.AUTH_USER_MODEL is more robust
from .models import UserProfile, User # Or directly from .models import User if preferred and settings.AUTH_USER_MODEL points to it

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    """Create UserProfile when User is created."""
    if created:
        UserProfile.objects.create(user=instance)

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_profile(sender, instance, **kwargs):
    """Save UserProfile when User is saved."""
    if hasattr(instance, 'profile'):
        instance.profile.save()
