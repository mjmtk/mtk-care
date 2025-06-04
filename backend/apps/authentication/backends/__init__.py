"""
Authentication backends for the application.
"""
from .jwt import JWTAuthenticationBackend

__all__ = ['JWTAuthenticationBackend']
