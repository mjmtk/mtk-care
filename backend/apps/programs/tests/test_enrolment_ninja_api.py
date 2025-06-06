import pytest
from uuid import uuid4
from datetime import date, timedelta

from ninja.testing import TestClient
from django.contrib.auth import get_user_model

from api.ninja import api # Main Ninja API instance
from apps.optionlists.models import OptionList, OptionListItem
from apps.service_management.models import ServiceProgram, Enrolment, ServiceAssignedStaff
from apps.client_management.models import Client # Import Client model

User = get_user_model()

# --- Pytest Fixtures ---
@pytest.fixture
def test_user(db):
    user, created = User.objects.get_or_create(
        username="testrequestuser", 
        defaults={'email': "testrequestuser@example.com", 'first_name': "Requesting", 'last_name': "User"}
    )
    # Ensure password is set for login attempts
    user.set_password("testpassword")
    user.save()
    user.refresh_from_db() # Ensure all fields are current
    return user

@pytest.fixture
def client_user_to_enroll(db, test_user): # Added test_user dependency
    # Get or create the 'Active' status for clients
    client_status_ol, _ = OptionList.objects.get_or_create(slug='client-statuses', defaults={'name': 'Client Statuses'})
    active_status, _ = OptionListItem.objects.get_or_create(option_list=client_status_ol, slug='active', defaults={'name': 'Active'})

    # Use a unique email or identifier for get_or_create to avoid conflicts if username is not on Client model
    client_email = "client.fixture@example.com"
    client_first_name = "ClientFixture"
    client_last_name = "UserToEnroll"

    client_record, created = Client.objects.get_or_create(
        email=client_email, # Assuming email can be a unique identifier for testing
        defaults={
            'first_name': client_first_name,
            'last_name': client_last_name,
            'date_of_birth': date(1990, 1, 1),
            'status': active_status,
            'created_by': test_user, # Set created_by
            'updated_by': test_user  # Set updated_by as well
        }
    )
    # If not created, ensure essential fields are what we expect for the test, or update them.
    # For simplicity, we'll rely on get_or_create finding or making one based on email.
    # If specific fields need to be updated on an existing record for a test, handle that explicitly.

    client_record.refresh_from_db()
    return client_record

@pytest.fixture
def service_program_for_enrollment(db, test_user):
    st_ol, _ = OptionList.objects.get_or_create(slug='service_management-service_types', defaults={'name': 'Service Types'})
    st_item, _ = OptionListItem.objects.get_or_create(name="General Support", slug="general-support", option_list=st_ol)
    
    program = ServiceProgram.objects.create(
        name="Test Program for Enrolment",
        description="A program to test enrolments.",
        start_date=date.today() - timedelta(days=30),
        status="active",
        created_by=test_user
    )
    program.service_types.add(st_item)
    return program

@pytest.fixture
def auth_client(): # test_user is not needed here, will be passed per request
    return TestClient(api)

# --- Enrolment API Test Functions ---

@pytest.mark.django_db
def test_create_enrolment(auth_client, test_user, client_user_to_enroll, service_program_for_enrollment):
    enroll_status_ol, _ = OptionList.objects.get_or_create(slug='enrolment-status', defaults={'name': 'Enrolment Status'})
    enrolled_status, _ = OptionListItem.objects.get_or_create(name='Enrolled', slug='enrolled', option_list=enroll_status_ol)

    payload = {
        "client_id": str(client_user_to_enroll.id),
        "service_program_id": str(service_program_for_enrollment.id),
        "enrolment_date": str(date.today()),
        "start_date": str(date.today()), # EnrolmentIn requires start_date
        "status": enrolled_status.slug, # Use status slug as per EnrolmentIn
        "notes": "Initial enrolment notes."
    }

    response = auth_client.post("/service-management/enrolments/", json=payload, user=test_user)

    assert response.status_code == 201, response.json()
    data = response.json()

    assert data["client_id"] == str(client_user_to_enroll.id) # EnrolmentOut has client_id directly
    assert data["service_program_id"] == str(service_program_for_enrollment.id) # EnrolmentOut has service_program_id directly
    assert data["enrolment_date"] == str(date.today())
    assert data["status"]["slug"] == enrolled_status.slug
    assert data["status"]["id"] == enrolled_status.id
    assert data["status"]["name"] == enrolled_status.name # EnrolmentOut returns status slug
    assert data["notes"] == "Initial enrolment notes."

    # Verify in DB
    enrolment_instance = Enrolment.objects.get(id=data['id'])
    assert enrolment_instance.created_by_id == test_user.id
    assert enrolment_instance.updated_by_id == test_user.id
    assert enrolment_instance.client_id == client_user_to_enroll.id
    assert enrolment_instance.service_program_id == service_program_for_enrollment.id

@pytest.mark.django_db
def test_list_enrolments(auth_client, test_user, client_user_to_enroll, service_program_for_enrollment):
    enroll_status_ol, _ = OptionList.objects.get_or_create(slug='enrolment-status', defaults={'name': 'Enrolment Status'})
    enrolled_status, _ = OptionListItem.objects.get_or_create(name='Enrolled', slug='enrolled', option_list=enroll_status_ol)

    Enrolment.objects.create(
        client=client_user_to_enroll,
        service_program=service_program_for_enrollment,
        enrolment_date=date.today(),
        start_date=date.today(), # Added missing start_date
        status=enrolled_status,
        created_by=test_user,
        updated_by=test_user
    )

    response = auth_client.get("/service-management/enrolments/", user=test_user)
    assert response.status_code == 200, response.json()
    data = response.json()
    assert len(data) >= 1
    # Find the created enrolment in the list
    retrieved_enrolment = next((e for e in data if e["client_id"] == str(client_user_to_enroll.id) and e["service_program_id"] == str(service_program_for_enrollment.id)), None)
    assert retrieved_enrolment is not None, "Created enrolment not found in list"
    assert retrieved_enrolment["status"]["slug"] == enrolled_status.slug
    assert retrieved_enrolment["status"]["id"] == enrolled_status.id
    assert retrieved_enrolment["status"]["name"] == enrolled_status.name

