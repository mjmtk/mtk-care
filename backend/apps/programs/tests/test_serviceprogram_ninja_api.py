
import pytest
from uuid import uuid4
from django.urls import reverse
from ninja.testing import TestClient
from django.contrib.auth import get_user_model
from api.ninja import api # Main Ninja API instance
from apps.optionlists.models import OptionList, OptionListItem
from apps.service_management.models import ServiceProgram # For direct ORM creation/verification
from datetime import date, timedelta
# from django.contrib.auth import get_user_model
# User = get_user_model()
# Use the global NinjaAPI instance from api.ninja
# client = TestClient(api) # Will be handled by fixture

# --- Pytest Fixtures ---
@pytest.fixture
def test_user(db):
    User = get_user_model()
    user, created = User.objects.get_or_create(
        username="testuser", 
        defaults={'email': "testuser@example.com", 'first_name': "Test", 'last_name': "User"}
    )
    # Ensure password is set for login attempts
    user.set_password("testpassword")
    user.save()
    user.refresh_from_db() # Ensure all fields are current
    return user

@pytest.fixture
def staff_user_1(db):
    User = get_user_model()
    user, _ = User.objects.get_or_create(
        username="staffuser1", 
        defaults={'email': "staff1@example.com", 'first_name': "Staff", 'last_name': "One"}
    )
    user.refresh_from_db()
    return user

@pytest.fixture
def auth_client(): # test_user is not needed here, will be passed per request
    return TestClient(api)

# --- Test Functions ---
@pytest.mark.django_db
def test_create_service_program(auth_client, test_user, staff_user_1):
    st_ol, _ = OptionList.objects.get_or_create(slug='service_management-service_types', defaults={'name':'Service Types'})
    st, _ = OptionListItem.objects.get_or_create(name="Type1", slug="type1", option_list=st_ol)

    payload = {
        "name": "Test Program",
        "description": "A test service program",
        "service_types": [st.id],
        "start_date": "2025-01-01",
        "status": "draft",
        "staff_input": [
            {"staff_id": str(staff_user_1.id), "role": "Manager", "fte": 1.0, "is_responsible": True, "start_date": "2025-01-01", "end_date": None}
        ],
        "extra_data": {"foo": "bar"}
    }
    response = auth_client.post("/service-management/programs/", json=payload, user=test_user)
    assert response.status_code == 201, response.json()
    data = response.json()
    assert data["name"] == "Test Program"
    assert str(st.id) in [str(item['id']) for item in data["service_types"]]
    assert len(data["staff"]) == 1
    assert data["staff"][0]["staff_id"] == staff_user_1.id
    assert data["staff"][0]["role"] == "Manager"
    assert data["extra_data"]["foo"] == "bar"
    # Optionally, assert created_by if schema exposes it or check DB
    program_instance = ServiceProgram.objects.get(id=data['id'])
    assert program_instance.created_by_id == test_user.id
    assert program_instance.updated_by_id == test_user.id

@pytest.mark.django_db
def test_list_service_programs(auth_client, test_user):
    st_ol, _ = OptionList.objects.get_or_create(slug='service_management-service_types', defaults={'name':'Service Types'})
    st, _ = OptionListItem.objects.get_or_create(name="Type1", slug="type1", option_list=st_ol)
    
    program = ServiceProgram.objects.create(
        name="List Program",
        description="desc",
        start_date=date.today(),
        status="draft",
        created_by=test_user
    )
    program.service_types.add(st)
    response = auth_client.get("/service-management/programs/", user=test_user)
    assert response.status_code == 200
    data = response.json()
    assert any(p["name"] == "List Program" for p in data)

@pytest.mark.django_db
def test_retrieve_service_program(auth_client, test_user):
    st_ol, _ = OptionList.objects.get_or_create(slug='service_management-service_types', defaults={'name':'Service Types'})
    st, _ = OptionListItem.objects.get_or_create(name="Type1", slug="type1", option_list=st_ol)
    
    program = ServiceProgram.objects.create(
        name="Retrieve Program",
        description="desc",
        start_date=date.today(),
        status="draft",
        created_by=test_user
    )
    program.service_types.add(st)
    response = auth_client.get(f"/service-management/programs/{str(program.id)}/", user=test_user)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Retrieve Program"

