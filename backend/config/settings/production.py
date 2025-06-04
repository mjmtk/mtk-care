from .base import *
import dj_database_url
import os

# Debug settings
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

# Remove debug_toolbar from INSTALLED_APPS in production
if 'debug_toolbar' in INSTALLED_APPS:
    INSTALLED_APPS.remove('debug_toolbar')

# Remove debug_toolbar middleware
MIDDLEWARE = [
    middleware for middleware in MIDDLEWARE 
    if 'debug_toolbar' not in middleware
]

# Database
if 'DATABASE_URL' in os.environ:
    DATABASES['default'] = dj_database_url.parse(os.environ['DATABASE_URL'])

# Security settings - only enable in production
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'
else:
    # Disable security features in development
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

# Email (configure as needed)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = env('EMAIL_HOST', default='')
EMAIL_PORT = env('EMAIL_PORT', default=587)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env.bool('DJANGO_DEBUG', False)

# Allow requests from localhost, backend container, and any other specified hosts
ALLOWED_HOSTS = env.list('DJANGO_ALLOWED_HOSTS', default=[])

# CSRF Trusted Origins for production - will be set via env var
CSRF_TRUSTED_ORIGINS = env.list('DJANGO_CSRF_TRUSTED_ORIGINS', default=[])

# CORS settings for production
CORS_ALLOW_ALL_ORIGINS = False
# CORS_ALLOWED_ORIGINS will be sourced from 'CORS_ALLOWED_ORIGINS' env var defined in base.py
