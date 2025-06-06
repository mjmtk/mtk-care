import pytest
from uuid import uuid4
from datetime import date, timedelta
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError # Keep if specific validation tests are added
from django.http import Http404 # Keep if Http404 is tested

from apps.optionlists.models import OptionList, OptionListItem
from apps.client_management.models import Client
from apps.service_management.models import ServiceProgram, Enrolment
from apps.service_management.services import EnrolmentService, ServiceProgramService 
from apps.service_management.schemas import EnrolmentIn, EnrolmentUpdateIn, ServiceProgramIn # Added ServiceProgramIn

# Import shared fixtures
from .test_fixtures import service_test_user, option_list_items 

User = get_user_model()

@pytest.mark.django_db
class TestEnrolmentService:
    @pytest.fixture
    def client_user_for_service(self, db):
        status_ol, _ = OptionList.objects.get_or_create(slug='client-statuses', defaults={'name': 'Client Statuses'})
        status_item, _ = OptionListItem.objects.get_or_create(option_list=status_ol, slug='active', defaults={'name': 'Active', 'label': 'Active', 'is_active': True})
        lang_ol, _ = OptionList.objects.get_or_create(slug='languages', defaults={'name': 'Languages'})
        lang_item, _ = OptionListItem.objects.get_or_create(option_list=lang_ol, slug='en', defaults={'name': 'English', 'label': 'English', 'is_active': True})
        pronoun_ol, _ = OptionList.objects.get_or_create(slug='pronouns', defaults={'name': 'Pronouns'})
        pronoun_item, _ = OptionListItem.objects.get_or_create(option_list=pronoun_ol, slug='they-them', defaults={'name': 'They/Them', 'label': 'They/Them', 'is_active': True})
        client_obj, _ = Client.objects.get_or_create(
            first_name='TestClientForService',
            last_name='UserForService',
            date_of_birth='2000-01-01',
            defaults={
                'status': status_item,
                'primary_language': lang_item,
                'pronoun': pronoun_item,
                'email': 'test.client.svc@example.com'
            }
        )
        return client_obj

    @pytest.fixture
    def program_for_enrolment_service(self, db, service_test_user, option_list_items):
        program_data_dict = {
            "name": "Program for Enrolment Test",
            "description": "A test program for enrolments.",
            "service_types": [option_list_items['service_type'].id],
            "delivery_modes": [option_list_items['delivery_mode'].id],
            "locations": [option_list_items['location'].id],
            "start_date": date.today(),
            "status": "operational"
        }
        program_data = ServiceProgramIn(**program_data_dict)
        program = ServiceProgramService.create_service_program(
            data=program_data, 
            user_id=service_test_user.id
        )
        return program

    @pytest.fixture
    def enrolment_status_item(self, db):
        ol, _ = OptionList.objects.get_or_create(slug='enrolment-status', defaults={'name': 'Enrolment Status'}) # Singular slug
        item, _ = OptionListItem.objects.get_or_create(option_list=ol, slug='enr-active', defaults={'name': 'Active Enrolment', 'is_active': True})
        return item

    def test_create_enrolment(self, service_test_user, client_user_for_service, program_for_enrolment_service, enrolment_status_item):
        enrolment_data = EnrolmentIn(
            client_id=client_user_for_service.id,
            service_program_id=program_for_enrolment_service.id,
            enrolment_date=date.today(),
            start_date=date.today(),  # Added missing start_date
            status=enrolment_status_item.slug # Changed from status_id to status slug
        )
        created_enrolment = EnrolmentService.create_enrolment(data=enrolment_data, user_id=service_test_user.id)
        assert created_enrolment is not None
        assert created_enrolment.client == client_user_for_service
        assert created_enrolment.service_program == program_for_enrolment_service
        assert created_enrolment.created_by == service_test_user
        assert created_enrolment.status == enrolment_status_item

    def test_get_enrolment(self, service_test_user, client_user_for_service, program_for_enrolment_service, enrolment_status_item):
        enrolment = Enrolment.objects.create(
            client=client_user_for_service,
            service_program=program_for_enrolment_service,
            enrolment_date=date.today(),
            status=enrolment_status_item,
            start_date=date.today(), # Added missing start_date
            created_by=service_test_user
        )
        retrieved_enrolment = EnrolmentService.get_enrolment(enrolment_id=enrolment.id)
        assert retrieved_enrolment is not None
        assert retrieved_enrolment.id == enrolment.id

    def test_get_non_existent_enrolment(self):
        retrieved_enrolment = EnrolmentService.get_enrolment(enrolment_id=uuid4())
        assert retrieved_enrolment is None
    
    def test_update_enrolment(self, service_test_user, client_user_for_service, program_for_enrolment_service, enrolment_status_item):
        original_enrolment = Enrolment.objects.create(
            client=client_user_for_service,
            service_program=program_for_enrolment_service,
            enrolment_date=date.today() - timedelta(days=5),
            status=enrolment_status_item,
            notes="Original notes",
            start_date=date.today() - timedelta(days=5), # Added missing start_date
            created_by=service_test_user
        )
        
        other_status_ol = enrolment_status_item.option_list
        updated_status_item, _ = OptionListItem.objects.get_or_create(option_list=other_status_ol, slug='enr-completed', defaults={'name': 'Completed Enrolment', 'is_active': True})

        update_payload = EnrolmentUpdateIn(
            enrolment_date=date.today(),
            status=updated_status_item.slug, # Changed from status_id to status slug
            notes="Updated notes for enrolment.",
            end_date=date.today() + timedelta(days=30)
        )
        
        updated_enrolment = EnrolmentService.update_enrolment(
            enrolment_id=original_enrolment.id, 
            data=update_payload, 
            user_id=service_test_user.id
        )
        
        assert updated_enrolment.notes == "Updated notes for enrolment."
        assert updated_enrolment.status == updated_status_item
        assert updated_enrolment.enrolment_date == date.today()
        assert updated_enrolment.end_date == date.today() + timedelta(days=30)
        assert updated_enrolment.updated_by == service_test_user

    def test_delete_enrolment(self, service_test_user, client_user_for_service, program_for_enrolment_service, enrolment_status_item):
        enrolment_to_delete = Enrolment.objects.create(
            client=client_user_for_service,
            service_program=program_for_enrolment_service,
            enrolment_date=date.today(),
            status=enrolment_status_item,
            start_date=date.today(), # Added missing start_date
            created_by=service_test_user
        )
        success = EnrolmentService.delete_enrolment(enrolment_id=enrolment_to_delete.id, user_id=service_test_user.id)
        assert success is True
        
        # Verify it's marked as deleted
        deleted_enrolment_check = Enrolment.objects.get(id=enrolment_to_delete.id)
        assert deleted_enrolment_check.is_deleted is True
        assert deleted_enrolment_check.deleted_by == service_test_user
        assert deleted_enrolment_check.deleted_at is not None

    def test_delete_non_existent_enrolment(self, service_test_user):
        success = EnrolmentService.delete_enrolment(enrolment_id=uuid4(), user_id=service_test_user.id)
        assert success is False
