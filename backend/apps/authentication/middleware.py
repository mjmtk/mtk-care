"""
Django middleware for JWT authentication and role-based access control.
"""
import logging
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.utils.functional import SimpleLazyObject
from .jwt_auth import JWTAuth
from apps.users.models import UserProfile, GroupRoleMapping

logger = logging.getLogger(__name__)
User = get_user_model()


def get_user_from_token(request):
    """
    Extract and validate JWT token, then return the associated user with roles.
    """
    # Get the authorization header
    auth_header = request.META.get('HTTP_AUTHORIZATION', '').split()
    
    if not auth_header or len(auth_header) != 2 or auth_header[0].lower() != 'bearer':
        logger.debug("No valid bearer token found in authorization header")
        return AnonymousUser()
    
    token = auth_header[1]
    jwt_auth = JWTAuth()
    
    try:
        # Validate token and get user
        user = jwt_auth.authenticate(request, token)
        if not user or not user.is_authenticated:
            logger.warning("JWT authentication failed or user not authenticated")
            return AnonymousUser()
            
        # Get or create user profile
        profile, created = UserProfile.objects.get_or_create(user=user)
        if created:
            logger.info(f"Created new user profile for {user.username}")
        
        # TODO: Recommendation: For initial deployment, simplify by disabling group-based role mapping if it's not immediately essential.
        # Get Azure AD groups from the user object (set by JWT auth)
        # azure_groups = getattr(user, 'azure_ad_groups', []) or []
        # logger.info(f"User {user.email} has Azure AD groups: {azure_groups}")
        azure_groups = []
        logger.info(f"User {user.email} has Azure AD groups: {azure_groups}")
        

        # Find the highest role from the user's Azure AD groups
        highest_role = None
        matched_groups = []
        
        if azure_groups:
            # Get all group mappings in one query for better performance
            group_mappings = GroupRoleMapping.objects.filter(
                azure_ad_group_id__in=azure_groups
            ).select_related('role').order_by('role__level')
            
            for mapping in group_mappings:
                try:
                    logger.info(f"Processing role mapping - Group ID: {mapping.azure_ad_group_id} -> "
                                f"Role: {mapping.role.name} (Level: {mapping.role.level})")
                    
                    matched_groups.append(mapping.azure_ad_group_id)
                    
                    if highest_role is None or mapping.role.level < highest_role.level:
                        highest_role = mapping.role
                        logger.info(f"New highest role: {highest_role.name} (Level: {highest_role.level})")
                        
                except Exception as e:
                    logger.error(f"Error processing role mapping for group {mapping.azure_ad_group_id}: {e}")
                    continue
            
            # Log any groups that didn't have role mappings
            unmatched_groups = set(azure_groups) - set(matched_groups)
            if unmatched_groups:
                logger.debug(f"No role mappings found for Azure AD groups: {', '.join(unmatched_groups)}")
        else:
            logger.warning(f"No Azure AD groups found for user {user.email}")
        
        # Set the user's role if a mapping was found
        if highest_role:
            if not hasattr(profile, 'role') or profile.role_id != highest_role.id:
                profile.role = highest_role
                profile.save()
                logger.info(f"Updated user {user.username} role to {highest_role.name}")
            else:
                logger.debug(f"User {user.username} already has role {highest_role.name}")
        else:
            logger.warning(f"No role mapping found for user {user.email}'s Azure AD groups")
            
        # Add the role to the user object for easy access in views
        user.role = highest_role
        
        return user
        
    except Exception as e:
        logger.error(f"Error authenticating user: {e}", exc_info=True)
        return AnonymousUser()


class JWTAuthenticationMiddleware:
    """
    Middleware that authenticates users via JWT token and sets their role.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip JWT authentication for admin paths or if user is already authenticated via session
        if (request.path.startswith('/admin/') or 
            (hasattr(request, 'user') and request.user.is_authenticated)):
            return self.get_response(request)
            
        # Get user from token for API requests
        if 'HTTP_AUTHORIZATION' in request.META:
            user = get_user_from_token(request)
            if user and user.is_authenticated:
                request.user = user
                request.role = getattr(user, 'role', None) if hasattr(user, 'role') else None
        
        return self.get_response(request)
