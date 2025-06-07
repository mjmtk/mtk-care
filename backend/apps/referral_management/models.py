
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
    # Referral metadata using OptionListItems
    type = models.ForeignKey(
        OptionListItem,
        on_delete=models.PROTECT,
        related_name='referral_type_referrals',
        verbose_name=_('Referral Type'),
        limit_choices_to={'option_list__slug': 'referral-types'},
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
    )
    
    # Core referral information
    reason = models.TextField(verbose_name=_('Referral Reason'))
    notes = models.TextField(blank=True, null=True, verbose_name=_('Additional Notes'))
    
    # Client relationship (temporarily commented out until client_management app is implemented)
    # client = models.ForeignKey(
    #     'client_management.Client',
    #     on_delete=models.PROTECT,
    #     related_name='referrals',
    #     verbose_name=_('Client'),
    #     null=True,
    #     blank=True,
    #     help_text=_('Leave blank for new clients or self-referrals until client record is created')
    # )
    
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
    
    # Important dates for tracking workflow
    referral_date = models.DateField(verbose_name=_('Referral Date'))
    accepted_date = models.DateField(null=True, blank=True, verbose_name=_('Accepted Date'))
    completed_date = models.DateField(null=True, blank=True, verbose_name=_('Completed Date'))
    follow_up_date = models.DateField(null=True, blank=True, verbose_name=_('Follow-up Date'))
    client_consent_date = models.DateField(null=True, blank=True, verbose_name=_('Client Consent Date'))
    
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