from .authenticated_api_case import AuthenticatedAPITestCase
from apps.client_management.models import Client
from apps.referral_management.models import Referral
from apps.referral_management.repositories import ReferralRepository
from apps.optionlists.models import OptionList, OptionListItem
from django.utils import timezone

class TestReferralRepositories(AuthenticatedAPITestCase):
    def setUp(self):
        super().setUp()
        # ... rest of setUp unchanged ...


    def test_get_all_referrals_returns_queryset(self):
        # Setup using get_or_create for idempotency
        status_list, _ = OptionList.objects.get_or_create(slug="referral-statuses", defaults={"name": "Referral Statuses"})
        status, _ = OptionListItem.objects.get_or_create(option_list=status_list, slug="pending-repo", defaults={"name": "Pending Repo", "label": "Pending Repo"})
        
        priority_list, _ = OptionList.objects.get_or_create(slug="referral-priorities", defaults={"name": "Referral Priorities"})
        priority, _ = OptionListItem.objects.get_or_create(option_list=priority_list, slug="high-repo", defaults={"name": "High Repo", "label": "High Repo"})
        
        type_list, _ = OptionList.objects.get_or_create(slug="referral-types", defaults={"name": "Referral Types"})
        ref_type, _ = OptionListItem.objects.get_or_create(option_list=type_list, slug="incoming-repo", defaults={"name": "INCOMING Repo", "label": "INCOMING Repo"})
        
        service_type_list, _ = OptionList.objects.get_or_create(slug="referral-service-types", defaults={"name": "Referral Service Types"})
        service_type, _ = OptionListItem.objects.get_or_create(option_list=service_type_list, slug="test-service-repo", defaults={"name": "Test Service Repo", "label": "Test Service Repo"})
        
        client_status_list, _ = OptionList.objects.get_or_create(slug="client-statuses", defaults={"name": "Client Statuses"})
        client_status, _ = OptionListItem.objects.get_or_create(option_list=client_status_list, slug="active-repo", defaults={"name": "ACTIVE Repo", "label": "ACTIVE Repo"})
        
        language_list, _ = OptionList.objects.get_or_create(slug="languages", defaults={"name": "Languages"})
        language, _ = OptionListItem.objects.get_or_create(option_list=language_list, slug="en-repo", defaults={"name": "English Repo", "label": "English Repo"})
        
        client = Client.objects.create(
            first_name="JohnRepo", 
            last_name="DoeRepo", 
            date_of_birth=timezone.now().date(), 
            status=client_status, 
            primary_language=language,
            created_by=self.user, # Use authenticated user
            updated_by=self.user  # Use authenticated user
        )
        
        Referral.objects.create(
            type=ref_type, 
            status=status, 
            priority=priority, 
            service_type=service_type, 
            reason="Test Repo", 
            client=client, 
            client_type="existing", 
            referral_date=timezone.now().date(), 
            created_by=self.user, # Use authenticated user
            updated_by=self.user  # Use authenticated user
        )
        
        # Test
        queryset = ReferralRepository.get_all_referrals()
        self.assertTrue(queryset.exists())

    def test_get_all_statuses(self):
        status_list = OptionList.objects.create(slug="referral-statuses", name="Referral Statuses")
        status = OptionListItem.objects.create(option_list=status_list, slug="pending", name="Pending", label="Pending")
        statuses = ReferralRepository.get_all_statuses()
        self.assertIn(status, statuses)
