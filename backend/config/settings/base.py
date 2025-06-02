import os
from pathlib import Path
import environ

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Environment variables
env = environ.Env(DEBUG=(bool, False))

# Read .env file
env_file = BASE_DIR / '.env'
if env_file.exists():
    environ.Env.read_env(env_file)

# Security
SECRET_KEY = env('SECRET_KEY', default='django-insecure-change-me-in-production-very-long-key')
DEBUG = env('DEBUG', default=True)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[
    'localhost', 
    '127.0.0.1', 
    '*.gitpod.io', 
    '*.github.dev',
    '*.codespaces.github.dev'
])

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'corsheaders',
    'ninja',
    'rest_framework',  # For some utilities
]

LOCAL_APPS = [
    'apps.common',
    'apps.authentication', 
    'apps.users',
    'apps.tasks',
    'apps.departments',
    'apps.notifications',
    'apps.audit',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'apps.audit.middleware.AuditTrailMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database - SQLite for development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS Settings
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
    'http://localhost:3000',
    'http://127.0.0.1:3000',
])
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = DEBUG  # Only in development

# Authentication backends
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

# Azure AD Configuration
# AUTH_ADFS = {
#     'AUDIENCE': env('AZURE_CLIENT_ID', default=''),
#     'CLIENT_ID': env('AZURE_CLIENT_ID', default=''),
#     'CLIENT_SECRET': env('AZURE_CLIENT_SECRET', default=''),
#     'TENANT_ID': env('AZURE_TENANT_ID', default=''),
#     'RELYING_PARTY_ID': env('AZURE_CLIENT_ID', default=''),
#     'CLAIM_MAPPING': {
#         'first_name': 'given_name',
#         'last_name': 'family_name',
#         'email': 'upn',
#     },
#     'GROUPS_CLAIM': 'roles',  # or 'groups' depending on Azure AD setup
#     'MIRROR_GROUPS': True,
#     'USERNAME_CLAIM': 'upn',
#     'CREATE_NEW_USERS': True,
#     'BOOLEAN_CLAIM_MAPPING': {
#         'is_staff': 'is_admin',
#         'is_superuser': 'is_superuser',
#     },
# }

# Azure AD Configuration for JWT validation
AZURE_AD = {
     'TENANT_ID': env('AZURE_TENANT_ID', default=''),
     'CLIENT_ID': env('AZURE_CLIENT_ID', default=''),
     'CLIENT_SECRET': env('AZURE_CLIENT_SECRET', default=''),
}
# JWT Configuration  
JWT_AUTH = {
     'ALGORITHM': 'RS256',
     'AUDIENCE': f"api://{AZURE_AD['CLIENT_ID']}", # Match Application ID URI format
     'ISSUER': f"https://sts.windows.net/{AZURE_AD['TENANT_ID']}/", # Changed to v1.0 issuer
     'JWKS_URI': f"https://login.microsoftonline.com/{AZURE_AD['TENANT_ID']}/discovery/keys", # Common v1.0/v2.0 JWKS URI
}

# Session configuration
SESSION_COOKIE_AGE = 14400  # 4 hours
SESSION_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_SAVE_EVERY_REQUEST = True

# Login/Logout URLs
# LOGIN_URL = 'django_auth_adfs:login' # Commented out as django-auth-adfs is removed
LOGIN_REDIRECT_URL = '/'
LOGOUT_REDIRECT_URL = '/'

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'mtk-care.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'django_auth_adfs': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}