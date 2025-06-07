from django.urls import reverse
from rest_framework import status
from .authenticated_api_case import AuthenticatedAPITestCase
from django.apps import apps
from django.conf import settings

class APICreationResponseContractTests(AuthenticatedAPITestCase):
    """
    Contract test: All POST (creation) endpoints must return an 'id' or 'uuid' field in the response.
    This ensures compliance with strict frontend and project API standards.
    """
    # List of (url_name, post_data) for endpoints to check. Extend as needed.
    ENDPOINTS = [
        (
            'referral-list',
            {
                'type': 1,  # Will be replaced in setUp
                'status': 1,  # Will be replaced in setUp
                'priority': 1,  # Will be replaced in setUp
                'service_type': 1,  # Will be replaced in setUp
                'reason': 'Contract test reason',
                'client': 1,  # Will be replaced in setUp
                'client_type': 'existing',
                'referral_date': '2023-01-01',
            }
        ),
    ]

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData() # Ensure parent's setUpTestData (which creates cls.user) is called
        # Dynamically discover ModelViewSets with 'create' action if desired
        # For now, endpoints are listed manually for explicitness

    def setUp(self):
        super().setUp() # Use authentication from AuthenticatedAPITestCase

        from apps.optionlists.models import OptionList, OptionListItem
        from apps.client_management.models import Client
        from django.utils import timezone
        # self.user is set by AuthenticatedAPITestCase's setUp

        # Create OptionLists and Items using get_or_create for idempotency
        status_list, _ = OptionList.objects.get_or_create(slug="referral-statuses", defaults={"name": "Referral Statuses"})
        status, _ = OptionListItem.objects.get_or_create(option_list=status_list, slug="pending", defaults={"label": "PENDING", "is_active": True, "sort_order": 10})
        
        priority_list, _ = OptionList.objects.get_or_create(slug="referral-priorities", defaults={"name": "Referral Priorities"})
        priority, _ = OptionListItem.objects.get_or_create(option_list=priority_list, slug="medium", defaults={"label": "MEDIUM", "is_active": True, "sort_order": 20})
        
        type_list, _ = OptionList.objects.get_or_create(slug="referral-types", defaults={"name": "Referral Types"})
        ref_type, _ = OptionListItem.objects.get_or_create(option_list=type_list, slug="incoming", defaults={"label": "INCOMING", "is_active": True, "sort_order": 30})
        
        service_type_list, _ = OptionList.objects.get_or_create(slug="referral-service-types", defaults={"name": "Referral Service Types"})
        service_type, _ = OptionListItem.objects.get_or_create(option_list=service_type_list, slug="mental-health", defaults={"label": "Mental Health", "is_active": True})
        
        client_status_list, _ = OptionList.objects.get_or_create(slug="client-statuses", defaults={"name": "Client Statuses"})
        client_status, _ = OptionListItem.objects.get_or_create(option_list=client_status_list, slug="active", defaults={"label": "ACTIVE", "is_active": True})
        
        language_list, _ = OptionList.objects.get_or_create(slug="languages", defaults={"name": "Languages"})
        language, _ = OptionListItem.objects.get_or_create(option_list=language_list, slug="en", defaults={"label": "English", "is_active": True})
        
        # Create test_client, ensuring audit fields are correctly populated
        test_client_defaults = {
            "date_of_birth": timezone.now().date(),
            "status": client_status,
            "primary_language": language,
            "created_by": self.user, 
            "updated_by": self.user
        }
        test_client, created = Client.objects.get_or_create(
            first_name="John", 
            last_name="Doe", 
            defaults=test_client_defaults
        )
        if not created: # if client already existed, ensure updated_by is current user
            Client.objects.filter(pk=test_client.pk).update(updated_by=self.user, updated_at=timezone.now())

        # Update the ENDPOINTS data for the referral
        self.ENDPOINTS[0] = (
            'referral-list',
            {
                'type': ref_type.id,
                'status': status.id,
                'priority': priority.id,
                'service_type': service_type.id,
                'reason': 'Contract test reason',
                'client': test_client.id,
                'client_type': 'existing',
                'referral_date': '2023-01-01',
                # 'created_by' is removed as it's handled by the backend based on authenticated user
            }
        )

    def test_creation_responses_include_id(self):
        self.authenticate()
        for url_name, post_data in self.ENDPOINTS:
            url = reverse(url_name)
            response = self.client.post(url, post_data, format='json')
            if response.status_code not in (status.HTTP_201_CREATED, status.HTTP_200_OK):
                print(f"POST to {url_name} failed: {response.status_code}, response: {response.data}")
            self.assertIn(response.status_code, (status.HTTP_201_CREATED, status.HTTP_200_OK), f"POST to {url_name} did not return 201/200. Response: {response.data}")
            self.assertTrue('id' in response.data or 'uuid' in response.data, f"Response missing 'id' or 'uuid': {response.data}")
