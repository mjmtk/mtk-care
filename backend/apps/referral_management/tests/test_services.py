from .authenticated_api_case import AuthenticatedAPITestCase
from apps.referral_management.models import Referral
from apps.optionlists.models import OptionList, OptionListItem
from apps.referral_management.services.referral_service import ReferralService
from apps.referral_management.services.referral_creation import ReferralCreationService
from apps.referral_management.services.referral_status import ReferralStatusService
from apps.referral_management.services.referral_priority import ReferralPriorityService
from apps.referral_management.services.referral_type import ReferralTypeService
from apps.referral_management.services.service_type import ServiceTypeService

class TestReferralServices(AuthenticatedAPITestCase):
    def setUp(self):
        super().setUp()
        # ... rest of setUp unchanged ...


    def test_create_and_get_referral(self):
        from django.utils import timezone
        from apps.client_management.models import Client # Added for client creation

        # Use get_or_create for OptionLists and OptionListItems
        status_list, _ = OptionList.objects.get_or_create(slug="referral-statuses", defaults={"name": "Referral Statuses"})
        status, _ = OptionListItem.objects.get_or_create(option_list=status_list, slug="pending-service", defaults={"name": "pending-service", "label": "Pending Service"})
        
        priority_list, _ = OptionList.objects.get_or_create(slug="referral-priorities", defaults={"name": "Referral Priorities"})
        priority, _ = OptionListItem.objects.get_or_create(option_list=priority_list, slug="medium-service", defaults={"name": "medium-service", "label": "Medium Service"})
        
        type_list, _ = OptionList.objects.get_or_create(slug="referral-types", defaults={"name": "Referral Types"})
        ref_type, _ = OptionListItem.objects.get_or_create(option_list=type_list, slug="incoming-service", defaults={"name": "incoming-service", "label": "Incoming Service"})
        
        service_type_list, _ = OptionList.objects.get_or_create(slug="service-types", defaults={"name": "Service Types"})
        service_type, _ = OptionListItem.objects.get_or_create(option_list=service_type_list, slug="test-service-service", defaults={"name": "test-service-service", "label": "Test Service Service"})

        # Create a client for the referral
        client_status_list, _ = OptionList.objects.get_or_create(slug="client-statuses", defaults={"name": "Client Statuses"})
        client_status, _ = OptionListItem.objects.get_or_create(option_list=client_status_list, slug="active-service", defaults={"name": "ACTIVE Service", "label": "ACTIVE Service"})
        language_list, _ = OptionList.objects.get_or_create(slug="languages", defaults={"name": "Languages"})
        language, _ = OptionListItem.objects.get_or_create(option_list=language_list, slug="en-service", defaults={"name": "English Service", "label": "English Service"})
        
        test_client = Client.objects.create(
            first_name="ServiceTestClientFName", 
            last_name="ServiceTestClientLName",
            date_of_birth=timezone.now().date() - timezone.timedelta(days=365*30),
            status=client_status, 
            primary_language=language,
            created_by=self.user, 
            updated_by=self.user
        )

        data = {
            "status": status, 
            "priority": priority, 
            "type": ref_type, 
            "service_type": service_type, 
            "referral_date": timezone.now().date(),
            "client": test_client, # Added client
            "reason": "Test referral from service test", # Added reason
            "client_type": "existing" # Added client_type
        }
        
        # Call service method with User instance for audit fields
        referral = ReferralService.create_referral(data, self.user)
        fetched = ReferralService.get_referral(referral.id)
        self.assertEqual(fetched, referral)

    def test_get_all_statuses_service(self):
        status_list = OptionList.objects.create(name="Referral Statuses", slug="referral-statuses")
        status = OptionListItem.objects.create(option_list=status_list, slug="pending", name="Pending", label="Pending")
        # The ReferralStatusService likely needs to be updated to work with OptionListItem
        statuses = OptionListItem.objects.filter(option_list__slug="referral-statuses")
        self.assertIn(status, statuses)
