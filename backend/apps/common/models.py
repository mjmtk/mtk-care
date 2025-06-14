# apps/core/models.py
import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone # Added for soft delete
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
import uuid


class SoftDeleteQuerySet(models.QuerySet):
    def delete(self, user=None):
        return super().update(
            is_deleted=True,
            deleted_at=timezone.now(),
            # deleted_by=user # Ensure deleted_by is handled if user is passed
        )

    def undelete(self, user=None):
        return super().update(
            is_deleted=False,
            deleted_at=None,
            deleted_by=None,
            # updated_at=timezone.now(), # Handled by model's save
            # updated_by=user
        )

    def active(self):
        return self.filter(is_deleted=False)

    def deleted(self):
        return self.filter(is_deleted=True)


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).filter(is_deleted=False)

    def all_including_deleted(self):
        # For accessing all records, including soft-deleted ones, if needed.
        return SoftDeleteQuerySet(self.model, using=self._db)
    
    def deleted_records(self):
        return self.get_queryset().deleted()


class AuditBaseModel(models.Model):
    """
    Base model that includes audit fields for all models in the system.
    """
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Created At"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Updated At"))
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(app_label)s_%(class)s_created_by_audit',
        verbose_name=_("Created By")
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(app_label)s_%(class)s_updated_by_audit',
        verbose_name=_("Updated By")
    )

    class Meta:
        abstract = True
        ordering = ['-created_at'] # Default ordering


class TimeStampedModel(models.Model):
    """Abstract base class with self-updating created and modified fields."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(app_label)s_%(class)s_created_by',
        verbose_name=_("Created By")
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(app_label)s_%(class)s_updated_by',
        verbose_name=_("Updated By")
    )

    class Meta:
        abstract = True

class SoftDeleteModel(models.Model):
    """
    Base model that adds soft delete capability.
    """
    is_deleted = models.BooleanField(default=False, db_index=True, verbose_name=_("Is Deleted")) # Added db_index for performance
    deleted_at = models.DateTimeField(null=True, blank=True, verbose_name=_("Deleted At"))
    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='%(app_label)s_%(class)s_deleted_by',
        verbose_name=_("Deleted By")
    )

    objects = SoftDeleteManager() # Default manager only shows active records
    all_objects = models.Manager()  # Standard manager to access all records, including deleted

    def delete(self, using=None, keep_parents=False, user=None):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        
        update_fields_list = ['is_deleted', 'deleted_at']

        if hasattr(self, 'deleted_by') and user and not isinstance(user, AnonymousUser):
            self.deleted_by = user
            update_fields_list.append('deleted_by')
        
        if hasattr(self, 'updated_by') and user and not isinstance(user, AnonymousUser):
            self.updated_by = user

        self.save(using=using, user=user, update_fields=update_fields_list + (['updated_by', 'updated_at'] if hasattr(self, 'updated_by') else []))

    def undelete(self, user=None):
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None # Clear deleted_by field
        
        update_fields_list = ['is_deleted', 'deleted_at', 'deleted_by']

        self.save(user=user, update_fields=update_fields_list + (['updated_by', 'updated_at'] if hasattr(self, 'updated_by') else []))
        
    def save(self, *args, **kwargs):
        user = kwargs.pop('user', None)

        if self._state.adding and hasattr(self, 'created_by') and not self.created_by:
            if user and not isinstance(user, AnonymousUser):
                self.created_by = user
        
        if hasattr(self, 'updated_by'):
            if user and not isinstance(user, AnonymousUser):
                self.updated_by = user

        if hasattr(self, 'updated_at'):
            self.updated_at = timezone.now()

        update_fields = kwargs.get('update_fields')
        if update_fields is not None:
            update_fields = set(update_fields)
            if hasattr(self, 'updated_by') and self.updated_by and 'updated_by' not in update_fields:
                update_fields.add('updated_by')
            if hasattr(self, 'updated_at') and 'updated_at' not in update_fields:
                update_fields.add('updated_at')
            kwargs['update_fields'] = list(update_fields)

        super().save(*args, **kwargs)

    class Meta:
        abstract = True


class AuditSoftDeleteBaseModel(AuditBaseModel, SoftDeleteModel):
    """
    Combined base model with both audit fields and soft delete capability.
    """
    class Meta:
        abstract = True


class IntegerPKBaseModel(AuditSoftDeleteBaseModel):
    """
    Base model for tables requiring an auto-incrementing Integer primary key.
    """
    class Meta:
        abstract = True


class UUIDPKBaseModel(AuditSoftDeleteBaseModel):
    """
    Base model for tables requiring a UUID primary key.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    last_synced_at = models.DateTimeField(null=True, blank=True, verbose_name=_("Last Synced At"))

    class Meta:
        abstract = True
        ordering = ['-created_at']


