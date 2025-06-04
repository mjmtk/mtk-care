from functools import wraps
from ninja.responses import Response
from django.contrib.auth.models import Group
import logging

logger = logging.getLogger(__name__)

def require_role(role_name):
    """
    Decorator to require specific role for API endpoint access.
    
    Usage:
        @require_role('Administrator')
        def admin_only_endpoint(request):
            pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if not hasattr(request, 'auth') or not request.auth:
                return Response({"error": "Authentication required"}, status=401)
            
            if not request.auth.groups.filter(name=role_name).exists():
                logger.warning(f"User {request.auth.username} attempted to access {func.__name__} without required role: {role_name}")
                return Response({"error": f"Role '{role_name}' required"}, status=403)
            
            return func(request, *args, **kwargs)
        return wrapper
    return decorator

def require_any_role(*role_names):
    """
    Decorator to require any of the specified roles.
    
    Usage:
        @require_any_role('Manager', 'Administrator')
        def manager_or_admin_endpoint(request):
            pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if not hasattr(request, 'auth') or not request.auth:
                return Response({"error": "Authentication required"}, status=401)
            
            user_groups = request.auth.groups.values_list('name', flat=True)
            if not any(role in user_groups for role in role_names):
                logger.warning(f"User {request.auth.username} attempted to access {func.__name__} without required roles: {role_names}")
                return Response({"error": f"One of these roles required: {role_names}"}, status=403)
            
            return func(request, *args, **kwargs)
        return wrapper
    return decorator

def check_task_access(user, task, action='view'):
    """
    Check if user has permission to perform action on task.
    
    Args:
        user: Django User instance
        task: Task instance
        action: 'view', 'edit', 'delete'
    
    Returns:
        bool: True if user has access, False otherwise
    """
    # Admin can do everything
    if user.groups.filter(name='Administrator').exists():
        return True
    
    # Manager can manage department tasks
    # if user.groups.filter(name='Manager').exists():
    #     try:
    #         # Check if user manages this department
    #         return hasattr(task, 'department') and task.department in user.profile.departments.all()
    #     except AttributeError:
    #         # Profile doesn't exist or doesn't have departments
    #         return False
    
    # Provider/Staff can only access assigned tasks
    if action == 'view':
        return (task.assigned_to == user or 
                task.assigned_group in user.groups.all())
    elif action in ['edit', 'delete']:
        return task.assigned_to == user
    
    return False

def require_task_access(action='view'):
    """
    Decorator to check task access permissions.
    
    Usage:
        @require_task_access('edit')
        def update_task(request, task_id: int):
            task = get_object_or_404(Task, id=task_id)
            # Task access already checked by decorator
            pass
    """
    def decorator(func):
        @wraps(func)
        def wrapper(request, *args, **kwargs):
            if not hasattr(request, 'auth') or not request.auth:
                return Response({"error": "Authentication required"}, status=401)
            
            # Get task_id from kwargs or args
            task_id = kwargs.get('task_id') or (args[0] if args else None)
            if not task_id:
                return Response({"error": "Task ID required"}, status=400)
            
            try:
                from apps.tasks.models import Task
                task = Task.objects.get(id=task_id)
                
                if not check_task_access(request.auth, task, action):
                    logger.warning(f"User {request.auth.username} denied access to task {task_id} for action: {action}")
                    return Response({"error": "Access denied to this task"}, status=403)
                
                # Add task to request for use in the view
                request.task = task
                
            except Task.DoesNotExist:
                return Response({"error": "Task not found"}, status=404)
            except Exception as e:
                logger.error(f"Error checking task access: {str(e)}")
                return Response({"error": "Access check failed"}, status=500)
            
            return func(request, *args, **kwargs)
        return wrapper
    return decorator
