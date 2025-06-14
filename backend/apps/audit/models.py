from django.db import models
from django.conf import settings
from apps.common.models import TimeStampedModel

class AuditLog(models.Model):
    """Audit trail for user actions."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=50)
    resource = models.CharField(max_length=200)
    resource_id = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True)
    user_agent = models.TextField(blank=True)
    status_code = models.PositiveIntegerField()
    request_data = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['resource', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.action} - {self.resource} - {self.timestamp}"
