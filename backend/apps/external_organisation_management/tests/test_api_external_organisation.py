import pytest
import uuid
from ninja.testing import TestClient

# NOTE ON TESTING AUDIT FIELDS (created_by, updated_by, deleted_by):
# The API endpoints for create, update, and delete operations for ExternalOrganisations
# rely on `request.user` being passed to their respective service functions to populate
# audit fields (e.g., `created_by`, `updated_by`, `deleted_by`).
#
# When using Django Ninja's TestClient with the `auth=test_user` parameter,
# the `request.user` object within the API view becomes a `unittest.mock.Mock` instance,
# rather than the actual `test_user` (User model instance) fixture.
#
# If this Mock object were passed down to the service layer and then to the model's
# `save()` or `delete()` methods, it would not correctly populate the audit fields
# which expect a real User instance (or at least an object with a valid `id`).
#
# To address this for testing purposes and ensure the audit fields are correctly
# set to our `test_user`, we employ a patching strategy:
# 1. The actual service function (e.g., `services.external_organisation_create`) is imported.
# 2. A mock wrapper function is defined within the test (e.g., `mock_service_create_for_api`).
#    This wrapper accepts the same arguments as the actual service function.
# 3. Crucially, this wrapper calls the *actual* service function but explicitly passes
#    our `test_user` fixture as the `user` argument, ignoring the `Mock` object that
#    `request.user` would have been.
# 4. `mocker.patch` is used to replace the service function *as it's imported and used
#    within the API module* (e.g., 'apps.external_organisation_management.api_external_organisation_crud.external_organisation_create')
#    with our `mock_service_create_for_api` wrapper using `side_effect`.
#
# This ensures that the end-to-end test via `client.post/put/delete` correctly
# reflects the scenario where a real authenticated user's actions lead to populated audit fields.
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.external_organisation_management.models import ExternalOrganisation
from apps.external_organisation_management.schemas import ExternalOrganisationSchemaIn
from apps.external_organisation_management.services import external_organisation_create, external_organisation_update as actual_service_update, external_organisation_delete
from apps.optionlists.models import OptionList, OptionListItem
from .conftest import ext_org_type_option_list, service_provider_type as global_service_provider_type # Import the global list and a specific type
User = get_user_model()
# client = TestClient(external_org_router) # Replaced with api_client fixture


@pytest.fixture
def test_user(db):
    user, _ = User.objects.get_or_create(
        username="testuser_audit",
        defaults={'email': "testaudit@example.com", 'first_name': "Test", 'last_name': "User"}
    )
    if not user.has_usable_password():
        user.set_password("password")
        user.save()
    return user


@pytest.fixture
def organisation_type_optionlist_item(global_service_provider_type):
    # This fixture now correctly depends on global_service_provider_type (which is service_provider_type from conftest).
    # Pytest will execute service_provider_type and pass its result (the OptionListItem instance) here.
    return global_service_provider_type


@pytest.mark.django_db
def test_create_external_organisation(django_api_client, organisation_type_optionlist_item, test_user, mocker): # Added mocker
    payload = {
        "name": "Awesome Org Inc.",
        "type_id": organisation_type_optionlist_item.id,
        "phone": "1234567890",
        "email": "contact@awesome.org",
        "address": "123 Awesome St",
        "is_active": True
    }
    
    # Patch the create service used by the API to ensure it uses test_user, bypassing request.user issue
    def mock_service_create_for_api(payload, user):
        # The 'user' argument here would be request.user (the mock), we ignore it
        return external_organisation_create(payload=payload, user=test_user) # Force test_user

    mocker.patch(
        'apps.external_organisation_management.api_external_organisation_crud.external_organisation_create',
        side_effect=mock_service_create_for_api
    )

    django_api_client.force_login(test_user)
    response = django_api_client.post("/api/external-organisations/", data=payload, content_type='application/json')
    
    assert response.status_code == 201, response.content
    created_org_data = response.json()
    
    assert created_org_data["name"] == "Awesome Org Inc."
    assert "id" in created_org_data
    assert uuid.UUID(created_org_data["id"])
    assert created_org_data["type"]["id"] == organisation_type_optionlist_item.id

    db_org = ExternalOrganisation.objects.get(id=created_org_data["id"])
    assert db_org.created_by_id == test_user.id
    assert db_org.updated_by_id == test_user.id
    assert db_org.deleted_by_id is None


