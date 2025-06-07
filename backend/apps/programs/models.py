# import uuid # No longer needed as UUIDPKBaseModel provides the id
from django.db import models
from django.conf import settings

# Reference imports (assume these exist in your project structure)
# from apps.optionlist.models import OptionListItem
# from apps.client_management.models import Client
# from apps.cultural_groups.models import CulturalGroup
# from apps.reference_data.models import Region, OutreachLocation
# from apps.assessment.models import AssessmentForm

from apps.common.models import UUIDPKBaseModel # Changed from FactTableBaseModel
from apps.optionlists.models import OptionListItem # Added import

class Program(UUIDPKBaseModel):
    """
    Program represents a service or program that can be offered to clients.

    Soft Delete:
        - Uses is_deleted, deleted_at, and deleted_by fields (from BaseModel/SoftDeleteModel) to perform soft deletes.
        - Soft-deleted programs are excluded from all API queries by default.
        - Hard deletes are not performed; use is_deleted for archival/removal.

    Status:
        - STATUS_CHOICES includes:
            - 'draft': Program is being set up, not yet ready.
            - 'inactive': Setup complete, but not yet operational.
            - 'operational': Program is live and running.
            - 'archived': Program is no longer active or available.
        - The previous is_active field has been removed; use status and is_deleted for state management.
    """
    name = models.CharField(max_length=128)
    description = models.TextField(blank=True)
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('inactive', 'Inactive'),
        ('operational', 'Operational'),
        ('archived', 'Archived'),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    funding_agencies = models.ManyToManyField(
        'optionlists.OptionListItem',
        through='ProgramFunding',
        related_name='program_funding_agencies',
        limit_choices_to={'option_list__slug': 'programs-funding_agencies'}
    )
    # cultural_groups = models.ManyToManyField('cultural_groups.CulturalGroup', through='ProgramCulturalGroup')
    assigned_staff = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through='ProgramAssignedStaff',
        through_fields=('program', 'staff')
    )
    service_types = models.ManyToManyField('optionlists.OptionListItem', related_name='program_types', limit_choices_to={'option_list__slug': 'programs-service_types'})
    delivery_modes = models.ManyToManyField('optionlists.OptionListItem', related_name='program_delivery_modes', limit_choices_to={'option_list__slug': 'programs-delivery_modes'})
    locations = models.ManyToManyField('optionlists.OptionListItem', related_name='program_locations', limit_choices_to={'option_list__slug': 'programs-locations'})
    enrolment_schema = models.JSONField(blank=True, null=True)
    # assessment_forms = models.ManyToManyField('assessment_forms.AssessmentForm', through='ProgramAssessmentForm')
    extra_data = models.JSONField(blank=True, null=True)

    def __str__(self):
        return self.name

class Enrolment(UUIDPKBaseModel):
    # client = models.ForeignKey('client_management.Client', on_delete=models.CASCADE)
    program = models.ForeignKey(Program, on_delete=models.CASCADE)
    responsible_staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='program_enrolment_responsible_staff')
    
    enrolment_date = models.DateField()
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    status = models.ForeignKey(OptionListItem, on_delete=models.PROTECT, related_name='enrolment_statuses', limit_choices_to={'option_list__slug': 'enrolment-status'})
    exit_reason = models.ForeignKey(OptionListItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='enrolment_exit_reasons', limit_choices_to={'option_list__slug': 'programs-exit-reasons'})
    exit_notes = models.TextField(blank=True, null=True)
    
    notes = models.TextField(blank=True, null=True)
    
    referral = models.ForeignKey('referral_management.Referral', on_delete=models.SET_NULL, null=True, blank=True)
    episode_number = models.CharField(max_length=32, blank=True)
    documents = models.ManyToManyField('common.Document', blank=True)
    extra_data = models.JSONField(blank=True, null=True)

    def __str__(self):
        return f"Enrolment in {self.program} ({self.start_date})"



# --- Through/Link Tables ---
class ProgramFunding(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='funding_links')
    funding_agency = models.ForeignKey(
        'optionlists.OptionListItem',
        on_delete=models.CASCADE,
        related_name='funded_programs',
        limit_choices_to={'option_list__slug': 'programs-funding_agencies'}
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)

# class ProgramCulturalGroup(models.Model):
#     program = models.ForeignKey(Program, on_delete=models.CASCADE)
#     cultural_group = models.ForeignKey('cultural_groups.CulturalGroup', on_delete=models.CASCADE)

class ProgramAssignedStaff(UUIDPKBaseModel):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='staff')
    staff = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=64)
    fte = models.DecimalField(max_digits=3, decimal_places=2, default=1.0)
    is_responsible = models.BooleanField(default=False)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)

# class ProgramAssessmentForm(models.Model):
#     program = models.ForeignKey(Program, on_delete=models.CASCADE)
#     assessment_form = models.ForeignKey('assessment_forms.AssessmentForm', on_delete=models.CASCADE)
#     version = models.CharField(max_length=32)
#     is_required = models.BooleanField(default=False)

class ProgramRegion(models.Model):
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='region_links')
    region = models.ForeignKey(
        'optionlists.OptionListItem',
        on_delete=models.CASCADE,
        related_name='program_regions_link',
        limit_choices_to={'option_list__slug': 'programs-regions'}
    )

# ServiceTypeLink and ServiceDeliveryMode models were removed as direct ManyToManyFields are used.

# Example for ReminderType OptionListItem (with priority)

# TermTranslation model for Te Reo/English support
