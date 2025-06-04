from django.db import models
from django.contrib.auth.models import User, Group
from apps.common.models import TimeStampedModel

class TaskPriority(models.TextChoices):
    CRITICAL = 'critical', 'Critical'
    HIGH = 'high', 'High'
    MEDIUM = 'medium', 'Medium'
    LOW = 'low', 'Low'

class TaskStatus(models.TextChoices):
    NOT_STARTED = 'not_started', 'Not Started'
    IN_PROGRESS = 'in_progress', 'In Progress'
    REVIEW = 'review', 'Under Review'
    COMPLETED = 'completed', 'Completed'
    CANCELLED = 'cancelled', 'Cancelled'

class Task(TimeStampedModel):
    """Core task model with comprehensive tracking."""
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    tags = models.JSONField(default=list, blank=True)
    
    # Assignment
    assigned_to = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_tasks'
    )
    assigned_group = models.ForeignKey(
        Group, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='assigned_tasks'
    )
    
    # Status and Priority
    status = models.CharField(
        max_length=15, 
        choices=TaskStatus.choices, 
        default=TaskStatus.NOT_STARTED
    )
    priority = models.CharField(
        max_length=10, 
        choices=TaskPriority.choices, 
        default=TaskPriority.MEDIUM
    )
    
    # Timing
    due_date = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Progress tracking
    progress_percentage = models.PositiveIntegerField(default=0)
    estimated_hours = models.PositiveIntegerField(null=True, blank=True)
    actual_hours = models.PositiveIntegerField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['due_date']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return self.title

class TaskComment(TimeStampedModel):
    """Comments on tasks for collaboration."""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    is_internal = models.BooleanField(default=False)  # Internal vs external comments
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Comment on {self.task.title} by {self.created_by}"

class TaskAttachment(TimeStampedModel):
    """File attachments for tasks."""
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='task_attachments/%Y/%m/')
    original_filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    content_type = models.CharField(max_length=100)
    
    def __str__(self):
        return f"{self.original_filename} - {self.task.title}"