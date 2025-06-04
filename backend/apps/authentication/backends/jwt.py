"""
Custom authentication backends for JWT authentication.
"""
import logging
from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.conf import settings

logger = logging.getLogger(__name__)
User = get_user_model()

class JWTAuthenticationBackend(ModelBackend):
    """
    Authenticate against JWT tokens for Django's authentication system.
    This is used for Django admin and other Django-specific authentication.
    """
    def authenticate(self, request, **kwargs):
        # Skip if no token is provided
        if 'token' not in kwargs:
            return None
            
        token = kwargs['token']
        
        try:
            # Import here to avoid circular imports
            from .jwt_auth import JWTAuth
            
            # Validate the token
            jwt_auth = JWTAuth()
            payload = jwt_auth.authenticate(request, token)
            
            if not payload:
                return None
                
            # Get or create the user
            user, _ = User.objects.get_or_create(
                username=payload.get('preferred_username'),
                defaults={
                    'email': payload.get('email', ''),
                    'first_name': payload.get('given_name', ''),
                    'last_name': payload.get('family_name', ''),
                    'is_staff': False,  # Default to non-staff
                    'is_superuser': False,  # Default to non-superuser
                }
            )
            
            return user
            
        except Exception as e:
            logger.error(f"Error in JWT authentication backend: {e}")
            return None
    
    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
