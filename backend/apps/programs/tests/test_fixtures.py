import pytest
from django.contrib.auth import get_user_model
from apps.optionlists.models import OptionList, OptionListItem
from datetime import date # Added for default dates in option_list_items

User = get_user_model()

@pytest.fixture
def service_test_user(db):
    user, _ = User.objects.get_or_create(
        username="servicetester",
        defaults={'email': "service.tester@example.com", 'first_name': "Service", 'last_name': "Tester"}
    )
    user.refresh_from_db()
    return user

@pytest.fixture
def staff_member_for_service(db):
    user, _ = User.objects.get_or_create(
        username="staffmemberforservice",
        defaults={'email': "staff.member.service@example.com", 'first_name': "Staff", 'last_name': "MemberSvc"}
    )
    user.refresh_from_db()
    return user

@pytest.fixture
def option_list_items(db):
    # Fixture to create common OptionListItems needed by services
    # Ensuring items are active as services might filter by this
    service_types_ol, _ = OptionList.objects.get_or_create(slug='service_management-service_types', defaults={'name': 'Service Types'})
    st_item, _ = OptionListItem.objects.get_or_create(
        option_list=service_types_ol, 
        slug='st-general', 
        defaults={'name': 'General Service', 'is_active': True, 'metadata': {'default_duration_days': 30}} # Added is_active and metadata
    )
    
    delivery_modes_ol, _ = OptionList.objects.get_or_create(slug='service_management-delivery_modes', defaults={'name': 'Delivery Modes'})
    dm_item, _ = OptionListItem.objects.get_or_create(
        option_list=delivery_modes_ol, 
        slug='dm-online', 
        defaults={'name': 'Online Mode', 'is_active': True} # Added is_active
    )

    locations_ol, _ = OptionList.objects.get_or_create(slug='service_management-locations', defaults={'name': 'Locations'})
    loc_item, _ = OptionListItem.objects.get_or_create(
        option_list=locations_ol, 
        slug='loc-main', 
        defaults={'name': 'Main Location', 'is_active': True} # Added is_active
    )

    return {
        'service_type': st_item,
        'delivery_mode': dm_item,
        'location': loc_item
    }
