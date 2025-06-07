from django.urls import reverse
from rest_framework import status
from .authenticated_api_case import AuthenticatedAPITestCase
from django.test import override_settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
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

class ReferralOptionlistsAPITests(AuthenticatedAPITestCase):
    """Test the referral management API optionlist endpoints"""

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
        cls.organisation = Organisation.objects.create(name="Test Org for ReferralOptionlistsAPITests")
        
        cls.test_client = Client.objects.create(
            first_name="TestClientFName", last_name="TestClientLName",
            date_of_birth=timezone.now().date() - timezone.timedelta(days=365*30),
            status=cls.client_status, primary_language=cls.language,
            created_by=cls.user, updated_by=cls.user
        )

    def setUp(self):
        super().setUp()


    def test_batch_optionlists_returns_expected_keys(self):
        """
        Test that the batch_optionlists endpoint returns all required dropdown keys and correct structure.
        """
        url = reverse('referral-batch-optionlists')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        expected_keys = [
            'external_service_providers',
            'referral_types',
            'referral_priorities',
            'referral_service_types',
            'referral_statuses',
        ]
        for key in expected_keys:
            self.assertIn(key, response.data)
            self.assertIsInstance(response.data[key], list)

    def test_batch_optionlists_with_no_data(self):
        """
        Test batch_optionlists returns empty lists when no OptionLists exist for required slugs.
        """
        self.authenticate()
        Referral.objects.all().delete()
        Client.objects.all().delete()
        OptionListItem.objects.all().delete()
        OptionList.objects.all().delete()
        url = reverse('referral-batch-optionlists')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for key in [
            'external_service_providers',
            'referral_types',
            'referral_priorities',
            'referral_service_types',
            'referral_statuses',
        ]:
            self.assertEqual(response.data[key], [])
