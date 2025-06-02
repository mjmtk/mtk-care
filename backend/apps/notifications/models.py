from django.db import models
from django.contrib.auth.models import User
from apps.common.models import TimeStampedModel

class NotificationType(models.TextChoices):
    TASK_ASSIGNED = 'task_assigned', 'Task Assigned'
    TASK_UPDATED = 'task_updated', 'Task Updated'
    TASK_COMMENT = 'task_comment', 'Task Comment'
    TASK_DUE = 'task_due', 'Task Due'
    TASK_OVERDUE = 'task_overdue', 'Task Overdue'

class Notification(TimeStampedModel):
    """User notifications."""
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Optional reference to related object
    related_object_type = models.CharField(max_length=50, blank=True)
    related_object_id = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.recipient.username}"
    
    def mark_as_read(self):
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
