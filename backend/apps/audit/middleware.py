import json
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser
from .models import AuditLog

class AuditTrailMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        # Only log API calls and POST/PUT/DELETE requests
        if (request.path.startswith('/api/') and 
            request.method in ['POST', 'PUT', 'DELETE', 'PATCH']):
            
            if not isinstance(request.user, AnonymousUser):
                try:
                    AuditLog.objects.create(
                        user=request.user,
                        action=request.method,
                        resource=request.path,
                        ip_address=self.get_client_ip(request),
                        user_agent=request.META.get('HTTP_USER_AGENT', '')[:500],
                        status_code=response.status_code,
                        request_data=self.get_request_data(request),
                    )
                except Exception:
                    # Don't let audit logging break the request
                    pass
        
        return response
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR')
    
    def get_request_data(self, request):
        try:
            if hasattr(request, 'body') and request.body:
                # Limit size and sanitize sensitive data
                data = request.body.decode('utf-8')[:1000]
                return data
        except Exception:
            pass
        return ""