@pytest.mark.django_db
def test_update_service_program(auth_client, test_user, staff_user_1):
    st_ol, _ = OptionList.objects.get_or_create(slug='service_management-service_types', defaults={'name':'Service Types'})
    st, _ = OptionListItem.objects.get_or_create(name="Type1", slug="type1", option_list=st_ol)
    
    program = ServiceProgram.objects.create(name="Update Program", description="desc", start_date=date.today(), status="draft", created_by=test_user)
    program.service_types.add(st)
    
    # For PUT, provide the full resource representation
    # Get existing values for fields not being explicitly updated
    existing_service_types_ids = [st_item.id for st_item in program.service_types.all()]
    # Add other M2M fields if they are part of ServiceProgramIn and meant to be updated via PUT
    # e.g., delivery_modes, locations, funding_agencies, cultural_groups

    payload = {
        "name": "Updated Name", 
        "description": "Updated desc",
        "start_date": str(program.start_date), # Required by ServiceProgramIn
        "status": program.status, # Required by ServiceProgramIn (even if optional, good to provide for PUT)
        "service_types": existing_service_types_ids, # Required by ServiceProgramIn (empty list if none)
        # Include other fields from ServiceProgramIn as needed, using existing values or new ones
        # "end_date": str(program.end_date) if program.end_date else None,
        # "delivery_modes": [], 
        # "locations": [],
        # "funding_agencies": [],
        # "cultural_groups": [],
        "staff_input": [
            {"staff_id": str(staff_user_1.id), "role": "Lead Developer", "fte": 0.8, "is_responsible": False, "start_date": "2025-02-01"}
        ],
        # "extra_data": program.extra_data
    }
    response = auth_client.put(f"/service-management/programs/{program.id}/", json=payload, user=test_user)
    assert response.status_code == 200, response.json()
    data = response.json()
    assert data["name"] == "Updated Name"
    assert len(data["staff"]) == 1
    assert data["staff"][0]["staff_id"] == staff_user_1.id
    assert data["staff"][0]["role"] == "Lead Developer"
    # Optionally, assert updated_by if schema exposes it or check DB
    program.refresh_from_db()
    assert program.updated_by_id == test_user.id

@pytest.mark.django_db
def test_delete_service_program(auth_client, test_user):
    st_ol, _ = OptionList.objects.get_or_create(slug='service_management-service_types', defaults={'name':'Service Types'})
    st, _ = OptionListItem.objects.get_or_create(name="Type1", slug="type1", option_list=st_ol)
    
    program = ServiceProgram.objects.create(name="Delete Program", description="desc", start_date=date.today(), status="draft", created_by=test_user)
    program.service_types.add(st)
    
    response = auth_client.delete(f"/service-management/programs/{program.id}/", user=test_user)
    assert response.status_code == 204
    
    # Confirm soft deletion by checking the flag directly, or expect 404 from default manager
    program.refresh_from_db()
    assert program.is_deleted is True
    assert program.deleted_by_id == test_user.id
    
    response2 = auth_client.get(f"/service-management/programs/{program.id}/", user=test_user)
    assert response2.status_code == 404 # Default list/retrieve should not show soft-deleted

