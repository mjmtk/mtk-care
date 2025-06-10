from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.common.models import UUIDPKBaseModel
from apps.optionlists.models import OptionListItem
from apps.reference_data.models import Language


class Client(UUIDPKBaseModel):
    """
    Client model - simplified MVP version that can be extended incrementally.

    This model focuses on core client information needed for basic functionality
    while maintaining extensibility for future enhancements.
    """

    # Core Personal Information
    first_name = models.CharField(
        max_length=100,
        verbose_name=_('First Name'),
        help_text=_('Client\'s first name or given name')
    )
    last_name = models.CharField(
        max_length=100,
        verbose_name=_('Last Name'),
        help_text=_('Client\'s last name or family name')
    )
    preferred_name = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name=_('Preferred Name'),
        help_text=_('Name the client prefers to be called')
    )
    date_of_birth = models.DateField(
        verbose_name=_('Date of Birth'),
        help_text=_('Client\'s date of birth')
    )

    # Contact Information
    email = models.EmailField(
        blank=True,
        null=True,
        verbose_name=_('Email'),
        help_text=_('Primary email address')
    )
    phone = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name=_('Phone'),
        help_text=_('Primary phone number')
    )

    # Address Information (simplified)
    address = models.TextField(
        blank=True,
        null=True,
        verbose_name=_('Address'),
        help_text=_('Full address including street, city, and postcode')
    )

    # Status and Language (using OptionList pattern)
    status = models.ForeignKey(
        OptionListItem,
        on_delete=models.PROTECT,
        related_name='client_status_clients',
        verbose_name=_('Status'),
        help_text=_('Current client status'),
        limit_choices_to={'option_list__slug': 'client-statuses'},
    )

    primary_language = models.ForeignKey(
        Language,
        on_delete=models.PROTECT,
        related_name='primary_language_clients',
        verbose_name=_('Primary Language'),
        null=True,
        blank=True,
        help_text=_('Client\'s preferred language'),
    )

    interpreter_needed = models.BooleanField(
        default=False,
        verbose_name=_('Interpreter Needed'),
        help_text=_('Whether an interpreter is required for communication')
    )

    # Cultural Identity (simplified)
    cultural_identity = models.JSONField(
        default=dict,
        blank=True,
        null=True,
        verbose_name=_('Cultural Identity'),
        help_text=_('Cultural background information (extensible JSON field)')
    )

    # Risk and Safety
    risk_level = models.CharField(
        max_length=20,
        choices=[
            ('low', _('Low')),
            ('medium', _('Medium')),
            ('high', _('High')),
        ],
        default='low',
        verbose_name=_('Risk Level'),
        help_text=_('Assessment of client risk level')
    )

    # Consent and Documentation
    consent_required = models.BooleanField(
        default=True,
        verbose_name=_('Consent Required'),
        help_text=_('Whether explicit consent is required for service provision')
    )

    incomplete_documentation = models.BooleanField(
        default=False,
        verbose_name=_('Incomplete Documentation'),
        help_text=_('Flag indicating missing required documentation')
    )

    # Additional Information
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name=_('Notes'),
        help_text=_('Additional notes about the client')
    )

    # Extensibility fields for future enhancements
    extended_data = models.JSONField(
        default=dict,
        blank=True,
        null=True,
        verbose_name=_('Extended Data'),
        help_text=_('Additional data fields for future extensions')
    )

    def __str__(self) -> str:
        if self.preferred_name:
            return f"{self.preferred_name} {self.last_name}"
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self) -> str:
        """Return the full name for display purposes."""
        return f"{self.first_name} {self.last_name}"

    @property
    def display_name(self) -> str:
        """Return the preferred display name."""
        if self.preferred_name:
            return f"{self.preferred_name} {self.last_name}"
        return self.full_name

    def get_age(self) -> int:
        """Calculate current age based on date of birth."""
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )

    class Meta:
        verbose_name = _('Client')
        verbose_name_plural = _('Clients')
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['last_name', 'first_name']),
            models.Index(fields=['status']),
            models.Index(fields=['date_of_birth']),
            models.Index(fields=['primary_language']),
            models.Index(fields=['risk_level']),
        ]
