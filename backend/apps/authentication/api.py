"""
API endpoints for authentication and user information.
"""
from ninja import Router, Schema
from ninja.responses import Response
from ninja.security import HttpBearer
from typing import Dict, Any

from .jwt_auth import JWTAuth

class ErrorSchema(Schema):
    detail: str

router = Router()

@router.get("/me", auth=JWTAuth(), response={200: Dict[str, Any], 401: ErrorSchema, 500: ErrorSchema})
def get_current_user(request):
    """
    Returns the current authenticated user's information and role.
    Requires a valid JWT token in the Authorization header.
    """
    user = request.auth
    
    # Check if user is authenticated
    if not user or not getattr(user, 'is_authenticated', False):
        return 401, ErrorSchema(detail="Authentication required")
    
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
        return 500, ErrorSchema(detail=f"Error retrieving user profile: {str(e)}")
