from .base import *

DEBUG = True

# Additional CORS settings for development
CORS_ALLOW_ALL_ORIGINS = True

# Debug Toolbar
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE.insert(1, 'debug_toolbar.middleware.DebugToolbarMiddleware')
    
    INTERNAL_IPS = [
        '127.0.0.1',
        'localhost',
        '10.0.2.2',  # Docker
    ]
    
    # Debug Toolbar Configuration
    DEBUG_TOOLBAR_CONFIG = {
        'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
        'IS_RUNNING_TESTS': False,  # Fix for test running
    }

# Simplified logging for development
LOGGING['handlers']['console']['level'] = 'DEBUG'
LOGGING['loggers']['apps']['level'] = 'DEBUG'
