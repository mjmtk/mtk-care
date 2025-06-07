from django.urls import reverse
from rest_framework import status
from uuid import UUID
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

class ReferralDetailUpdateDeleteAPITests(AuthenticatedAPITestCase):
    """Test the referral management API Detail, Update, and Delete endpoints"""

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
        cls.organisation = Organisation.objects.create(name="Test Org for ReferralDetailUpdateDeleteAPITests")
        
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
            reason="Test referral reason for detail/update/delete tests",
            client=self.test_client,
            client_type="existing",
            referral_date=timezone.now().date(),
            notes="Test notes for detail/update/delete tests",
            created_by=self.user, # Use authenticated user
            updated_by=self.user  # Also set updated_by
        )
        defaults.update(kwargs)
        return Referral.objects.create(**defaults)

    def test_get_single_referral(self):
        referral = self._create_referral()
        url = reverse('referral-detail', args=[referral.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        print(f"API ID: {response.data['id']}, type: {type(response.data['id'])}")
        print(f"DB ID (str): {str(referral.id)}, type: {type(str(referral.id))}")
        self.assertEqual(UUID(response.data['id']), referral.id)

    def test_update_referral(self):
        referral = self._create_referral()
        url = reverse('referral-detail', args=[referral.id])
        updated_reason = 'Updated reason for referral'
        data = {
            'status_id': self.status.id, # Keep existing, or provide new valid ID
            'priority_id': self.priority.id,
            'type_id': self.ref_type.id,
            'service_type_id': self.service_type.id,
            'client_id': self.test_client.id,
            'reason': updated_reason,
            'notes': 'Updated notes'
            # Ensure all required fields for PATCH/PUT are present or handled by serializer
        }
        response = self.client.patch(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        referral.refresh_from_db()
        self.assertEqual(referral.reason, updated_reason)

    def test_update_status(self):
        referral = self._create_referral()
        new_status_item = OptionListItem.objects.create(
            option_list=self.referral_status_list, 
            label="COMPLETED", 
            slug="completed", 
            is_active=True, 
            sort_order=20
        )
        url = reverse('referral-update-status', args=[referral.id])
        data = {'status_id': new_status_item.id}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.content)
        referral.refresh_from_db()
        self.assertEqual(referral.status, new_status_item)

    def test_delete_referral(self):
        referral = self._create_referral()
        url = reverse('referral-detail', args=[referral.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        with self.assertRaises(Referral.DoesNotExist):
            Referral.objects.get(id=referral.id)
