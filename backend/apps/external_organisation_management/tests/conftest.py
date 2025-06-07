import pytest
from ninja.testing import TestClient # Added
from api.ninja import api as global_ninja_api # Changed import
from apps.optionlists.models import OptionList, OptionListItem
from apps.external_organisation_management.models import (
    ExternalOrganisation,
    ExternalOrganisationContact,
    PhoneNumber,
    EmailAddress,
)
import uuid
from django.contrib.auth import get_user_model


pytestmark = pytest.mark.django_db # Added


@pytest.fixture
def user(db):
    User = get_user_model()
    test_user, _ = User.objects.get_or_create(
        username='testuser',
        defaults={'first_name': 'Test', 'last_name': 'User', 'email': 'testuser@example.com'}
    )
    return test_user


# --- API Client Fixture ---
@pytest.fixture
def api_client():
    return TestClient(global_ninja_api)

from django.test import Client as DjangoClient

@pytest.fixture
def django_api_client(db, user): # Add db and user for potential auth
    client = DjangoClient()
    # If you need to test authenticated endpoints with this client:
    # client.force_login(user) # Ensure 'user' fixture is correctly providing a user instance
    return client


# --- User Fixture ---

# --- OptionList and OptionListItem Fixtures ---

@pytest.fixture
def ext_org_type_option_list(db):
    ol, _ = OptionList.objects.get_or_create(
        slug='external-organisation-types',
        defaults={'name': 'External Organisation Types', 'is_active': True}
    )
    return ol

@pytest.fixture
def service_provider_type(db, ext_org_type_option_list):
    item, _ = OptionListItem.objects.get_or_create(
        option_list=ext_org_type_option_list,
        slug='service-provider',
        defaults={'name': 'Service Provider', 'is_active': True, 'sort_order': 1}
    )
    return item

@pytest.fixture
def funder_type(db, ext_org_type_option_list):
    item, _ = OptionListItem.objects.get_or_create(
        option_list=ext_org_type_option_list,
        slug='funder',
        defaults={'name': 'Funder', 'is_active': True, 'sort_order': 2}
    )
    return item


@pytest.fixture
def phone_type_option_list(db):
    ol, _ = OptionList.objects.get_or_create(
        slug='common-phone-types',
        defaults={'name': 'Common Phone Types', 'is_active': True}
    )
    return ol

@pytest.fixture
def work_phone_type(db, phone_type_option_list):
    item, _ = OptionListItem.objects.get_or_create(
        option_list=phone_type_option_list,
        slug='work-phone',
        defaults={'name': 'Work Phone', 'is_active': True, 'sort_order': 1}
    )
    return item

@pytest.fixture
def mobile_phone_type(db, phone_type_option_list):
    item, _ = OptionListItem.objects.get_or_create(
        option_list=phone_type_option_list,
        slug='mobile-phone',
        defaults={'name': 'Mobile Phone', 'is_active': True, 'sort_order': 2}
    )
    return item


@pytest.fixture
def email_type_option_list(db):
    ol, _ = OptionList.objects.get_or_create(
        slug='common-email-types',
        defaults={'name': 'Common Email Types', 'is_active': True}
    )
    return ol

@pytest.fixture
def work_email_type(db, email_type_option_list):
    item, _ = OptionListItem.objects.get_or_create(
        option_list=email_type_option_list,
        slug='work-email',
        defaults={'name': 'Work Email', 'is_active': True, 'sort_order': 1}
    )
    return item

@pytest.fixture
def personal_email_type(db, email_type_option_list):
    item, _ = OptionListItem.objects.get_or_create(
        option_list=email_type_option_list,
        slug='personal-email',
        defaults={'name': 'Personal Email', 'is_active': True, 'sort_order': 2}
    )
    return item

# --- Model Instance Fixtures ---

@pytest.fixture
def sample_external_organisation(db, service_provider_type):
    org, _ = ExternalOrganisation.objects.get_or_create(
        name="Test Service Provider Org",
        type=service_provider_type,
        defaults={
            'phone': '091234567',
            'email': 'contact@serviceprovider.com',
            'address': '123 Test St, Testville',
            'is_active': True
        }
    )
    return org

@pytest.fixture
def another_external_organisation(db, funder_type):
    org, _ = ExternalOrganisation.objects.get_or_create(
        name="Test Funder Org",
        type=funder_type,
        defaults={
            'phone': '097654321',
            'email': 'info@funder.com',
            'address': '456 Fund Rd, Fundcity',
            'is_active': True
        }
    )
    return org

@pytest.fixture
def sample_contact(db, sample_external_organisation):
    contact, _ = ExternalOrganisationContact.objects.get_or_create(
        organisation=sample_external_organisation,
        first_name="John",
        last_name="Doe",
        defaults={
            'job_title': 'Manager',
            'notes': 'Primary contact for Test Service Provider Org',
            'is_active': True
        }
    )
    return contact

@pytest.fixture
def another_contact(db, another_external_organisation):
    contact, _ = ExternalOrganisationContact.objects.get_or_create(
        organisation=another_external_organisation,
        first_name="Jane",
        last_name="Smith",
        defaults={
            'job_title': 'Coordinator',
            'notes': 'Primary contact for Test Funder Org',
            'is_active': True
        }
    )
    return contact

@pytest.fixture
def sample_phone_for_contact(db, sample_contact, work_phone_type):
    phone, _ = PhoneNumber.objects.get_or_create(
        contact=sample_contact,
        type=work_phone_type,
        number="09-333-WORK",
        defaults={'is_active': True}
    )
    return phone

@pytest.fixture
def sample_phone_for_org(db, sample_external_organisation, mobile_phone_type):
    phone, _ = PhoneNumber.objects.get_or_create(
        organisation=sample_external_organisation,
        type=mobile_phone_type,
        number="021-MOB-ORG",
        defaults={'is_active': True}
    )
    return phone

@pytest.fixture
def sample_email_for_contact(db, sample_contact, work_email_type):
    email, _ = EmailAddress.objects.get_or_create(
        contact=sample_contact,
        type=work_email_type,
        email="john.doe@work.com",
        defaults={'is_active': True}
    )
    return email

@pytest.fixture
def sample_email_for_org(db, sample_external_organisation, work_email_type):
    email, _ = EmailAddress.objects.get_or_create(
        organisation=sample_external_organisation,
        type=work_email_type,
        email="info@org.com",
        defaults={'is_active': True}
    )
    return email