@pytest.mark.django_db
def test_list_external_organisations(django_api_client, organisation_type_optionlist_item, test_user):
    org_data_1 = ExternalOrganisationSchemaIn(
        name="Org Alpha",
        type_id=organisation_type_optionlist_item.id,
        is_active=True
    )
    org_1 = external_organisation_create(payload=org_data_1, user=test_user)

    org_data_2 = ExternalOrganisationSchemaIn(
        name="Org Beta",
        type_id=organisation_type_optionlist_item.id,
        is_active=False
    )
    org_2 = external_organisation_create(payload=org_data_2, user=test_user)

    django_api_client.force_login(test_user) # Assuming list might be protected or to be consistent
    response = django_api_client.get("/api/external-organisations/")
    assert response.status_code == 200, response.content
    organisations_data = response.json()
    
    assert len(organisations_data) >= 2
    
    org_ids_from_response = {org['id'] for org in organisations_data}
    assert str(org_1.id) in org_ids_from_response
    assert str(org_2.id) in org_ids_from_response

    org_names_from_response = {org['name'] for org in organisations_data}
    assert org_1.name in org_names_from_response
    assert org_2.name in org_names_from_response


@pytest.mark.django_db
def test_get_external_organisation_by_id(django_api_client, organisation_type_optionlist_item, test_user):
    org_data = ExternalOrganisationSchemaIn(
        name="Test Org for Get",
        type_id=organisation_type_optionlist_item.id,
        phone="1234567890",
        email="get@test.com",
        address="123 Get St"
    )
    created_org = external_organisation_create(payload=org_data, user=test_user)

    django_api_client.force_login(test_user)
    response = django_api_client.get(f"/api/external-organisations/{created_org.id}/")
    assert response.status_code == 200, response.content
    response_data = response.json()
    assert response_data['id'] == str(created_org.id)
    assert response_data['name'] == "Test Org for Get"
    assert response_data['email'] == "get@test.com"
    assert response_data['type']['id'] == organisation_type_optionlist_item.id
    print(f"Actual slug repr: {repr(response_data['type']['slug'])}, Expected slug repr: {repr('service-provider')}")
    assert response_data['type']['slug'].strip() == "service-provider".strip()

    non_existent_uuid = uuid.uuid4()
    response_not_found = django_api_client.get(f"/api/external-organisations/{non_existent_uuid}/")
    assert response_not_found.status_code == 404
    assert response_not_found.json()['detail'] == "External Organisation not found"


@pytest.mark.django_db
def test_update_external_organisation(django_api_client, organisation_type_optionlist_item, test_user, mocker): # Added mocker
    initial_org_data = ExternalOrganisationSchemaIn(
        name="Initial Org Name",
        type_id=organisation_type_optionlist_item.id,
        email="initial@example.com",
        is_active=True
    )
    created_org = external_organisation_create(payload=initial_org_data, user=test_user)
    original_created_by_id = created_org.created_by_id
    original_created_at = created_org.created_at
    original_updated_at = created_org.updated_at

    # Patch the update service used by the API to ensure it uses test_user
    def mock_service_update_for_api(organisation_id, payload, user):
        # The 'user' argument here would be request.user (the mock), we ignore it
        return actual_service_update(organisation_id=organisation_id, payload=payload, user=test_user) # Force test_user

    mocker.patch(
        'apps.external_organisation_management.api_external_organisation_crud.external_organisation_update',
        side_effect=mock_service_update_for_api
    )

    update_payload = {
        "name": "Updated Org Name",
        "type_id": organisation_type_optionlist_item.id,
        "email": "updated@example.com",
        "phone": "0987654321",
        "address": "456 Updated St",
        "is_active": False
    }

    django_api_client.force_login(test_user)
    response = django_api_client.put(f"/api/external-organisations/{created_org.id}/", data=update_payload, content_type='application/json')
    assert response.status_code == 200, response.content
    updated_org_data = response.json()

    assert updated_org_data['id'] == str(created_org.id)
    assert updated_org_data['name'] == "Updated Org Name"
    assert updated_org_data['email'] == "updated@example.com"
    assert updated_org_data['phone'] == "0987654321"
    assert updated_org_data['address'] == "456 Updated St"
    assert updated_org_data['is_active'] is False
    assert updated_org_data['type']['id'] == organisation_type_optionlist_item.id

    db_org = ExternalOrganisation.objects.get(id=created_org.id)
    assert db_org.name == "Updated Org Name"
    assert db_org.is_active is False
    assert db_org.updated_by_id == test_user.id
    assert db_org.created_by_id == original_created_by_id
    assert db_org.created_at == original_created_at
    assert db_org.updated_at > original_updated_at

    non_existent_uuid = uuid.uuid4()
    response_not_found = django_api_client.put(f"/api/external-organisations/{non_existent_uuid}/", data=update_payload, content_type='application/json')
    assert response_not_found.status_code == 404
    assert response_not_found.json()['detail'] == "External Organisation not found"

    invalid_type_payload = update_payload.copy()
    invalid_type_id = 9999999
    invalid_type_payload['type_id'] = invalid_type_id
    response_invalid_type = django_api_client.put(f"/api/external-organisations/{created_org.id}/", data=invalid_type_payload, content_type='application/json')
    assert response_invalid_type.status_code == 400
    assert response_invalid_type.json()['detail'] == f"Invalid new type_id: {invalid_type_id}. Organisation type not found."


