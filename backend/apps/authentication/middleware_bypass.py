"""
Development authentication bypass middleware.
When AUTH_BYPASS_MODE is enabled, provides a mock authenticated user for testing.
"""
import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from apps.users.models import UserProfile, Role

logger = logging.getLogger(__name__)
User = get_user_model()


class AuthBypassMiddleware:
    """
    Middleware that provides a mock authenticated user when AUTH_BYPASS_MODE is enabled.
    This is useful for development and testing scenarios where you want to bypass Azure AD authentication.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self._bypass_user = None
        
    def __call__(self, request):
        # Only apply bypass if AUTH_BYPASS_MODE is enabled
        if not getattr(settings, 'AUTH_BYPASS_MODE', False):
            return self.get_response(request)
            
        # Skip bypass for admin paths to allow normal Django admin login
        if request.path.startswith('/admin/'):
            return self.get_response(request)
            
        # Skip if user is already authenticated (e.g., via Django admin session)
        if hasattr(request, 'user') and request.user.is_authenticated:
            return self.get_response(request)
            
        # Provide mock authenticated user for API requests
        if self._should_apply_bypass(request):
            bypass_user = self._get_bypass_user()
            if bypass_user:
                request.user = bypass_user
                request.role = getattr(request.user, 'role', None)
                logger.debug(f"Auth bypass applied - user: {request.user.username}")
            else:
                logger.error("Failed to get bypass user - auth bypass may not work properly")
        
        return self.get_response(request)
    
    def _should_apply_bypass(self, request):
        """Determine if bypass should be applied to this request."""
        # Apply to API requests or any request that would normally need JWT auth
        return (
            request.path.startswith('/api/') or
            'HTTP_AUTHORIZATION' in request.META or
            request.path.startswith('/ninja/') or
            request.path.startswith('/docs/')
        )
    
    def _get_bypass_user(self):
        """Get or create a mock user for bypass mode."""
        if self._bypass_user:
            return self._bypass_user
            
        try:
            # Try to get existing test user
            self._bypass_user = User.objects.get(username='test.user@example.com')
            
            # Ensure existing user is a superuser
            if not self._bypass_user.is_superuser or not self._bypass_user.is_staff:
                self._bypass_user.is_superuser = True
                self._bypass_user.is_staff = True
                self._bypass_user.save()
                logger.info("Updated existing bypass user to superuser")
            else:
                logger.info("Using existing bypass superuser: test.user@example.com")
        except User.DoesNotExist:
            try:
                # Create mock superuser for testing
                self._bypass_user = User.objects.create_user(
                    username='test.user@example.com',
                    email='test.user@example.com',
                    first_name='Test',
                    last_name='User',
                    is_active=True,
                    is_staff=True,
                    is_superuser=True  # Make this user a superuser for role switching
                )
                logger.info("Created new bypass superuser: test.user@example.com")
            except Exception as e:
                # If user creation fails (e.g., race condition), try to get it again
                logger.warning(f"Failed to create bypass user: {e}. Attempting to retrieve existing user.")
                try:
                    self._bypass_user = User.objects.get(username='test.user@example.com')
                    logger.info("Retrieved existing bypass user after creation failure")
                except User.DoesNotExist:
                    logger.error("Cannot create or retrieve bypass user. Auth bypass mode may not work properly.")
                    # Return None or create a user with a different approach
                    return None
            
        # If we still don't have a user, return None
        if not self._bypass_user:
            return None
            
        # Ensure user profile exists
        try:
            profile, created = UserProfile.objects.get_or_create(
                user=self._bypass_user,
                defaults={
                    'azure_oid': 'bypass-test-oid-12345',
                    'azure_ad_groups': ['test-group-id']
                }
            )
        except Exception as e:
            logger.error(f"Failed to create/get UserProfile for bypass user: {e}")
            return self._bypass_user  # Return user even if profile creation fails
        
        if created:
            logger.info("Created UserProfile for bypass user")
            
        # Assign Superuser role for testing role-based features
        if not profile.role:
            try:
                # Also create other common roles for role switching testing first
                self._ensure_test_roles_exist()
                
                # Try to get or create Superuser role
                role, created = Role.objects.get_or_create(
                    name='Superuser',
                    defaults={
                        'description': 'System superuser for development and testing',
                        'level': 0  # Highest level role
                    }
                )
                if created:
                    logger.info("Created Superuser role for bypass user")
                
                profile.role = role
                profile.save()
                logger.info(f"Assigned '{role.name}' role to bypass user")
                
            except Exception as e:
                logger.warning(f"Could not assign role to bypass user: {e}")
        
        # Add role to user object for easy access
        self._bypass_user.role = profile.role
        
        return self._bypass_user
    
    def _ensure_test_roles_exist(self):
        """Create all standard roles for testing role switching functionality."""
        standard_roles = [
            ('Superuser', 'System superuser for development and testing', 0),
            ('Administrator', 'Full system administrator with all permissions', 1),
            ('Organisation Executive', 'Senior executive with organizational oversight', 2),
            ('Program Manager', 'Manages programs and services', 3),
            ('Supervisor', 'Supervises staff and monitors cases', 4),
            ('Practice Lead', 'Leads practice development and standards', 5),
            ('Caseworker', 'Direct service provider working with clients', 6),
        ]
        
        for role_name, description, level in standard_roles:
            try:
                role, created = Role.objects.get_or_create(
                    name=role_name,
                    defaults={
                        'description': description,
                        'level': level
                    }
                )
                if created:
                    logger.info(f"Created test role: {role_name}")
            except Exception as e:
                logger.warning(f"Could not create role {role_name}: {e}")