@pytest.mark.django_db
def test_retrieve_enrolment(auth_client, test_user, client_user_to_enroll, service_program_for_enrollment):
    enroll_status_ol, _ = OptionList.objects.get_or_create(slug='enrolment-status', defaults={'name': 'Enrolment Status'})
    enrolled_status, _ = OptionListItem.objects.get_or_create(name='Enrolled', slug='enrolled', option_list=enroll_status_ol)

    enrolment = Enrolment.objects.create(
        client=client_user_to_enroll,
        service_program=service_program_for_enrollment,
        enrolment_date=date.today(),
        start_date=date.today(),  # Ensure this line is present and correct
        status=enrolled_status,
        notes="Original notes for retrieval.",  # Ensure notes are specific to this test
        created_by=test_user,
        updated_by=test_user
    )

    response = auth_client.get(f"/service-management/enrolments/{enrolment.id}/", user=test_user)
    assert response.status_code == 200, response.json()
    data = response.json()
    assert data["id"] == str(enrolment.id)
    assert data["client_id"] == str(client_user_to_enroll.id)
    assert data["notes"] == "Original notes for retrieval."
    assert data["status"]["slug"] == enrolled_status.slug
    assert data["status"]["id"] == enrolled_status.id
    assert data["status"]["name"] == enrolled_status.name

@pytest.mark.django_db
def test_update_enrolment(auth_client, test_user, client_user_to_enroll, service_program_for_enrollment):
    enroll_status_ol, _ = OptionList.objects.get_or_create(slug='enrolment-status', defaults={'name': 'Enrolment Status'})
    enrolled_status, _ = OptionListItem.objects.get_or_create(name='Enrolled', slug='enrolled', option_list=enroll_status_ol)
    discharged_status, _ = OptionListItem.objects.get_or_create(name='Discharged', slug='discharged', option_list=enroll_status_ol)

    existing_enrolment = Enrolment.objects.create(
        client=client_user_to_enroll,
        service_program=service_program_for_enrollment,
        enrolment_date=date.today() - timedelta(days=1), # ensure it's distinct for update if needed
        start_date=date.today() - timedelta(days=1), # Added missing start_date and made distinct
        status=enrolled_status,
        notes="Original notes for update.", # Keep notes specific for update test
        created_by=test_user,
        updated_by=test_user
    )

    payload = {
        "client_id": str(existing_enrolment.client_id),
        "service_program_id": str(existing_enrolment.service_program_id),
        "enrolment_date": str(existing_enrolment.enrolment_date),
        "start_date": str(existing_enrolment.start_date),
        "notes": "Updated notes for the enrolment.",
        "status": discharged_status.slug, # Use slug for status
        "end_date": str(date.today() + timedelta(days=1)), # Use end_date
        # Optional fields can be included if needed, e.g., exit_reason_id, exit_notes
        # "exit_reason_id": existing_enrolment.exit_reason_id,
        # "exit_notes": existing_enrolment.exit_notes,
        # "extra_data": existing_enrolment.extra_data
    }

    response = auth_client.put(f"/service-management/enrolments/{existing_enrolment.id}/", json=payload, user=test_user)
    assert response.status_code == 200, response.json()
    data = response.json()

    assert data["notes"] == "Updated notes for the enrolment."
    assert data["status"]["slug"] == discharged_status.slug # Check slug in status object
    assert data["end_date"] == str(date.today() + timedelta(days=1)) # Check end_date

    existing_enrolment.refresh_from_db()
    assert existing_enrolment.updated_by_id == test_user.id
    assert existing_enrolment.notes == "Updated notes for the enrolment."

@pytest.mark.django_db
def test_delete_enrolment(auth_client, test_user, client_user_to_enroll, service_program_for_enrollment):
    enroll_status_ol, _ = OptionList.objects.get_or_create(slug='enrolment-status', defaults={'name': 'Enrolment Status'})
    enrolled_status, _ = OptionListItem.objects.get_or_create(name='Enrolled', slug='enrolled', option_list=enroll_status_ol)

    enrolment_to_delete = Enrolment.objects.create(
        client=client_user_to_enroll,
        service_program=service_program_for_enrollment,
        enrolment_date=date.today(),
        start_date=date.today(), # Added missing start_date
        status=enrolled_status,
        created_by=test_user,
        updated_by=test_user
    )

    response = auth_client.delete(f"/service-management/enrolments/{enrolment_to_delete.id}/", user=test_user)
    assert response.status_code == 204, response.content

    enrolment_to_delete.refresh_from_db()
    assert enrolment_to_delete.is_deleted
    assert enrolment_to_delete.deleted_by_id == test_user.id

    # Verify it's not retrievable via GET after soft delete
    response_get = auth_client.get(f"/service-management/enrolments/{enrolment_to_delete.id}/")
    assert response_get.status_code == 404
