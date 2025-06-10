import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser, Permission
from django.conf import settings


# Default preferences structure
def get_default_preferences():
    return {
        "email_notifications": True,
        "desktop_notifications": True,
        "theme": "auto"
    }

class User(AbstractUser):
    """
    Custom user model using UUID as primary key.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Add any additional fields here as needed

# Base model for timestamped models within the users app
class UserAppBaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# New Role model
class Role(UserAppBaseModel):
    """Application roles for users."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, null=True)
    level = models.PositiveSmallIntegerField(unique=True, help_text="Numeric level for hierarchy (e.g., 1 for Admin, 2 for Manager)")
    
    # Enhanced fields for better role management
    is_system_role = models.BooleanField(
        default=False, 
        help_text="System roles cannot be deleted or have their core properties modified"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Inactive roles cannot be assigned to users"
    )
    custom_permissions = models.JSONField(
        default=dict,
        blank=True,
        help_text="Custom permissions and settings specific to this role"
    )
    
    # Keep Django permissions for standard auth
    permissions = models.ManyToManyField(
        Permission,
        blank=True,
        help_text="Django permissions associated with this role"
    )

    class Meta:
        ordering = ['level']

    def __str__(self):
        return self.name
    
    def get_all_permissions(self):
        """Get all permissions including custom ones."""
        django_perms = list(self.permissions.values_list('codename', flat=True))
        custom_perms = list(self.custom_permissions.keys()) if self.custom_permissions else []
        return django_perms + custom_perms

class UserProfile(UserAppBaseModel):
    """Extended user profile for additional information."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    employee_id = models.CharField(max_length=50, blank=True, null=True)
    title = models.CharField(max_length=100, blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    # Consolidated preferences
    preferences = models.JSONField(default=get_default_preferences, blank=True)
    
    # Azure AD group OIDs or names
    azure_ad_groups = models.JSONField(default=list, blank=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True, related_name='user_profiles')
    
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} Profile"
    
    @property
    def display_name(self):
        return self.user.get_full_name() or self.user.username

# Model to map Azure AD group IDs/names to Django Role
class GroupRoleMapping(UserAppBaseModel):
    """Maps an Azure AD group (by ID or name) to a Django Role."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    azure_ad_group_id = models.CharField(max_length=128, help_text="Azure AD group object ID")
    azure_ad_group_name = models.CharField(max_length=255, blank=True, null=True, help_text="Azure AD group display name (optional, for admin reference)")
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='azure_group_mappings', to_field='id')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='group_role_mappings')

    class Meta:
        unique_together = ('azure_ad_group_id', 'role')
        verbose_name = "Azure AD Group to Role Mapping"
        verbose_name_plural = "Azure AD Group to Role Mappings"

    def __str__(self):
        return f"{self.azure_ad_group_name or self.azure_ad_group_id} → {self.role.name}"

# TODO: Expose GroupRoleMapping via Django Ninja API for admin management
# TODO: Use OpenAPI/TypeScript generator to sync schemas with frontend
