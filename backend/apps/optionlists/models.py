from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.common.models import IntegerPKBaseModel, Organisation
# from apps.reference_data.models import Country
# import uuid # No longer needed directly as PK is handled by base model

import inflect
p = inflect.engine()

def pluralize_if_needed(word):
    # Only pluralize if not already plural (naive check)
    if word and not p.singular_noun(word):
        return p.plural(word)
    return word

class OptionList(IntegerPKBaseModel):
    """
    Represents a category of options (e.g., 'Referral Type', 'Priority').
    Supports global templates and organization-specific customizations.
    """
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=64, db_index=True, help_text=_('Unique code-friendly identifier for this option list'))
    description = models.TextField(blank=True, null=True)
    # Placeholder for organization FK (replace with actual Organization model when available)
    organization = models.ForeignKey('common.Organisation', null=True, blank=True, on_delete=models.SET_NULL, related_name='option_lists', help_text=_('Owning organisation; null for global templates'))
    is_active = models.BooleanField(default=True)
    is_template = models.BooleanField(default=False, help_text=_('True if this is a global template'))
    # Country scoping
    # country = models.ForeignKey(Country, null=True, blank=True, on_delete=models.SET_NULL, related_name='option_lists', help_text=_('Country this list is scoped to; null for global or org lists'))
    global_option_list = models.BooleanField(default=False, help_text=_('If true, this list is available globally regardless of country'))
    metadata = models.JSONField(blank=True, null=True, help_text=_('Flexible metadata for extensibility'))

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _('Option List')
        verbose_name_plural = _('Option Lists')
        ordering = ['name']
        unique_together = ('slug', 'organization')


class OptionListItem(IntegerPKBaseModel):
    """
    Represents an individual option within an OptionList (e.g., a single role or status).
    Supports flexible metadata and soft delete. OptionList provides org/template context.
    """
    option_list = models.ForeignKey(
        'OptionList',
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name=_('Option List')
    )
    # Country scoping for individual items
    # country = models.ForeignKey(Country, null=True, blank=True, on_delete=models.SET_NULL, related_name='option_list_items', help_text=_('Country this option is scoped to; null for global or list-level scope'))
    global_option = models.BooleanField(default=False, help_text=_('If true, this option is available globally regardless of country'))
    slug = models.SlugField(max_length=64, db_index=True, help_text=_('Unique code-friendly identifier for this item within its option list'))
    name = models.CharField(max_length=255, help_text=_('Human-readable, singular'))
    label = models.CharField(max_length=255, blank=True, help_text=_('Human-friendly label for UI dropdowns'))
    code = models.CharField(max_length=16, blank=True, null=True, help_text=_('Short code for the item, e.g., language code like EN or ENG'))
    description = models.CharField(max_length=255, blank=True, null=True, help_text=_('Description for this option item'))
    region = models.CharField(max_length=100, blank=True, null=True, help_text=_('Region code or name'))  # Optional, can be FK if regions are implemented
    # client = models.ForeignKey(
    #     'client_management.Client',
    #     on_delete=models.PROTECT,
    #     null=True,
    #     blank=True,
    #     related_name='option_list_items',
    #     verbose_name=_('Client')
    # )
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    metadata = models.JSONField(blank=True, null=True, help_text=_('Flexible metadata for extensibility'))
    parent = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        related_name='children',
        on_delete=models.CASCADE,
        help_text=_('Parent OptionListItem for grouping (null for root items)')
    )

    def __str__(self):
        return f"{self.name.capitalize()} ({self.slug})"

    class Meta:
        verbose_name = _('Option List Item')
        verbose_name_plural = _('Option List Items')
        ordering = ['option_list', 'sort_order', 'name']
        unique_together = ('option_list', 'slug', 'region')

