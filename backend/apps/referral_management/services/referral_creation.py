from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
User = get_user_model()
from rest_framework.exceptions import ValidationError
from django.db import transaction

from apps.optionlists.models import OptionListItem
from ..models import Referral
from ..repositories import ReferralRepository

class ReferralCreationService:
    """
    Service for handling referral creation business logic and validation.
    """
    ACTIVE_STATUS_SLUGS = ['pending', 'in-progress']
    INCOMING_TYPE_SLUG = 'INCOMING'  # Adjust to match OptionListItem slug

    @classmethod
    def validate_referral_data(cls, data):
        # Validate dates
        if 'follow_up_date' in data and data['follow_up_date'] and 'referral_date' in data:
            if data['follow_up_date'] < data['referral_date']:
                raise ValidationError({
                    'follow_up_date': _('Follow-up date cannot be before referral date')
                })
        # Only one active incoming referral per client
        client = data.get('client')
        referral_type = data.get('type')
        status = data.get('status')
        if client and referral_type and status:
            if getattr(referral_type, 'slug', '').upper() == cls.INCOMING_TYPE_SLUG and getattr(status, 'slug', '') in cls.ACTIVE_STATUS_SLUGS:
                existing_active = Referral.objects.filter(
                    client=client,
                    type__slug__iexact=cls.INCOMING_TYPE_SLUG,
                    status__slug__in=cls.ACTIVE_STATUS_SLUGS
                ).exists()
                if existing_active:
                    raise ValidationError({'client': [_('An active incoming referral already exists for this client.')]})

    @classmethod
    @transaction.atomic
    def create_referral(cls, data, created_by_user: User):
        cls.validate_referral_data(data)
        return ReferralRepository.create_referral(data, created_by_user)
