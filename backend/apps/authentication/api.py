"""
API endpoints for authentication and user information.
"""
from ninja import Router
from ninja.security import HttpBearer
from django.http import JsonResponse
from typing import Dict, Any

from .jwt_auth import JWTAuth

router = Router()

@router.get("/me", auth=JWTAuth())
def get_current_user(request):
    """
    Returns the current authenticated user's information and role.
    Requires a valid JWT token in the Authorization header.
    """
    user = request.auth
    
    # Check if user is authenticated
    if not user or not user.is_authenticated:
        return JsonResponse(
            {"error": "Authentication required"}, 
            status=401
        )
    
    # Get user profile and role
    try:
        profile = user.userprofile
        role = {
            "id": profile.role.id if profile.role else None,
            "name": profile.role.name if profile.role else None,
            "level": profile.role.level if profile.role else None,
        } if hasattr(user, 'userprofile') and hasattr(user.userprofile, 'role') else None
        
        return {
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": role,
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        }
    except Exception as e:
        return JsonResponse(
            {"error": f"Error retrieving user profile: {str(e)}"}, 
            status=500
        )
