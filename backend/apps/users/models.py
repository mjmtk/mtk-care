from django.db import models
from django.contrib.auth.models import User
from apps.common.models import TimeStampedModel
from apps.departments.models import Department

class UserProfile(TimeStampedModel):
    """Extended user profile for additional information."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    departments = models.ManyToManyField(Department, blank=True, related_name='members')
    phone_number = models.CharField(max_length=20, blank=True)
    employee_id = models.CharField(max_length=50, blank=True)
    title = models.CharField(max_length=100, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True)
    
    # Preferences
    email_notifications = models.BooleanField(default=True)
    desktop_notifications = models.BooleanField(default=True)
    theme_preference = models.CharField(
        max_length=10,
        choices=[('light', 'Light'), ('dark', 'Dark'), ('auto', 'Auto')],
        default='auto'
    )
    
    def __str__(self):
        return f"{self.user.get_full_name()} Profile"
    
    @property
    def display_name(self):
        return self.user.get_full_name() or self.user.username
