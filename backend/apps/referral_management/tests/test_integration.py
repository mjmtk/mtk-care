from django.urls import reverse
from rest_framework import status
from uuid import UUID
from .authenticated_api_case import AuthenticatedAPITestCase
from apps.client_management.models import Client
from apps.optionlists.models import OptionList, OptionListItem
from apps.referral_management.models import Referral, ReferralStatus, ReferralPriority, ReferralType


class ReferralClientIntegrationTest(AuthenticatedAPITestCase):
    """Test cases for the integration between referrals and clients."""
    
    def setUp(self):
        super().setUp()
        # Create OptionLists and OptionListItems for client fields
        # ... rest of setUp unchanged ...
        status_list = OptionList.objects.create(slug="client-statuses", name="Client Statuses")
        self.client_status = OptionListItem.objects.create(option_list=status_list, name="Active", label="Active", slug="active", is_active=True)
        language_list = OptionList.objects.create(slug="languages", name="Languages")
        self.language = OptionListItem.objects.create(option_list=language_list, name="English", label="English", slug="en", is_active=True)
        pronoun_list = OptionList.objects.create(slug="pronouns", name="Pronouns")
        self.pronoun = OptionListItem.objects.create(option_list=pronoun_list, name="They/Them", label="They/Them", slug="they-them", is_active=True)

        # Create a test client using OptionListItem-based fields
        self.test_client = Client.objects.create(
            first_name="John",
            last_name="Doe",
            date_of_birth="1990-01-01",
            email="john@example.com",
            phone="555-1234",
            status=self.client_status,
            primary_language=self.language,
            pronoun=self.pronoun,
            interpreter_needed=False,
            address_street="123 Main St",
            address_city="",
            address_postcode=""
        )

        # Create OptionLists and OptionListItems for referral fields
        # Use OptionList/OptionListItem for type, status, priority, service_type
        type_list = OptionList.objects.create(slug="referral-types", name="Referral Types")
        self.referral_type = OptionListItem.objects.create(option_list=type_list, name="Incoming", label="Incoming", slug="incoming", is_active=True)
        status_list = OptionList.objects.create(slug="referral-statuses", name="Referral Statuses")
        self.referral_status = OptionListItem.objects.create(option_list=status_list, name="Pending", label="Pending", slug="pending", is_active=True)
        priority_list = OptionList.objects.create(slug="referral-priorities", name="Referral Priorities")
        self.referral_priority = OptionListItem.objects.create(option_list=priority_list, name="Medium", label="Medium", slug="medium", is_active=True)
        service_type_list = OptionList.objects.create(slug="referral-service-types", name="Referral Service Types")
        self.service_type = OptionListItem.objects.create(option_list=service_type_list, name="Mental Health", label="Mental Health", slug="mental-health", is_active=True)

        # Create a test referral
        self.referral = Referral.objects.create(
            type=self.referral_type,
            status=self.referral_status,
            priority=self.referral_priority,
            service_type=self.service_type,
            reason="Initial assessment",
            client_type="Individual",
            referral_date="2025-04-14",
            notes="Test referral"
        )

    def _get_test_user(self):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user, _ = User.objects.get_or_create(email='apitestuser@example.com', defaults={'username': 'apitestuser'})
        return user
    
    def test_link_client_to_referral(self):
        self.authenticate()
        """Test linking a client to a referral."""
        url = reverse('referral-link-client', args=[self.referral.id])
        data = {
            'client_id': self.test_client.id
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Check that the referral was updated with the client
        self.referral.refresh_from_db()
        self.assertEqual(self.referral.client.id, self.test_client.id)
    
    def test_link_nonexistent_client_to_referral(self):
        self.authenticate()
        """Test linking a non-existent client to a referral."""
        url = reverse('referral-link-client', args=[self.referral.id])
        data = {
            'client_id': 999  # Non-existent client ID
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('Client not found', response.data['detail'])
    
    def test_get_referrals_by_client_id(self):
        self.authenticate()
        """Test getting referrals for a specific client ID."""
        # First link the client to the referral
        self.referral.client = self.test_client
        self.referral.save()
        
        url = reverse('referral-by-client') + f'?client_id={self.test_client.id}'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(UUID(response.data[0]['id']), self.referral.id)
    
    def test_get_referrals_by_client_name(self):
        self.authenticate()
        """Test getting referrals for a specific client name."""
        url = reverse('referral-by-client') + '?name=John'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Link the client to the referral
        self.referral.client = self.test_client
        self.referral.save()
        
        # Try again after linking
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(UUID(response.data[0]['id']), self.referral.id)
    
    def test_create_referral_with_client(self):
        self.authenticate()
        """Test creating a referral with a client."""
        url = reverse('referral-list')
        data = {
            'type': self.referral_type.id,
            'status': self.referral_status.id,
            'priority': self.referral_priority.id,
            'service_type': self.service_type.id,
            'reason': 'New referral with client',
            'client': self.test_client.id,
            'referral_date': '2025-04-14',
            'notes': 'Test referral with client'
        }
        
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Find the newly created referral by querying the database
        # This avoids relying on the response data structure
        referrals = Referral.objects.filter(
            reason='New referral with client',
            client=self.test_client
        )
        
        self.assertTrue(referrals.exists(), "Referral was not created")
        referral = referrals.first()
        self.assertEqual(referral.client.id, self.test_client.id)
    
    def test_referral_detail_includes_client_details(self):
        self.authenticate()
        """Test that referral detail includes client details."""
        # Link the client to the referral
        self.referral.client = self.test_client
        self.referral.save()
        
        url = reverse('referral-detail', args=[self.referral.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('client_details', response.data)
        self.assertEqual(UUID(response.data['client_details']['id']), self.test_client.id)
        self.assertEqual(response.data['client_details']['full_name'], f"{self.test_client.first_name} {self.test_client.last_name}")
    
    def test_referral_list_includes_client_details(self):
        self.authenticate()
        """Test that referral list includes client details."""
        # Link the client to the referral
        self.referral.client = self.test_client
        self.referral.save()

        print("\nDEBUG: Referrals in DB before API call in test_referral_list_includes_client_details:")
        all_referrals = Referral.objects.all()
        print(f"Count: {all_referrals.count()}")
        for r in all_referrals:
            print(f"  ID: {r.id}, Reason: {r.reason}, Client: {r.client_id}")
        print("DEBUG: End of referral list print\n")

        url = '/api/referrals/'  # Use the Ninja API endpoint
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_json = response.json()
        self.assertEqual(len(response_json), 1)
        self.assertIn('client_details', response_json[0])
        self.assertEqual(UUID(response_json[0]['client_details']['id']), self.test_client.id)
