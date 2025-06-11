
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.common.models import UUIDPKBaseModel
from apps.optionlists.models import OptionListItem
from apps.external_organisation_management.models import ExternalOrganisation, ExternalOrganisationContact

class Referral(UUIDPKBaseModel):
    """
    Main referral model for tracking incoming and outgoing referrals.
    Supports both client-linked referrals and self-referrals.
    """
    # Referral type as simple string choice
    type = models.CharField(
        max_length=20,
        choices=[
            ('incoming', _('Incoming')),
            ('outgoing', _('Outgoing'))
        ],
        default='incoming',
        verbose_name=_('Referral Type')
    )
    
    status = models.ForeignKey(
        OptionListItem,
        on_delete=models.PROTECT,
        related_name='referral_status_referrals',
        verbose_name=_('Status'),
        limit_choices_to={'option_list__slug': 'referral-statuses'},
    )
    
    priority = models.ForeignKey(
        OptionListItem,
        on_delete=models.PROTECT,
        related_name='referral_priority_referrals',
        verbose_name=_('Priority'),
        limit_choices_to={'option_list__slug': 'referral-priorities'},
    )
    
    service_type = models.ForeignKey(
        OptionListItem,
        on_delete=models.PROTECT,
        related_name='referral_service_type_referrals',
        verbose_name=_('Service Type'),
        limit_choices_to={'option_list__slug': 'referral-service-types'},
        null=True,
        blank=True,
    )
    
    # Core referral information
    reason = models.TextField(verbose_name=_('Referral Reason'))
    notes = models.TextField(blank=True, null=True, verbose_name=_('Additional Notes'))
    
    # Client relationship
    client = models.ForeignKey(
        'client_management.Client',
        on_delete=models.PROTECT,
        related_name='referrals',
        verbose_name=_('Client'),
        null=True,
        blank=True,
        help_text=_('Leave blank for new clients or self-referrals until client record is created')
    )
    
    client_type = models.CharField(
        max_length=20,
        choices=[
            ('existing', _('Existing Client')),
            ('new', _('New Client')),
            ('self', _('Self-Referral'))
        ],
        default='new',
        verbose_name=_('Client Type')
    )
    
    # Referral source categorization
    referral_source = models.CharField(
        max_length=30,
        choices=[
            ('external_agency', _('External Agency')),
            ('school', _('School')),
            ('self_referral', _('Self-Referral')),
            ('internal', _('Internal Transfer')),
            ('family', _('Family/Whānau')),
            ('other', _('Other'))
        ],
        default='external_agency',
        verbose_name=_('Referral Source'),
        help_text=_('How did this referral come to us?')
    )
    
    # External reference number (e.g., "OT-2025-1234")
    external_reference_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name=_('External Reference Number'),
        help_text=_('Reference number from referring organisation')
    )
    
    # Program-specific data storage
    program_data = models.JSONField(
        default=dict,
        blank=True,
        verbose_name=_('Program-Specific Data'),
        help_text=_('Additional data specific to the target program')
    )
    
    # Target program for display logic
    target_program = models.ForeignKey(
        'programs.Program',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='referrals',
        verbose_name=_('Target Program')
    )
    
    # Important dates for tracking workflow
    referral_date = models.DateField(verbose_name=_('Referral Date'))
    accepted_date = models.DateField(null=True, blank=True, verbose_name=_('Accepted Date'))
    completed_date = models.DateField(null=True, blank=True, verbose_name=_('Completed Date'))
    follow_up_date = models.DateField(null=True, blank=True, verbose_name=_('Follow-up Date'))
    client_consent_date = models.DateField(null=True, blank=True, verbose_name=_('Client Consent Date'))
    
    # Approval workflow fields
    requires_approval = models.BooleanField(
        default=False,
        verbose_name=_('Requires Approval'),
        help_text=_('Whether this referral requires supervisory approval')
    )
    approval_reason = models.TextField(
        blank=True,
        null=True,
        verbose_name=_('Approval Reason'),
        help_text=_('Explanation of why approval is required')
    )
    approved_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='approved_referrals',
        verbose_name=_('Approved By')
    )
    approval_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Approval Date')
    )
    
    # Decline workflow fields
    decline_reason = models.ForeignKey(
        OptionListItem,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='declined_referrals',
        verbose_name=_('Decline Reason'),
        limit_choices_to={'option_list__slug': 'decline-reasons'},
        help_text=_('Reason for declining this referral')
    )
    decline_explanation = models.TextField(
        blank=True,
        null=True,
        verbose_name=_('Decline Explanation'),
        help_text=_('Additional explanation for decline (required for "Other" reason)')
    )
    
    # Program assignment tracking
    assigned_program = models.ForeignKey(
        'programs.Program',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='assigned_referrals',
        verbose_name=_('Assigned Program'),
        help_text=_('Program actually assigned to handle this referral')
    )
    program_assigned_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Program Assigned Date')
    )
    program_assigned_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='program_assigned_referrals',
        verbose_name=_('Program Assigned By')
    )
    
    # Staff assignment tracking
    assigned_staff = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='assigned_referrals',
        verbose_name=_('Assigned Staff'),
        help_text=_('Staff member responsible for this referral')
    )
    staff_assigned_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name=_('Staff Assigned Date')
    )
    staff_assigned_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='staff_assignment_referrals',
        verbose_name=_('Staff Assigned By')
    )
    
    # Service commencement tracking
    commencement_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_('Service Commencement Date'),
        help_text=_('Date when service delivery actually began')
    )
    commencement_approved_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='commencement_approved_referrals',
        verbose_name=_('Commencement Approved By')
    )
    
    # External organisation linkage (null for self-referrals)
    external_organisation = models.ForeignKey(
        ExternalOrganisation,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='referrals',
        verbose_name=_('External Organisation'),
        help_text=_('Referring organisation (null for self-referrals)')
    )
    
    external_organisation_contact = models.ForeignKey(
        ExternalOrganisationContact,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='referrals',
        verbose_name=_('External Organisation Contact'),
        help_text=_('Contact person at referring organisation')
    )
    
    def __str__(self) -> str:
        # Determine referral direction and source
        if self.client_type == 'self':
            source = "Self-Referral"
        elif self.external_organisation:
            source = f"From {self.external_organisation.name}"
        else:
            source = "Internal"
            
        # Get client identifier (temporarily simplified until client_management is implemented)
        client_name = f"{self.client_type.title()} Client"
            
        return f"{source} - {client_name} ({self.status.label})"
    
    class Meta:
        verbose_name = _('Referral')
        verbose_name_plural = _('Referrals')
        ordering = ['-referral_date', '-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['type']),
            # models.Index(fields=['client']),  # Temporarily removed until client_management is implemented
            models.Index(fields=['referral_date']),
            models.Index(fields=['service_type']),
            models.Index(fields=['client_type']),
        ]


