from django.urls import reverse
from rest_framework import status
from .authenticated_api_case import AuthenticatedAPITestCase
from django.test import override_settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
User = get_user_model()
from django.utils import timezone
import uuid

from ..models import (
    Referral,
    ReferralStatus,
    ReferralPriority,
    ReferralType
)
from apps.optionlists.models import OptionList, OptionListItem
from apps.client_management.models import Client

class ReferralListCreateAPITests(AuthenticatedAPITestCase):
    """Test the referral management API List and Create endpoints"""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.referral_status_list = OptionList.objects.create(
            slug="referral-statuses", name="Referral Statuses"
        )
        cls.status = OptionListItem.objects.create(
            option_list=cls.referral_status_list, label="PENDING", slug="pending", is_active=True, sort_order=10
        )
        cls.referral_priority_list = OptionList.objects.create(
            slug="referral-priorities", name="Referral Priorities"
        )
        cls.priority = OptionListItem.objects.create(
            option_list=cls.referral_priority_list, label="MEDIUM", slug="medium", is_active=True, sort_order=20
        )
        cls.referral_type_list = OptionList.objects.create(
            slug="referral-types", name="Referral Types"
        )
        cls.ref_type = OptionListItem.objects.create(
            option_list=cls.referral_type_list, label="INCOMING", slug="incoming", is_active=True, sort_order=30
        )
        cls.service_type_list = OptionList.objects.create(
            slug="referral-service-types", name="Referral Service Types"
        )
        cls.service_type = OptionListItem.objects.create(
            option_list=cls.service_type_list, label="Mental Health", slug="mental-health", is_active=True
        )
        cls.language_list = OptionList.objects.create(
            slug="languages", name="Languages"
        )
        cls.language = OptionListItem.objects.create(
            option_list=cls.language_list, label="English", slug="en", name="English", is_active=True
        )
        cls.client_status_list = OptionList.objects.create(
            slug="client-statuses", name="Client Statuses"
        )
        cls.client_status = OptionListItem.objects.create(
            option_list=cls.client_status_list, label="ACTIVE", slug="active", is_active=True
        )
        from apps.core.models import Organisation
        cls.organisation = Organisation.objects.create(name="Test Org for ReferralListCreateAPITests")
        
        cls.test_client = Client.objects.create(
            first_name="TestClientFName", last_name="TestClientLName",
            date_of_birth=timezone.now().date() - timezone.timedelta(days=365*30),
            status=cls.client_status, primary_language=cls.language,
            created_by=cls.user, updated_by=cls.user
        )

    def setUp(self):
        super().setUp()


    def _create_referral(self, **kwargs):
        """Helper to create a referral for tests that need one."""
        defaults = dict(
            type=self.ref_type,
            status=self.status,
            priority=self.priority,
            service_type=self.service_type,
            reason="Test referral reason",
            client=self.test_client,
            client_type="existing",
            referral_date=timezone.now().date(),
            notes="Test notes",
            created_by=self.user, # Use authenticated user
            updated_by=self.user  # Also set updated_by
        )
        defaults.update(kwargs)
        return Referral.objects.create(**defaults)

    def test_create_referral_returns_id(self):
        # self.authenticate() is a no-op due to force_authenticate in AuthenticatedAPITestCase.setUp and can be removed
        """
        Test that creating a new referral returns an 'id' field in the response (API contract).
        This is a MUST for all creation endpoints.
        """
        url = reverse('referral-list')
        data = {
            'type': self.ref_type.id,
            'status': self.status.id,
            'priority': self.priority.id,
            'service_type': self.service_type.id,
            'reason': 'New test referral',
            'client': self.test_client.id,
            'client_type': 'existing',
            'referral_date': timezone.now().date().isoformat(),
            'notes': 'Test notes'
            # 'created_by' should be handled by the system/view based on authenticated user
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.content)
        self.assertIn('id', response.data, "Creation response must include 'id'")
        self.assertIsNotNone(response.data['id'], "Returned 'id' must not be None")
        # Ensure one referral was created in this test, starting from a clean slate if necessary for counts
        # For instance, if you want to check Referral.objects.count() == 1, ensure db is clean before this test or count diff.