@pytest.mark.django_db
def test_delete_external_organisation(django_api_client, organisation_type_optionlist_item, test_user, mocker): # Added mocker
    org_to_delete_data = ExternalOrganisationSchemaIn(
        name="Org To Delete",
        type_id=organisation_type_optionlist_item.id,
        email="delete_me@example.com"
    )
    created_org = external_organisation_create(payload=org_to_delete_data, user=test_user)
    org_id_to_delete = created_org.id
    original_updated_at = created_org.updated_at

    # Patch the delete service used by the API to ensure it uses test_user
    # 'external_organisation_delete' is already imported from services
    def mock_service_delete_for_api(organisation_id, user):
        # The 'user' argument here would be request.user (the mock), we ignore it
        return external_organisation_delete(organisation_id=organisation_id, user=test_user) # Force test_user

    mocker.patch(
        'apps.external_organisation_management.api_external_organisation_crud.external_organisation_delete',
        side_effect=mock_service_delete_for_api
    )

    assert ExternalOrganisation.objects.filter(id=org_id_to_delete).exists()
    assert not ExternalOrganisation.all_objects.get(id=org_id_to_delete).is_deleted

    django_api_client.force_login(test_user)
    response = django_api_client.delete(f"/api/external-organisations/{org_id_to_delete}/") 
    assert response.status_code == 204, response.content

    assert not ExternalOrganisation.objects.filter(id=org_id_to_delete).exists()

    deleted_db_org = ExternalOrganisation.all_objects.get(id=org_id_to_delete)
    assert deleted_db_org is not None
    assert deleted_db_org.is_deleted is True
    assert deleted_db_org.deleted_at is not None
    assert deleted_db_org.deleted_by_id == test_user.id
    assert deleted_db_org.updated_by_id == test_user.id # Soft delete also updates 'updated_by'
    assert deleted_db_org.deleted_at <= timezone.now() # Keep this existing useful assertion
    assert deleted_db_org.updated_at > original_updated_at

    non_existent_uuid = uuid.uuid4()
    response_not_found = django_api_client.delete(f"/api/external-organisations/{non_existent_uuid}/")
    assert response_not_found.status_code == 404
    assert response_not_found.json()['detail'] == "External Organisation not found"

@pytest.mark.django_db
def test_get_batch_dropdowns_external_org(django_api_client, organisation_type_optionlist_item, test_user):
    """
    Tests the GET /api/external-organisations/batch-dropdowns/ endpoint.
    """
    django_api_client.force_login(test_user) # Assuming endpoint might require auth, good practice
    response = django_api_client.get("/api/external-organisations/batch-dropdowns/")
    
    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}. Response: {response.content}"
    data = response.json()
    
    assert "external_organisation_types" in data, "Response missing 'external_organisation_types' key"
    assert isinstance(data["external_organisation_types"], list), "'external_organisation_types' should be a list"
    
    # Ensure at least one type is returned if fixtures are set up and active
    # The organisation_type_optionlist_item fixture provides an active 'service-provider' type
    assert len(data["external_organisation_types"]) > 0, "Expected at least one organisation type"

    found_type = False
    for item in data["external_organisation_types"]:
        if item.get("id") == organisation_type_optionlist_item.id:
            assert item.get("slug") == organisation_type_optionlist_item.slug
            assert item.get("name") == organisation_type_optionlist_item.name
            # The ExtOrgDropdownItemOut schema uses 'label' which defaults to 'name' if OptionListItem.label is None or empty.
            # The fixture 'service_provider_type' (which is organisation_type_optionlist_item) has label="Service Provider".
            expected_label = organisation_type_optionlist_item.label if organisation_type_optionlist_item.label else organisation_type_optionlist_item.name
            assert item.get("label") == expected_label
            found_type = True
            break
    assert found_type, f"Expected organisation type (id: {organisation_type_optionlist_item.id}, slug: {organisation_type_optionlist_item.slug}) not found in batch dropdowns"


# TODO: Add further error cases (400 if applicable) if any other logic paths emerge
