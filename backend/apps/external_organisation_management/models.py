from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.common.models import UUIDPKBaseModel
from apps.optionlists.models import OptionListItem
# import uuid # No longer needed as UUIDPKBaseModel provides the id

class ExternalOrganisation(UUIDPKBaseModel):
    # id is inherited from UUIDPKBaseModel
    """
    Represents an external organisation (service provider, funder, peak body, etc.).
    """
    name = models.CharField(max_length=255, unique=True, verbose_name=_('Organisation Name'))
    type = models.ForeignKey(
        OptionListItem,
        on_delete=models.PROTECT,
        related_name='external_organisation_type_organisations',
        verbose_name=_('Organisation Type'),
        limit_choices_to={'option_list__slug': 'external_organisation-types'},
    )
    phone = models.CharField(max_length=50, blank=True, verbose_name=_('Organisation Phone'))
    email = models.EmailField(blank=True, null=True, verbose_name=_('Organisation Email'))
    address = models.CharField(max_length=255, blank=True, verbose_name=_('Address'))
    is_active = models.BooleanField(default=True, verbose_name=_('Active'))

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _('External Organisation')
        verbose_name_plural = _('External Organisations')
        ordering = ['name']

class ExternalOrganisationContact(UUIDPKBaseModel):
    # id is inherited from UUIDPKBaseModel
    """
    Contact person for an external organisation.
    """
    organisation = models.ForeignKey(
        ExternalOrganisation,
        on_delete=models.CASCADE,
        related_name='contacts',
        verbose_name=_('Organisation')
    )
    first_name = models.CharField(max_length=100, verbose_name=_('First Name'))
    last_name = models.CharField(max_length=100, verbose_name=_('Last Name'))
    job_title = models.CharField(max_length=100, blank=True, verbose_name=_('Job Title'))
    is_active = models.BooleanField(default=True, verbose_name=_('Active'))
    notes = models.TextField(blank=True, verbose_name=_('Notes'))

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.organisation.name})"

    class Meta:
        verbose_name = _('External Organisation Contact')
        verbose_name_plural = _('External Organisation Contacts')
        ordering = ['organisation__name', 'last_name', 'first_name']

class PhoneNumber(UUIDPKBaseModel):
    # id is inherited from UUIDPKBaseModel
    """
    Phone number for a contact or organisation, with type from OptionList.
    """
    contact = models.ForeignKey(
        ExternalOrganisationContact,
        on_delete=models.CASCADE,
        related_name='phones',
        null=True,
        blank=True,
        verbose_name=_('Contact')
    )
    organisation = models.ForeignKey(
        ExternalOrganisation,
        on_delete=models.CASCADE,
        related_name='phones',
        null=True,
        blank=True,
        verbose_name=_('Organisation')
    )
    number = models.CharField(max_length=50, verbose_name=_('Phone Number'))
    type = models.ForeignKey(
        OptionListItem,
        on_delete=models.PROTECT,
        related_name='phone_type_phones',
        verbose_name=_('Phone Type'),
        limit_choices_to={'option_list__slug': 'common-phone-types'},
    )
    is_active = models.BooleanField(default=True, verbose_name=_('Active'))
    notes = models.TextField(null=True, blank=True, verbose_name=_('Notes'))

    def __str__(self):
        target = self.contact or self.organisation
        return f"{self.number} ({self.type.label}) - {target}"

    class Meta:
        verbose_name = _('Phone Number')
        verbose_name_plural = _('Phone Numbers')
        ordering = ['number']

class EmailAddress(UUIDPKBaseModel):
    # id is inherited from UUIDPKBaseModel
    """
    Email address for a contact or organisation, with type from OptionList.
    """
    contact = models.ForeignKey(
        ExternalOrganisationContact,
        on_delete=models.CASCADE,
        related_name='emails',
        null=True,
        blank=True,
        verbose_name=_('Contact')
    )
    organisation = models.ForeignKey(
        ExternalOrganisation,
        on_delete=models.CASCADE,
        related_name='emails',
        null=True,
        blank=True,
        verbose_name=_('Organisation')
    )
    email = models.EmailField(verbose_name=_('Email Address'))
    type = models.ForeignKey(
        OptionListItem,
        on_delete=models.PROTECT,
        related_name='email_type_emails',
        verbose_name=_('Email Type'),
        limit_choices_to={'option_list__slug': 'common-email-types'},
    )
    is_active = models.BooleanField(default=True, verbose_name=_('Active'))
    is_primary = models.BooleanField(default=False, verbose_name=_('Primary'))

    def __str__(self):
        target = self.contact or self.organisation
        return f"{self.email} ({self.type.label}) - {target}"

    class Meta:
        verbose_name = _('Email Address')
        verbose_name_plural = _('Email Addresses')
        ordering = ['email']
