# /home/amj/dev/mtk-care/backend/apps/authentication/jwt_auth.py
import jwt
# import requests # Not directly used here if PyJWKClient handles HTTP
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from ninja.security import HttpBearer
from ninja.errors import AuthenticationError # Import for proper error handling
import logging
from datetime import timedelta # Import for leeway

# Assuming UserProfile is in the same app's models.py
from .models import UserProfile 

logger = logging.getLogger(__name__)
User = get_user_model()

class JWTAuth(HttpBearer):
    _jwks_client_instance = None # Class attribute to hold the singleton client

    def __init__(self):
        if not hasattr(JWTAuth, '_jwks_client_instance') or JWTAuth._jwks_client_instance is None:
            logger.info(f"Initializing PyJWKClient with URI: {settings.JWT_AUTH['JWKS_URI']}")
            JWTAuth._jwks_client_instance = jwt.PyJWKClient(
                settings.JWT_AUTH['JWKS_URI'],
                cache_keys=True, 
                lifespan=3600 # Cache keys for 1 hour
            )
            try:
                # Eagerly fetch keys to validate configuration and prime cache
                JWTAuth._jwks_client_instance.get_jwk_set(refresh=True)
                logger.info("Successfully fetched initial JWKS.")
            except Exception as e:
                logger.error(f"Failed to fetch initial JWKS during __init__: {e}. "
                             f"Check JWKS_URI, network connectivity, and Azure AD config.")
                # Depending on policy, you might want to raise an error here to prevent startup
                # For now, it will log and potentially fail on first auth attempt.
        
        # Assign the class instance to the instance variable
        self._jwks_client = JWTAuth._jwks_client_instance

    def authenticate(self, request, token):
        if not token:
            # No token provided, Ninja handles this by default if auth is required.
            # Raising here can be explicit if needed for some flows.
            # logger.debug("No token provided for authentication.")
            # raise AuthenticationError("Authorization credentials were not provided.")
            return None # Or let Ninja handle it based on endpoint config

        logger.debug(f"Attempting to authenticate with token: {token[:30]}...")
        try:
            signing_key = self._jwks_client.get_signing_key_from_jwt(token).key
        except jwt.exceptions.PyJWKClientError as e:
            logger.error(f"Failed to get signing key from JWKS: {e}")
            raise AuthenticationError(f"Invalid token: JWKS key error. {e}")
        except Exception as e:
            logger.error(f"An unexpected error occurred while fetching signing key: {e}")
            raise AuthenticationError(f"Invalid token: Key retrieval error. {e}")

        if not signing_key: # Should be caught by PyJWKClientError, but as a safeguard
            logger.error("No signing key could be retrieved for the token.")
            raise AuthenticationError("Invalid token: No signing key found.")

        logger.debug(f"Using signing key for token.") # KID logging can be verbose

        try:
            payload = jwt.decode(
                token,
                signing_key,
                algorithms=[settings.JWT_AUTH['ALGORITHM']],
                audience=settings.JWT_AUTH['AUDIENCE'],
                issuer=settings.JWT_AUTH['ISSUER'],
                leeway=timedelta(seconds=300) # Increased leeway to 5 minutes for clock skew
            )
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired.")
            raise AuthenticationError("Invalid token: Expired.") 
        except jwt.InvalidAudienceError as e: # Catch specifically
            # Log the expected and actual audience for easier debugging
            actual_audience = getattr(e, 'actual_audience', 'N/A') # PyJWT might add this attribute
            if not actual_audience and e.args: # Fallback to e.args if actual_audience not present
                actual_audience = e.args[0]

            logger.warning(f"Token has invalid audience. Expected: {settings.JWT_AUTH['AUDIENCE']}, Got: {actual_audience}")
            raise AuthenticationError(f"Invalid token: Invalid audience.")
        except jwt.InvalidIssuerError as e: # Catch specifically
            actual_issuer = getattr(e, 'actual_issuer', 'N/A')
            if not actual_issuer and e.args:
                actual_issuer = e.args[0]
            logger.warning(f"Token has invalid issuer. Expected: {settings.JWT_AUTH['ISSUER']}, Got: {actual_issuer}")
            raise AuthenticationError(f"Invalid token: Invalid issuer.")
        except jwt.InvalidSignatureError: 
            logger.error("Token signature verification failed. This could be due to wrong JWKS URI, incorrect 'kid', an actual tampered token, or clock skew if leeway is insufficient.")
            raise AuthenticationError("Invalid token: Signature verification failed.")
        except jwt.DecodeError as e: # Generic decode error
            logger.warning(f"Invalid token: Decode error. {e}")
            raise AuthenticationError(f"Invalid token: Decode error. {e}")
        except Exception as e: # Catch other unexpected JWT errors
            logger.error(f"An unexpected error occurred during token decoding: {e}")
            raise AuthenticationError(f"Invalid token: Unexpected decoding error. {e}")

        azure_oid = payload.get('oid')
        if not azure_oid:
            logger.error("Token does not contain 'oid' claim.")
            raise AuthenticationError("Invalid token: Missing 'oid' claim.")

        username_claim = payload.get('upn') or payload.get('preferred_username') or payload.get('email')
        if not username_claim:
            logger.error("Token missing UPN, preferred_username, or email claim for username.")
            raise AuthenticationError("Invalid token: Missing username identifier.")

        try:
            # Try to find user by Azure OID first
            user_profile = UserProfile.objects.select_related('user').get(azure_oid=azure_oid)
            user = user_profile.user
            logger.info(f"Authenticated existing user {user.username} via JWT (Azure OID: {azure_oid}).")
            
            # Update user attributes from token
            updated_fields = False
            new_email = payload.get('email') or payload.get('upn') or payload.get('preferred_username') or user.email
            if user.email != new_email:
                user.email = new_email
                updated_fields = True
            if user.first_name != payload.get('given_name', user.first_name):
                user.first_name = payload.get('given_name', user.first_name)
                updated_fields = True
            if user.last_name != payload.get('family_name', user.last_name):
                user.last_name = payload.get('family_name', user.last_name)
                updated_fields = True
            
            if updated_fields:
                user.save()
                logger.info(f"Updated user attributes for: {user.username}")

        except UserProfile.DoesNotExist:
            logger.info(f"Azure OID {azure_oid} not found. Provisioning new user for UPN/email: {username_claim}.")
            
            # Check if a user with the same username_claim (potentially email) already exists.
            # This handles cases where a Django user might exist but isn't linked to Azure AD yet,
            # or if UPNs are not globally unique across different identity systems.
            try:
                user = User.objects.get(username=username_claim)
                logger.warning(f"User with username '{username_claim}' already exists but no UserProfile with OID {azure_oid}. Linking account.")
                # Link existing Django user to this Azure OID
                UserProfile.objects.create(user=user, azure_oid=azure_oid)
            except User.DoesNotExist:
                # Create new Django User
                # A more robust username generation strategy might be needed if username_claim is not unique
                # or not suitable (e.g., very long, special characters not allowed by User model).
                # For now, directly use username_claim.
                user = User.objects.create_user(
                    username=username_claim,
                    email=payload.get('email', ''),
                    first_name=payload.get('given_name', ''),
                    last_name=payload.get('family_name', '')
                )
                UserProfile.objects.create(user=user, azure_oid=azure_oid)
                logger.info(f"Created new Django User '{user.username}' and linked UserProfile with Azure OID {azure_oid}.")
        
        # Group/Role Synchronization
        # Check 'roles' first, then 'groups' as common claim names
        token_groups_claim = payload.get('roles', payload.get('groups')) 
        if token_groups_claim and isinstance(token_groups_claim, list):
            current_user_group_names = set(user.groups.values_list('name', flat=True))
            desired_group_names = set(str(g) for g in token_groups_claim) # Ensure all are strings

            # Add groups user should be in but isn't
            for group_name in desired_group_names - current_user_group_names:
                group, created = Group.objects.get_or_create(name=group_name)
                user.groups.add(group)
                logger.info(f"User '{user.username}' added to group '{group_name}' (created: {created}).")

            # Remove groups user is in but shouldn't be (optional, based on policy)
            # If you want Azure AD to be the sole source of truth for these roles:
            for group_name in current_user_group_names - desired_group_names:
                try:
                    group_to_remove = Group.objects.get(name=group_name)
                    user.groups.remove(group_to_remove)
                    logger.info(f"User '{user.username}' removed from group '{group_name}'.")
                except Group.DoesNotExist:
                    logger.warning(f"Tried to remove user from group '{group_name}' which does not exist in DB.")
        elif token_groups_claim: # Claim exists but is not a list
             logger.warning(f"Token 'roles'/'groups' claim is not a list: {token_groups_claim}. Skipping group sync.")

        return user

        # The broad except Exception at the end of user's original provisioning logic is removed.
        # Specific exceptions should be caught, or AuthenticationError should be raised if it's an auth issue.
        # If a non-auth system error occurs here, it should probably propagate as a 500.
