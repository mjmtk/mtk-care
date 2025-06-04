from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model

class UserProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='azure_profile', 
        help_text="The Django User instance."
    )
    azure_oid = models.CharField(
        max_length=36,
        unique=True,
        db_index=True,
        help_text="Azure AD Object ID for the user. This is the primary immutable identifier."
    )
    # You could add other Azure-specific fields here if needed, for example:
    # azure_upn = models.CharField(max_length=255, blank=True, null=True, help_text="User Principal Name from Azure AD.")
    # last_successful_login_via_azure = models.DateTimeField(null=True, blank=True)
    # last_group_sync_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "User Azure AD Profile" # Updated verbose_name for clarity
        verbose_name_plural = "User Azure AD Profiles" # Updated verbose_name_plural

    def __str__(self):
        return f"{self.user.username}'s Azure AD Profile"

