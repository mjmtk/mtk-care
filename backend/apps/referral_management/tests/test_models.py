from .authenticated_api_case import AuthenticatedAPITestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from apps.referral_management.models import Referral
from apps.client_management.models import Client
from apps.optionlists.models import OptionList, OptionListItem

class TestReferralModels(AuthenticatedAPITestCase):
    def setUp(self):
        super().setUp()
        # ... rest of setUp unchanged ...


    def test_service_type_str(self):
        # Use OptionList/OptionListItem for service type
        service_type_list = OptionList.objects.create(slug="referral-service-types", name="Referral Service Types")
        st = OptionListItem.objects.create(option_list=service_type_list, slug="test-service", name="Test Service", label="Test Service", is_active=True)
        self.assertEqual(str(st), "Test service (test-service)")

    def test_referral_status_str(self):
        status_list, _ = OptionList.objects.get_or_create(slug="referral-statuses", defaults={"name": "Referral Statuses"})
        status_item = OptionListItem.objects.create(option_list=status_list, label="Pending", slug="pending", name="Pending", is_active=True)
        self.assertEqual(str(status_item), "Pending (pending)")

    def test_referral_priority_str(self):
        priority_list, _ = OptionList.objects.get_or_create(slug="referral-priorities", defaults={"name": "Referral Priorities"})
        priority_item = OptionListItem.objects.create(option_list=priority_list, label="High", slug="high", name="High", is_active=True)
        self.assertEqual(str(priority_item), "High (high)")

    def test_referral_type_str(self):
        type_list = OptionList.objects.create(slug="referral-types", name="Referral Types")
        rtype = OptionListItem.objects.create(option_list=type_list, slug="incoming", name="INCOMING", label="INCOMING", is_active=True)
        self.assertEqual(str(rtype), "Incoming (incoming)")

    def test_create_referral_with_audit_fields(self):
        # Ensure OptionList and OptionListItem for status, priority, type, service_type are set up
        status_list, _ = OptionList.objects.get_or_create(slug="referral-statuses", defaults={"name": "Referral Statuses"})
        ref_status, _ = OptionListItem.objects.get_or_create(option_list=status_list, slug="pending-test", defaults={"label": "Pending Test", "name": "Pending Test", "is_active": True})

        priority_list, _ = OptionList.objects.get_or_create(slug="referral-priorities", defaults={"name": "Referral Priorities"})
        ref_priority, _ = OptionListItem.objects.get_or_create(option_list=priority_list, slug="medium-test", defaults={"label": "Medium Test", "name": "Medium Test", "is_active": True})

        type_list, _ = OptionList.objects.get_or_create(slug="referral-types", defaults={"name": "Referral Types"})
        ref_type, _ = OptionListItem.objects.get_or_create(option_list=type_list, slug="test-incoming", defaults={"label": "Test Incoming", "name": "Test Incoming", "is_active": True})

        service_type_list, _ = OptionList.objects.get_or_create(slug="referral-service-types", defaults={"name": "Referral Service Types"})
        ref_service_type, _ = OptionListItem.objects.get_or_create(option_list=service_type_list, slug="test-mental-health", defaults={"label": "Test Mental Health", "name": "Test Mental Health", "is_active": True})

        # Ensure a Client is set up with audit fields
        client_status_list, _ = OptionList.objects.get_or_create(slug="client-statuses", defaults={"name": "Client Statuses"})
        client_status, _ = OptionListItem.objects.get_or_create(option_list=client_status_list, slug="active-test", defaults={"label": "Active Test", "name": "Active Test", "is_active": True})
        language_list, _ = OptionList.objects.get_or_create(slug="languages", defaults={"name": "Languages"})
        language, _ = OptionListItem.objects.get_or_create(option_list=language_list, slug="en-test", defaults={"label": "English Test", "name": "English Test", "is_active": True})

        test_client = Client.objects.create(
            first_name="ReferralTestClientFName", 
            last_name="ReferralTestClientLName",
            date_of_birth=timezone.now().date() - timezone.timedelta(days=365*25),
            status=client_status, 
            primary_language=language,
            created_by=self.user, 
            updated_by=self.user
        )

        # Create the Referral instance
        referral = Referral.objects.create(
            type=ref_type,
            status=ref_status,
            priority=ref_priority,
            service_type=ref_service_type,
            reason="Test referral creation in model test",
            client=test_client,
            client_type="existing",
            referral_date=timezone.now().date(),
            created_by=self.user,
            updated_by=self.user
        )

        self.assertIsNotNone(referral.id)
        self.assertEqual(referral.created_by, self.user)
        self.assertEqual(referral.updated_by, self.user)
        self.assertEqual(Referral.objects.count(), 1) # Assuming a clean state or count before/after