class Organisation(UUIDPKBaseModel):
    """
    Represents an organisation within the system.
    """
    name = models.CharField(max_length=255, unique=True, verbose_name=_("Name"))
    is_active = models.BooleanField(default=True, verbose_name=_("Is Active"))

    def __str__(self):
        return self.name

    class Meta(UUIDPKBaseModel.Meta):
        verbose_name = _('Organisation')
        verbose_name_plural = _('Organisations')


# ==========================================
# DOCUMENT METADATA (SharePoint Integration)
# ==========================================

from apps.optionlists.models import OptionListItem

# TODO: Consider adding django-simple-history or django-reversion to this model for metadata/history tracking in the future.
class Document(UUIDPKBaseModel):
    """
    Represents a document with metadata for SharePoint integration.
    Utilises a UUID primary key and includes audit and soft delete features.
    """
    # Note: Client relationship removed temporarily to enable migrations
    # Will be added back in a future migration when client_management app is available
    file_name = models.CharField(max_length=255, verbose_name=_("File Name"))
    sharepoint_id = models.CharField(
        max_length=255,
        help_text=_('SharePoint unique file ID or URL'),
        verbose_name=_("SharePoint ID")
    )
    type = models.ForeignKey(
        'optionlists.OptionListItem',
        on_delete=models.PROTECT,
        related_name='document_types',
        limit_choices_to={'option_list__slug': 'document-types'},
        null=True,
        blank=True,
        verbose_name=_("Document Type")
    )
    status = models.ForeignKey(
        'optionlists.OptionListItem',
        on_delete=models.PROTECT,
        related_name='document_statuses',
        limit_choices_to={'option_list__slug': 'document-statuses'},
        null=True,
        blank=True,
        verbose_name=_("Document Status")
    )
    metadata = models.JSONField(
        blank=True,
        null=True,
        help_text=_('Flexible metadata for extensibility'),
        verbose_name=_("Metadata")
    )
    # 'created_at' (formerly uploaded_at) and 'created_by' (formerly uploaded_by) are inherited from AuditSoftDeleteBaseModel.
    # 'id', 'updated_at', 'updated_by', soft-delete fields, and 'last_synced_at' are also inherited.

    class Meta:
        verbose_name = _('Document')
        verbose_name_plural = _('Documents')
        ordering = ['-created_at']
        app_label = 'common'

    def __str__(self):
        return f"{self.file_name}"

# # ==========================================
# # REFERENCE TABLES FOR CLIENT
# # ==========================================


# class ReminderType(models.Model):
#     option_item = models.OneToOneField('optionlists.OptionListItem', on_delete=models.CASCADE, related_name='reminder_type')
#     priority = models.CharField(max_length=16, choices=[('high', 'High'), ('medium', 'Medium'), ('low', 'Low')])

# class TermTranslation(models.Model):
#     term = models.CharField(max_length=128, unique=True)
#     translation = models.CharField(max_length=256)
#     context = models.CharField(max_length=128, blank=True)

#     def __str__(self):
#         return f"{self.term} ({self.context})"
