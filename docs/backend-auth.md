# Backend Azure AD JWT Authentication Setup

This document outlines the configuration and implementation details for securing the Django backend APIs using JWTs (JSON Web Tokens) issued by Azure Active Directory (Azure AD). This setup allows the Next.js frontend to authenticate users via Azure AD and then use the obtained access tokens to make secure calls to the backend.

## 1. Core Dependencies

The following Python packages are required for JWT validation:

- **`PyJWT>=2.8.0`**: Used for decoding JWTs and verifying their signatures against public keys.
- **`requests>=2.31.0`**: Used to fetch Azure AD's OpenID Connect configuration and the JSON Web Key Set (JWKS).
- **`python-dotenv>=1.0.0`**: For loading environment variables.
- **`djangorestframework>=3.14`**: Used for API views and authentication.
- **`django-ninja>=1.0.0`**: The API framework used for building the backend.

## 2. Authentication Flow

1. Frontend authenticates user with Azure AD via NextAuth.js
2. Frontend includes the access token in the `Authorization: Bearer` header
3. Backend validates the JWT token using Azure AD's public keys
4. Custom middleware extracts user roles from the token
5. Role-based access control is enforced at the API level

## 3. Django Settings (`config/settings/base.py`)

Key authentication settings:

```python
# Authentication backends
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

# Custom user model
AUTH_USER_MODEL = 'users.User'

# JWT Authentication
JWT_AUTH = {
    'ALGORITHM': 'RS256',  # Azure AD uses RS256
    'AUDIENCE': f"api://{os.getenv('AZURE_AD_CLIENT_ID')}",
    'ISSUER': f"https://login.microsoftonline.com/{os.getenv('AZURE_AD_TENANT_ID')}/v2.0",
    'JWKS_URI': f"https://login.microsoftonline.com/{os.getenv('AZURE_AD_TENANT_ID')}/discovery/v2.0/keys",
}
```

## 4. JWT Validation Middleware

The custom JWT validation middleware handles token validation and user authentication:

```python
# middleware/jwt_auth.py
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from django.http import JsonResponse

class JWTAuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip middleware for public endpoints
        if self.is_public_endpoint(request.path):
            return self.get_response(request)
            
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return JsonResponse({'error': 'Missing or invalid Authorization header'}, status=401)
            
        token = auth_header.split(' ')[1]
        
        try:
            # Validate token and get user info
            payload = self.validate_token(token)
            user = self.get_or_create_user(payload)
            request.user = user
            
        except jwt.ExpiredSignatureError:
            return JsonResponse({'error': 'Token has expired'}, status=401)
        except jwt.InvalidTokenError as e:
            return JsonResponse({'error': f'Invalid token: {str(e)}'}, status=401)
        except Exception as e:
            return JsonResponse({'error': f'Authentication error: {str(e)}'}, status=500)
            
        return self.get_response(request)
        
    def validate_token(self, token):
        # Fetch public keys from Azure AD
        jwks_client = jwt.PyJWKClient(settings.JWT_AUTH['JWKS_URI'])
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Decode and validate token
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=[settings.JWT_AUTH['ALGORITHM']],
            audience=settings.JWT_AUTH['AUDIENCE'],
            issuer=settings.JWT_AUTH['ISSUER']
        )
        
    def get_or_create_user(self, token_payload):
        # Extract user info from token and get or create user
        user_model = get_user_model()
        user, created = user_model.objects.get_or_create(
            email=token_payload['preferred_username'],
            defaults={
                'first_name': token_payload.get('given_name', ''),
                'last_name': token_payload.get('family_name', ''),
                'is_active': True
            }
        )
        return user
        
    def is_public_endpoint(self, path):
        # Define public endpoints that don't require authentication
        public_paths = ['/api/health/', '/api/docs/']
        return any(path.startswith(p) for p in public_paths)
```

## 5. API Authentication

Django Ninja API endpoints are protected using the custom JWT middleware:

```python
# api/v1/router.py
from ninja import NinjaAPI
from ninja.security import HttpBearer

class AuthBearer(HttpBearer):
    def authenticate(self, request, token):
        # The middleware has already validated the token
        if request.user.is_authenticated:
            return request.user

# Initialize API with authentication
api = NinjaAPI(auth=AuthBearer())

# Protected endpoint example
@api.get("/secure-data")
def secure_data(request):
    return {"message": "This is protected data"}
```

## 6. Required Environment Variables

```env
# Azure AD Configuration
AZURE_AD_TENANT_ID=your-tenant-id
AZURE_AD_CLIENT_ID=your-client-id
AZURE_AD_CLIENT_SECRET=your-client-secret

# Application Settings
SECRET_KEY=your-django-secret-key
DEBUG=False
ALLOWED_HOSTS=.azurewebsites.net,localhost

# Database
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=your-db-host
DB_PORT=5432
```

## 7. Testing Authentication

To test the authentication flow:

1. Get an access token from Azure AD:
   ```bash
   curl -X POST \
     https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token \
     -H 'Content-Type: application/x-www-form-urlencoded' \
     -d 'client_id={client_id}&scope=api://{backend_client_id}/.default&client_secret={client_secret}&grant_type=client_credentials'
   ```

2. Use the token to access protected endpoints:
   ```bash
   curl -H "Authorization: Bearer {access_token}" https://your-api.azurewebsites.net/api/secure-data/
   ```

## 8. Troubleshooting

### Common Issues

1. **Invalid Token**
   - Verify the token is not expired
   - Check that the token's `aud` claim matches your API's application ID URI
   - Ensure the token was issued by the correct Azure AD tenant

2. **Missing Permissions**
   - Verify the token includes the required roles/scopes
   - Check that the backend API is properly configured in Azure AD

3. **Network Issues**
   - Ensure the backend can reach Azure AD endpoints
   - Check firewall rules if running in a restricted environment

For additional help, check the Azure AD logs and application logs for detailed error messages.
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
