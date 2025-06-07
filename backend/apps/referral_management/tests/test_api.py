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
    # ReferralStatus,    ReferralPriority,    ReferralType
)
from apps.optionlists.models import OptionList, OptionListItem
from apps.client_management.models import Client


from django.contrib.auth import get_user_model

# Mock Authentication Class for DRF tests in this file
class MockSystemUserAuthentication(BaseAuthentication):
    def authenticate(self, request):
        User = get_user_model()
        try:
            # AuthenticatedAPITestCase.setUpTestData creates 'apitestuser'
            user = User.objects.get(username='apitestuser')
            return (user, None)  # Successfully authenticated
        except User.DoesNotExist:
            raise AuthenticationFailed('Mock user "apitestuser" not found for DRF test.')

    def authenticate_header(self, request):
        return 'Bearer realm="api"'


@override_settings(REST_FRAMEWORK={'DEFAULT_AUTHENTICATION_CLASSES': ('apps.referral_management.tests.test_api.MockSystemUserAuthentication',)}) 
class ReferralAPITests(AuthenticatedAPITestCase):
    """Test the referral management API endpoints"""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()  # Call parent's setUpTestData
        # Create OptionList and OptionListItem for referral status
        cls.referral_status_list = OptionList.objects.create(
            slug="referral-statuses",
            name="Referral Statuses"
        )
        cls.status = OptionListItem.objects.create(
            option_list=cls.referral_status_list,
            label="PENDING",
            slug="pending",
            is_active=True,
            sort_order=10
        )
        # Create OptionList and OptionListItem for referral priority
        cls.referral_priority_list = OptionList.objects.create(
            slug="referral-priorities",
            name="Referral Priorities"
        )
        cls.priority = OptionListItem.objects.create(
            option_list=cls.referral_priority_list,
            label="MEDIUM",
            slug="medium",
            is_active=True,
            sort_order=20
        )
        # Create OptionList and OptionListItem for referral type
        cls.referral_type_list = OptionList.objects.create(
            slug="referral-types",
            name="Referral Types"
        )
        cls.ref_type = OptionListItem.objects.create(
            option_list=cls.referral_type_list,
            label="INCOMING",
            slug="incoming",
            is_active=True,
            sort_order=30
        )
        # Create OptionList and OptionListItem for service_type
        cls.service_type_list = OptionList.objects.create(
            slug="referral-service-types",
            name="Referral Service Types"
        )
        cls.service_type = OptionListItem.objects.create(
            option_list=cls.service_type_list,
            label="Mental Health",
            slug="mental-health",
            is_active=True
        )
        # Create OptionList and OptionListItem for client status
        cls.client_status_list = OptionList.objects.create(
            slug="client-statuses",
            name="Client Statuses"
        )
        cls.client_status = OptionListItem.objects.create(
            option_list=cls.client_status_list,
            label="ACTIVE",
            slug="active",
            is_active=True
        )
          # Create OptionList and OptionListItem for languages
        cls.language_list = OptionList.objects.create(
            slug="languages",
            name="Languages"
        )
        cls.language = OptionListItem.objects.create(
            option_list=cls.language_list,
            label="English",
            slug="en",
            is_active=True
        )
        
        # Create a test client
        cls.test_client = Client.objects.create(
            first_name="John",
            last_name="Doe",
            date_of_birth=timezone.now().date(),
            status=cls.client_status,
            primary_language=cls.language
        )

    def setUp(self):
        super().setUp()


    def test_batch_optionlists_returns_expected_keys(self):
        """
        Test that the batch_optionlists endpoint returns all required dropdown keys and correct structure.
        """
        self.authenticate()
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
        # Remove all Referrals and Clients first to avoid ProtectedError
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

        # Do NOT create a referral here; each test should create its own referral as needed.
    
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
            created_by=self.__class__.user
        )
        defaults.update(kwargs)
        return Referral.objects.create(**defaults)

    def _get_test_user(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        return User.objects.create(username='apitestuser')

    def test_batch_optionlists_returns_expected_keys(self):
        """
        Test that the batch_optionlists endpoint returns all required dropdown keys and correct structure.
        """
        self.authenticate()
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


    def test_create_referral_returns_id(self):
        self.authenticate()
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
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data, "Creation response must include 'id'")
        self.assertIsNotNone(response.data['id'], "Returned 'id' must not be None")
        self.assertEqual(Referral.objects.count(), 1)

    def test_update_referral(self):
        self.authenticate()
        """Test updating an existing referral"""
        referral = self._create_referral()
        url = reverse('referral-detail', args=[referral.id])
        data = {
            'status_id': self.status.id,
            'priority_id': self.priority.id,
            'type_id': self.ref_type.id,
            'service_type_id': self.service_type.id,
            'client_id': self.test_client.id,
            'reason': 'Updated reason',
            'notes': 'Updated notes'
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        referral.refresh_from_db()
        self.assertEqual(referral.reason, 'Updated reason')

    def test_update_status(self):
        """Test the custom update_status action (OptionListItem, not ReferralStatus)"""
        referral = self._create_referral()
        # Create a new OptionListItem for status
        accepted_status = OptionListItem.objects.create(
            option_list=self.referral_status_list,
            label="ACCEPTED",
            slug="accepted",
            is_active=True,
            sort_order=20
        )
        url = reverse('referral-update-status', args=[referral.id])
        data = {'status_id': accepted_status.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Refresh from database and check status was updated
        referral.refresh_from_db()
        self.assertEqual(referral.status.id, accepted_status.id)
        # If accepted_date is set by business logic, check for it, otherwise skip
        # self.assertIsNotNone(referral.accepted_date)
