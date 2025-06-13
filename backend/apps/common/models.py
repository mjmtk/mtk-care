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
    
    SharePoint Folder Structure:
    /Clients/{client_uuid}/Referrals/{referral_uuid}/consent-forms/
    /Clients/{client_uuid}/Referrals/{referral_uuid}/assessments/
    /Clients/{client_uuid}/General/id-documents/
    """
    
    # Basic File Information
    file_name = models.CharField(max_length=255, verbose_name=_("File Name"))
    original_filename = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        verbose_name=_("Original Filename"),
        help_text=_("Original filename before any sanitization")
    )
    file_size = models.PositiveBigIntegerField(
        null=True,
        blank=True, 
        verbose_name=_("File Size"),
        help_text=_("File size in bytes")
    )
    mime_type = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        verbose_name=_("MIME Type")
    )
    
    # Enhanced SharePoint Integration
    sharepoint_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text=_('SharePoint unique file ID or URL (legacy)'),
        verbose_name=_("SharePoint ID")
    )
    sharepoint_unique_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text=_('SharePoint GUID for the file'),
        verbose_name=_("SharePoint Unique ID")
    )
    sharepoint_etag = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text=_('SharePoint ETag for version tracking'),
        verbose_name=_("SharePoint ETag")
    )
    sharepoint_server_relative_url = models.CharField(
        max_length=1000,
        null=True,
        blank=True,
        help_text=_('Server-relative URL for API access'),
        verbose_name=_("SharePoint Server Relative URL")
    )
    sharepoint_web_url = models.URLField(
        max_length=1000,
        null=True,
        blank=True,
        verbose_name=_("SharePoint Web URL"),
        help_text=_("URL to view file in SharePoint web interface")
    )
    sharepoint_download_url = models.URLField(
        max_length=1000,
        null=True,
        blank=True,
        verbose_name=_("SharePoint Download URL"),
        help_text=_("Direct download URL (may expire)")
    )
    
    # Folder Structure for SharePoint Organization
    client_id = models.UUIDField(
        null=True,
        blank=True,
        verbose_name=_("Client ID"),
        help_text=_("UUID of the client this document belongs to")
    )
    referral_id = models.UUIDField(
        null=True,
        blank=True,
        verbose_name=_("Referral ID"),
        help_text=_("UUID of the referral this document belongs to (if referral-specific)")
    )
    class DocumentCategory(models.TextChoices):
        # Client-level documents (stored in general/{subcategory}/)
        IDENTIFICATION = 'identification', _('Identification')           # general/identification/
        MEDICAL_RECORDS = 'medical-records', _('Medical Records')       # general/medical-records/
        LEGAL = 'legal', _('Legal Documents')                           # general/legal/
        INSURANCE = 'insurance', _('Insurance')                         # general/insurance/
        GENERAL_OTHER = 'general-other', _('General Other')             # general/other/
        
        # Referral-specific documents (stored in referrals/{referral_id}/ - no subfolders)
        # Use Django metadata for organization: type, folder_category, etc.
        REFERRAL = 'referral', _('Referral Document')                   # All referral documents
    
    folder_category = models.CharField(
        max_length=50,
        choices=DocumentCategory.choices,
        default=DocumentCategory.GENERAL_OTHER,
        verbose_name=_("Document Category"),
        help_text=_("Category determines SharePoint folder organization")
    )
    
    # Document Classification
    type = models.ForeignKey(
        'optionlists.OptionListItem',
        on_delete=models.PROTECT,
        related_name='document_types',
        limit_choices_to={'option_list__slug': 'document-types'},
        null=True,
        blank=True,
        verbose_name=_("Document Type")
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', _('Pending Upload')),
            ('uploading', _('Uploading')),
            ('uploaded', _('Uploaded Successfully')),
            ('failed', _('Upload Failed')),
            ('archived', _('Archived')),
            ('deleted', _('Deleted')),
        ],
        default='pending',
        verbose_name=_("Upload Status")
    )
    
    # Document Content and Security
    is_confidential = models.BooleanField(
        default=False,
        verbose_name=_("Confidential"),
        help_text=_("Whether this document contains confidential information")
    )
    access_level = models.CharField(
        max_length=20,
        choices=[
            ('public', _('Public')),
            ('internal', _('Internal Only')),
            ('restricted', _('Restricted Access')),
            ('confidential', _('Confidential')),
        ],
        default='internal',
        verbose_name=_("Access Level")
    )
    
    # Version Control
    version = models.CharField(
        max_length=20,
        default='1.0',
        verbose_name=_("Version"),
        help_text=_("Document version for tracking changes")
    )
    is_latest_version = models.BooleanField(
        default=True,
        verbose_name=_("Is Latest Version")
    )
    superseded_by = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='supersedes',
        verbose_name=_("Superseded By"),
        help_text=_("Document that replaces this one")
    )
    
    # Additional Metadata
    description = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Description"),
        help_text=_("Brief description of the document content")
    )
    tags = models.JSONField(
        default=list,
        blank=True,
        verbose_name=_("Tags"),
        help_text=_("List of tags for document categorization")
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_("Additional Metadata"),
        help_text=_("Flexible metadata for extensibility")
    )
    
    # Upload Tracking
    upload_error = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Upload Error"),
        help_text=_("Error message if upload failed")
    )
    uploaded_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_("Uploaded At"),
        help_text=_("When the file was successfully uploaded to SharePoint")
    )
    
    def __str__(self):
        return f"{self.file_name} ({self.get_status_display()})"
    
    def get_category_folder(self) -> str:
        """Get the appropriate folder name for the document category."""
        category_folders = {
            self.DocumentCategory.CONSENT_FORM: 'consent-forms',
            self.DocumentCategory.ASSESSMENT: 'assessments', 
            self.DocumentCategory.CARE_PLAN: 'care-plans',
            self.DocumentCategory.REFERRAL_LETTER: 'referral-letters',
            self.DocumentCategory.ID_DOCUMENT: 'identification',
            self.DocumentCategory.MEDICAL_RECORD: 'medical-records',
            self.DocumentCategory.COURT_ORDER: 'court-orders',
            self.DocumentCategory.SCHOOL_REPORT: 'school-reports',
            self.DocumentCategory.INSURANCE_DOCUMENT: 'insurance',
            self.DocumentCategory.GENERAL: 'general',
            self.DocumentCategory.OTHER: 'other',
        }
        return category_folders.get(self.folder_category, 'general')

    @property
    def sharepoint_folder_path(self) -> str:
        """Generate the SharePoint folder path based on client/referral structure.
        
        Improved Structure:
        /<client-id>/
            /referrals/
                /<referral-id>/          # All referral documents together
                    - consent-form.pdf
                    - assessment.docx
            /other-documents/
                /identification/         # ID documents
                /medical-records/       # Medical records
                /court-orders/          # Legal documents
                etc.
        """
        if not self.client_id:
            return f"Unassigned/"
        
        if self.referral_id:
            # Referral-specific document: all in referral folder
            return f"{self.client_id}/referrals/{self.referral_id}/"
        else:
            # Client general document: organized by category
            category_folder = self.get_category_folder()
            return f"{self.client_id}/other-documents/{category_folder}/"
    
    @property
    def full_sharepoint_path(self) -> str:
        """Get the complete SharePoint path including filename."""
        return f"{self.sharepoint_folder_path}{self.file_name}"
    
    @property
    def file_size_formatted(self) -> str:
        """Return formatted file size in human-readable format."""
        if not self.file_size:
            return "Unknown"
        
        # Convert bytes to human readable format
        for unit in ['B', 'KB', 'MB', 'GB']:
            if self.file_size < 1024.0:
                return f"{self.file_size:.1f} {unit}"
            self.file_size /= 1024.0
        return f"{self.file_size:.1f} TB"
    
    def mark_uploaded(self, sharepoint_id: str = None, sharepoint_url: str = None):
        """Mark document as successfully uploaded with SharePoint details."""
        self.status = 'uploaded'
        self.uploaded_at = timezone.now()
        if sharepoint_id:
            self.sharepoint_id = sharepoint_id
        if sharepoint_url:
            self.sharepoint_url = sharepoint_url
        self.save(update_fields=['status', 'uploaded_at', 'sharepoint_id', 'sharepoint_url'])
    
    def mark_failed(self, error_message: str):
        """Mark document upload as failed with error message."""
        self.status = 'failed'
        self.upload_error = error_message
        self.save(update_fields=['status', 'upload_error'])

    class Meta:
        verbose_name = _('Document')
        verbose_name_plural = _('Documents')
        ordering = ['-created_at']
        app_label = 'common'
        indexes = [
            models.Index(fields=['client_id']),
            models.Index(fields=['referral_id']),
            models.Index(fields=['status']),
            models.Index(fields=['folder_category']),
            models.Index(fields=['type']),
            models.Index(fields=['is_latest_version']),
            models.Index(fields=['sharepoint_unique_id']),
        ]


class DocumentAuditLog(UUIDPKBaseModel):
    """
    Audit trail for document access and operations.
    Tracks all document-related activities for compliance and security.
    """
    
    class ActionType(models.TextChoices):
        UPLOADED = 'uploaded', _('Document Uploaded')
        VIEWED = 'viewed', _('Document Viewed')
        DOWNLOADED = 'downloaded', _('Document Downloaded')
        UPDATED = 'updated', _('Document Updated')
        DELETED = 'deleted', _('Document Deleted')
        SHARED = 'shared', _('Document Shared')
        ACCESS_DENIED = 'access_denied', _('Access Denied')
        
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='audit_logs',
        verbose_name=_("Document")
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='document_audit_logs',
        verbose_name=_("User")
    )
    action = models.CharField(
        max_length=50,
        choices=ActionType.choices,
        verbose_name=_("Action")
    )
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name=_("IP Address")
    )
    user_agent = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("User Agent")
    )
    success = models.BooleanField(
        default=True,
        verbose_name=_("Success"),
        help_text=_("Whether the action was successful")
    )
    error_message = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("Error Message"),
        help_text=_("Error details if action failed")
    )
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_("Additional Metadata"),
        help_text=_("Extra context about the action")
    )
    
    def __str__(self):
        return f"{self.action} - {self.document.file_name} by {self.user}"
    
    class Meta:
        verbose_name = _('Document Audit Log')
        verbose_name_plural = _('Document Audit Logs')
        ordering = ['-created_at']
        app_label = 'common'
        indexes = [
            models.Index(fields=['document']),
            models.Index(fields=['user']),
            models.Index(fields=['action']),
            models.Index(fields=['created_at']),
            models.Index(fields=['ip_address']),
        ]

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
