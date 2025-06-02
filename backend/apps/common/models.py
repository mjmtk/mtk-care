from django.db import models
from django.contrib.auth.models import User
import uuid

class TimeStampedModel(models.Model):
    """Abstract base class with self-updating created and modified fields."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="%(class)s_created"
    )
    updated_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="%(class)s_updated"
    )

    class Meta:
        abstract = True

class SoftDeleteManager(models.Manager):
    """Manager that filters out soft-deleted objects."""
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)

class SoftDeleteModel(TimeStampedModel):
    """Abstract model with soft delete functionality."""
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name="%(class)s_deleted"
    )

    objects = SoftDeleteManager()
    all_objects = models.Manager()

    def soft_delete(self, user=None):
        """Perform soft delete."""
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = user
        self.save()

    class Meta:
        abstract = True
