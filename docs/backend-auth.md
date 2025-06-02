# Backend Azure AD JWT Authentication Setup

This document outlines the configuration and implementation details for securing the Django backend APIs using JWTs (JSON Web Tokens) issued by Azure Active Directory (Azure AD). This setup allows the Next.js frontend to authenticate users via Azure AD and then use the obtained access tokens to make secure calls to the backend.

## 1. Core Dependencies

The following Python packages were added to `requirements/base.txt` to support JWT validation:

-   **`PyJWT>=2.8.0`**: Used for decoding JWTs and verifying their signatures against public keys.
-   **`requests>=2.31.0`**: Utilized to fetch Azure AD's OpenID Connect configuration and the JSON Web Key Set (JWKS) which contains the public signing keys.
-   **`cryptography>=41.0`**: A dependency of `PyJWT` for cryptographic operations. (Already present)
-   **`djangorestframework>=3.14`**: While not directly used for token validation in this custom setup, it's part of the project and provides the framework for APIs. (Already present)

## 2. Django Settings (`config/settings/base.py`)

Key changes were made to the Django settings:

-   **Removed `django-auth-adfs`**:
    -   `django_auth_adfs` was removed from `THIRD_PARTY_APPS`.
    -   `django_auth_adfs.backend.AdfsAuthCodeBackend` and `django_auth_adfs.backend.AdfsAccessTokenBackend` were removed from `AUTHENTICATION_BACKENDS`.
    -   The `AUTH_ADFS` settings dictionary was commented out.
    -   `LOGIN_URL = 'django_auth_adfs:login'` was commented out.
-   **Added Azure AD Configuration**:
    ```python
    # Azure AD Configuration for JWT validation
    AZURE_AD = {
        'TENANT_ID': env('AZURE_TENANT_ID', default=''),
        'CLIENT_ID': env('AZURE_CLIENT_ID', default=''), # This is the backend's App ID URI or Client ID
        # 'CLIENT_SECRET': env('AZURE_CLIENT_SECRET', default=''), # Not strictly needed for token validation if public keys are used
    }

    # JWT Configuration
    JWT_AUTH = {
        'ALGORITHM': 'RS256', # Azure AD typically uses RS256
        'AUDIENCE': AZURE_AD['CLIENT_ID'], # The 'aud' claim in the token should match this
        'ISSUER': f"https://login.microsoftonline.com/{AZURE_AD['TENANT_ID']}/v2.0", # The 'iss' claim
        'JWKS_URI': f"https://login.microsoftonline.com/{AZURE_AD['TENANT_ID']}/discovery/v2.0/keys", # Endpoint to fetch public keys
    }
    ```
    These settings provide the necessary parameters for validating tokens against your Azure AD tenant and application registration.

## 3. Custom Authentication Class (`apps/authentication/jwt_auth.py`)

A custom authentication class, `JWTAuth(HttpBearer)`, was implemented for Django Ninja:

-   **Initialization**: Fetches and caches Azure AD's public signing keys (JWKS) using `jwt.PyJWKClient`.
-   **Token Extraction**: Retrieves the Bearer token from the `Authorization` header.
-   **Token Validation**:
    -   Decodes the JWT using the fetched public key.
    -   Verifies the token's signature, algorithm (`RS256`), audience (against `settings.JWT_AUTH['AUDIENCE']`), and issuer (against `settings.JWT_AUTH['ISSUER']`).
    -   Checks for token expiration.
-   **User Provisioning & Synchronization**:
    -   Extracts the `oid` (Object ID) claim from the token as the primary immutable identifier for the Azure AD user.
    -   Uses `upn`, `preferred_username`, or `email` claims as the Django `username`.
    -   Retrieves or creates a Django `User` instance.
    -   Links the Django `User` to an `apps.authentication.models.UserProfile` instance, storing the `azure_oid`.
    -   Updates user attributes (email, first name, last name) from token claims.
    -   Includes basic logic to synchronize user groups based on `roles` or `groups` claims in the token, creating Django `Group` instances as needed.

## 4. User Profile Model (`apps/authentication/models.py`)

A new model, `UserProfile`, was created within the `authentication` app:

```python
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='azure_profile')
    azure_oid = models.CharField(max_length=36, unique=True, db_index=True)
    # ...
```

-   This model establishes a one-to-one relationship with the standard Django `User` model.
-   The `azure_oid` field stores the unique Object ID from Azure AD, ensuring a stable link between the Django user and the Azure AD user.
-   The `related_name` was set to `azure_profile` to avoid conflicts with other `UserProfile` models (e.g., in the `users` app).
-   Database migrations were created and applied for this model.

## 5. URL Configuration (`config/urls.py`)

The main Django Ninja API instance was configured to use the custom `JWTAuth` class as the default authentication mechanism:

```python
from apps.authentication.jwt_auth import JWTAuth

api = NinjaAPI(
    title="MTK Care API",
    version="1.0.0",
    description="API for MTK Care platform",
    auth=JWTAuth() # Default authentication for all endpoints under this API instance
)
```
This ensures that API endpoints defined under this `api` instance are protected and require a valid Azure AD JWT by default. The `django_auth_adfs` specific URLs were removed.

## Summary

This setup provides a robust mechanism for authenticating API requests using Azure AD issued JWTs. The Django backend can now validate these tokens, identify users, and manage basic user attributes and group memberships based on the token's claims. This approach decouples frontend authentication (handled by NextAuth.js and Azure AD) from backend API security.