class ConsentRecord(UUIDPKBaseModel):
    """
    Tracks consent forms and agreements for each referral episode.
    
    Supports multiple types of consent (service delivery, information sharing,
    cultural protocols, etc.) with status tracking and withdrawal dates.
    """
    
    referral = models.ForeignKey(
        Referral,
        on_delete=models.CASCADE,
        related_name='consent_records',
        verbose_name=_('Referral'),
        help_text=_('Referral this consent record belongs to')
    )
    
    consent_type = models.ForeignKey(
        OptionListItem,
        on_delete=models.PROTECT,
        related_name='consent_type_records',
        verbose_name=_('Consent Type'),
        help_text=_('Type of consent being tracked'),
        limit_choices_to={'option_list__slug': 'consent-types'},
    )
    
    # Consent Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', _('Pending')),
            ('obtained', _('Obtained')),
            ('declined', _('Declined')),
            ('withdrawn', _('Withdrawn')),
            ('expired', _('Expired')),
        ],
        default='pending',
        verbose_name=_('Consent Status'),
        help_text=_('Current status of this consent')
    )
    
    # Important Dates
    consent_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_('Consent Date'),
        help_text=_('Date when consent was obtained')
    )
    withdrawal_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_('Withdrawal Date'),
        help_text=_('Date when consent was withdrawn (if applicable)')
    )
    expiry_date = models.DateField(
        null=True,
        blank=True,
        verbose_name=_('Expiry Date'),
        help_text=_('Date when consent expires (if applicable)')
    )
    
    # Document Management
    document = models.ForeignKey(
        'common.Document',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='consent_records',
        verbose_name=_('Document'),
        help_text=_('Associated consent document or form')
    )
    
    # Additional Information
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name=_('Notes'),
        help_text=_('Additional notes about this consent record')
    )
    
    # Person who obtained/recorded consent
    obtained_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='obtained_consents',
        verbose_name=_('Obtained By'),
        help_text=_('Staff member who obtained the consent')
    )
    
    # Withdrawal details
    withdrawn_by = models.ForeignKey(
        'users.User',
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='withdrawn_consents',
        verbose_name=_('Withdrawn By'),
        help_text=_('Staff member who recorded the withdrawal')
    )
    withdrawal_reason = models.TextField(
        blank=True,
        null=True,
        verbose_name=_('Withdrawal Reason'),
        help_text=_('Reason for consent withdrawal')
    )
    
    def __str__(self) -> str:
        return f"{self.consent_type.label} - {self.referral} ({self.status})"
    
    @property
    def is_active(self) -> bool:
        """Check if consent is currently active and valid."""
        if self.status not in ['obtained']:
            return False
        
        # Check if expired
        if self.expiry_date:
            from datetime import date
            return date.today() <= self.expiry_date
        
        return True
    
    @property
    def days_until_expiry(self) -> int:
        """Calculate days until consent expires (if applicable)."""
        if not self.expiry_date:
            return None
        
        from datetime import date
        delta = self.expiry_date - date.today()
        return delta.days
    
    class Meta:
        verbose_name = _('Consent Record')
        verbose_name_plural = _('Consent Records')
        ordering = ['referral', 'consent_type', '-consent_date']
        unique_together = [['referral', 'consent_type']]
        indexes = [
            models.Index(fields=['referral', 'consent_type']),
            models.Index(fields=['status']),
            models.Index(fields=['consent_date']),
            models.Index(fields=['expiry_date']),
        ]