@pytest.mark.django_db
def test_list_programs_with_full_details(auth_client, test_user, staff_user_1):
    # This test combines setup from the original delete test's latter part and list assertions
    st_ol, _ = OptionList.objects.get_or_create(slug='service_management-service_types', defaults={'name':'Service Types'})
    st_item, _ = OptionListItem.objects.get_or_create(name="Test Service Type", slug="test-service-type", option_list=st_ol)

    loc_ol, _ = OptionList.objects.get_or_create(slug='service_management-locations', defaults={'name':'Locations'})
    loc_item, _ = OptionListItem.objects.get_or_create(name="Test Location", slug="test-loc", option_list=loc_ol)

    fa_ol, _ = OptionList.objects.get_or_create(slug='service_management-funding_agencies', defaults={'name':'Funding Agencies'})
    fa_item, _ = OptionListItem.objects.get_or_create(name="Test Funding Agency", slug="test-fund", option_list=fa_ol)

    dm_ol, _ = OptionList.objects.get_or_create(slug='service_management-delivery_modes', defaults={'name':'Delivery Modes'})
    dm_item, _ = OptionListItem.objects.get_or_create(name="In Person", slug="in-person", option_list=dm_ol)

    program = ServiceProgram.objects.create(
        name="Detailed List Program",
        description="A program with all associations for listing.",
        start_date=date.today(),
        status="operational",
        created_by=test_user
    )
    program.service_types.set([st_item])
    program.delivery_modes.set([dm_item])
    program.locations.set([loc_item])

    from apps.service_management.models import ServiceProgramFunding, ServiceAssignedStaff
    ServiceProgramFunding.objects.create(
        service_program=program,
        funding_agency=fa_item,
        start_date=program.start_date,
    )
    ServiceAssignedStaff.objects.create(
        service_program=program,
        staff=staff_user_1,
        role="Coordinator",
        fte=1.0,
        is_responsible=True,
        start_date=date.today(),
        created_by=test_user # Assuming your BaseModel tracks created_by
    )

    response = auth_client.get("/service-management/programs/", user=test_user)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    
    found_program = None
    for p_data in data:
        if p_data["id"] == str(program.id):
            found_program = p_data
            break
    
    assert found_program is not None, "Detailed List Program not found in API response"
    assert found_program["name"] == "Detailed List Program"
    assert str(st_item.id) in [str(item['id']) for item in found_program["service_types"]]
    assert str(dm_item.id) in [str(item['id']) for item in found_program["delivery_modes"]]
    assert str(loc_item.id) in [str(item['id']) for item in found_program["locations"]]
    assert len(found_program["staff"]) == 1
    assert found_program["staff"][0]["staff_id"] == staff_user_1.id
    assert found_program["staff"][0]["role"] == "Coordinator"
    assert len(found_program["funding_agencies"]) == 1 # Assuming funding_agencies is part of schema
    assert found_program["funding_agencies"][0]["id"] == fa_item.id

@pytest.mark.django_db
def test_get_batch_option_lists_api(auth_client, test_user):
    # Ensure some option lists and items exist that we expect to retrieve
    st_ol, _ = OptionList.objects.get_or_create(slug='service_management-service_types', defaults={'name':'Service Types'})
    st_item1, _ = OptionListItem.objects.get_or_create(option_list=st_ol, slug='st-online', defaults={'name':'Online Support'})
    st_item2, _ = OptionListItem.objects.get_or_create(option_list=st_ol, slug='st-inperson', defaults={'name':'In-Person Support'})

    dm_ol, _ = OptionList.objects.get_or_create(slug='service_management-delivery_modes', defaults={'name':'Delivery Modes'})
    dm_item1, _ = OptionListItem.objects.get_or_create(option_list=dm_ol, slug='dm-remote', defaults={'name':'Remote Delivery'})

    en_stat_ol, _ = OptionList.objects.get_or_create(slug='enrolment-status', defaults={'name':'Enrolment Status'})
    en_stat_item1, _ = OptionListItem.objects.get_or_create(option_list=en_stat_ol, slug='en-active', defaults={'name':'Active Enrolment'})

    slugs_to_fetch = [
        'service_management-service_types',
        'service_management-delivery_modes',
        'enrolment-status',
        'non_existent_slug' # Test how non-existent slugs are handled
    ]

    response = auth_client.get("/service-management/options/batch/", params={"slugs": slugs_to_fetch}, user=test_user)
    assert response.status_code == 200, response.json()
    data = response.json()

    # Assertions now use keys corresponding to BatchOptionListsOut field names
    assert 'service_types' in data
    assert len(data['service_types']) >= 2, "Should have at least 2 service type items"
    assert any(item['slug'] == 'st-online' for item in data['service_types'])
    assert any(item['slug'] == 'st-inperson' for item in data['service_types'])

    assert 'delivery_modes' in data
    assert len(data['delivery_modes']) >= 1, "Should have at least 1 delivery mode item"
    assert any(item['slug'] == 'dm-remote' for item in data['delivery_modes'])

    assert 'locations' in data # locations is always returned, even if empty
    assert len(data['locations']) == 0, "Locations should be empty as no data was set up for its slug"

    # 'enrolment-status' is no longer part of the fixed response from this endpoint
    # as it's not in BatchOptionListsOut schema.
    # If it needs to be, it must be added to BatchOptionListsOut and the service's slug_map.
    assert 'enrolment-status' not in data # This slug is not a field name in BatchOptionListsOut

    # The 'slugs' param in the GET request is now ignored by the endpoint.
    # The service fetches a predefined set of option lists.
    assert 'non_existent_slug' not in data # This slug is not a field name in BatchOptionListsOut
