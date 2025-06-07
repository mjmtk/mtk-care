import pytest
from django.urls import reverse
from ninja.testing import TestClient
from api.ninja import api
from django.contrib.auth import get_user_model
from apps.referral_management.models import Referral
from apps.optionlists.models import OptionList, OptionListItem
from apps.client_management.models import Client
import uuid
from datetime import date, timedelta


@pytest.fixture
def client():
    return TestClient(api)

def test_print_ninja_routes(client):
    print("--- test_print_ninja_routes START ---")
    print(f"Imported api object: {api}")
    print(f"ID of imported api object: {id(api)}")
    if hasattr(api, '_routers'):
        print(f"Length of api._routers: {len(api._routers)}")
        print(f"api._routers content: {api._routers}")
        for prefix, router_instance in api._routers:
            print(f'Inspecting Router Prefix: {prefix}, Type: {type(router_instance)}, Router ID: {id(router_instance)}')
        if hasattr(router_instance, 'path_operations') and router_instance.path_operations:
            num_path_views = len(router_instance.path_operations)
            total_ops = 0
            all_ops_details = []
            for path_view in router_instance.path_operations.values():
                total_ops += len(path_view.operations)
                for op in path_view.operations:
                    all_ops_details.append(op.path)
            print(f'  Found path_operations. PathView count: {num_path_views}, Total operations: {total_ops}, Operations List ID: {id(router_instance.path_operations)}')
            for op_path in all_ops_details:
                print(f'    Registered Path: {prefix}{op_path}') # op_path is relative to the router_instance
        else:
            print(f'  path_operations not found or is empty on router {prefix}.')
    else:
        print("api object does not have _routers attribute.")
    print("--- test_print_ninja_routes END ---")

@pytest.mark.django_db
def test_super_simple_print(client):
    print("!!! HELLO FROM test_super_simple_print !!!")
    assert True

@pytest.mark.django_db
def test_create_referral(db, client):
    User = get_user_model()
    test_user, _ = User.objects.get_or_create(username='api_test_user_tcr', defaults={'email': 'api_test_user_tcr@example.com'})

    # Client-specific OptionLists and OptionListItems
    client_status_ol, _ = OptionList.objects.get_or_create(slug='client-statuses-tcr', defaults={'name':'Client Statuses TCR'})
    client_language_ol, _ = OptionList.objects.get_or_create(slug='client-languages-tcr', defaults={'name':'Client Languages TCR'})
    client_status_item, _ = OptionListItem.objects.get_or_create(option_list=client_status_ol, slug='active-tcr', defaults={'name':'Active TCR', 'label':'Active TCR'})
    client_language_item, _ = OptionListItem.objects.get_or_create(option_list=client_language_ol, slug='en-tcr', defaults={'name':'English TCR', 'label':'English TCR'})

    # Create Client model instance for the Referral
    test_model_client = Client.objects.create(
        first_name="ApiTestClientFNameTCR",
        last_name="ApiTestClientLNameTCR",
        date_of_birth=date.today() - timedelta(days=365*30),
        status=client_status_item,
        primary_language=client_language_item,
        created_by=test_user,
        updated_by=test_user
    )

    # Referral-specific OptionLists - using get_or_create and unique slugs for this test
    type_ol, _ = OptionList.objects.get_or_create(slug='referral-types-tcr', defaults={'name':'Referral Types TCR'})
    status_ol_obj, _ = OptionList.objects.get_or_create(slug='referral-statuses-tcr', defaults={'name':'Referral Statuses TCR'})
    priority_ol_obj, _ = OptionList.objects.get_or_create(slug='referral-priorities-tcr', defaults={'name':'Referral Priorities TCR'})
    service_type_ol_obj, _ = OptionList.objects.get_or_create(slug='referral-service-types-tcr', defaults={'name':'Referral Service Types TCR'})

    # Referral-specific OptionListItems - let DB assign IDs, use get_or_create
    st_ol, _ = OptionListItem.objects.get_or_create(option_list=type_ol, slug="type1-tcr", defaults={'name':"Type1 TCR"})
    status_ol, _ = OptionListItem.objects.get_or_create(option_list=status_ol_obj, slug="status1-tcr", defaults={'name':"Status1 TCR"})
    priority_ol, _ = OptionListItem.objects.get_or_create(option_list=priority_ol_obj, slug="priority1-tcr", defaults={'name':"Priority1 TCR"})
    service_type_ol, _ = OptionListItem.objects.get_or_create(option_list=service_type_ol_obj, slug="servicetype1-tcr", defaults={'name':"ServiceType1 TCR"})
    payload = {
        "client_id": str(test_model_client.id),
        "type": str(st_ol.id),
        "status": str(status_ol.id),
        "priority": str(priority_ol.id),
        "service_type": str(service_type_ol.id),
        "reason": "Test reason",
        "referral_date": str(date.today()),
        "client_type": "existing",
        "notes": "Test notes"
    }
    response = client.post("/referrals/", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["reason"] == "Test reason"
    assert str(data["type"]) == str(st_ol.id)
    assert str(data["status"]) == str(status_ol.id)
    assert str(data["priority"]) == str(priority_ol.id)
    assert str(data["service_type"]) == str(service_type_ol.id)
    assert "id" in data

@pytest.mark.django_db
def test_list_referrals(db, client):
    User = get_user_model()
    test_user, _ = User.objects.get_or_create(username='api_test_user_tlr', defaults={'email': 'api_test_user_tlr@example.com'})

    # Client-specific OptionLists and OptionListItems for this test
    client_status_ol_tlr, _ = OptionList.objects.get_or_create(slug='client-statuses-tlr', defaults={'name':'Client Statuses TLR'})
    client_language_ol_tlr, _ = OptionList.objects.get_or_create(slug='client-languages-tlr', defaults={'name':'Client Languages TLR'})
    client_status_item_tlr, _ = OptionListItem.objects.get_or_create(option_list=client_status_ol_tlr, slug='active-tlr', defaults={'name':'Active TLR', 'label':'Active TLR'})
    client_language_item_tlr, _ = OptionListItem.objects.get_or_create(option_list=client_language_ol_tlr, slug='en-tlr', defaults={'name':'English TLR', 'label':'English TLR'})

    # Create Client model instance for the Referral
    test_model_client_tlr = Client.objects.create(
        first_name="ApiTestClientFNameTLR",
        last_name="ApiTestClientLNameTLR",
        date_of_birth=date.today() - timedelta(days=365*32),
        status=client_status_item_tlr,
        primary_language=client_language_item_tlr,
        created_by=test_user,
        updated_by=test_user
    )

    # Referral-specific OptionLists - using get_or_create and unique slugs for this test
    type_ol_tlr, _ = OptionList.objects.get_or_create(slug='referral-types-tlr', defaults={'name':'Referral Types TLR'})
    status_ol_obj_tlr, _ = OptionList.objects.get_or_create(slug='referral-statuses-tlr', defaults={'name':'Referral Statuses TLR'})
    priority_ol_obj_tlr, _ = OptionList.objects.get_or_create(slug='referral-priorities-tlr', defaults={'name':'Referral Priorities TLR'})
    service_type_ol_obj_tlr, _ = OptionList.objects.get_or_create(slug='referral-service-types-tlr', defaults={'name':'Referral Service Types TLR'})

    # Referral-specific OptionListItems - let DB assign IDs, use get_or_create
    st_ol_tlr, _ = OptionListItem.objects.get_or_create(option_list=type_ol_tlr, slug="type1-tlr", defaults={'name':"Type1 TLR"})
    status_ol_tlr, _ = OptionListItem.objects.get_or_create(option_list=status_ol_obj_tlr, slug="status1-tlr", defaults={'name':"Status1 TLR"})
    priority_ol_tlr, _ = OptionListItem.objects.get_or_create(option_list=priority_ol_obj_tlr, slug="priority1-tlr", defaults={'name':"Priority1 TLR"})
    service_type_ol_tlr, _ = OptionListItem.objects.get_or_create(option_list=service_type_ol_obj_tlr, slug="servicetype1-tlr", defaults={'name':"ServiceType1 TLR"})

    ref_tlr = Referral.objects.create(
        client=test_model_client_tlr,
        created_by=test_user,
        updated_by=test_user,
        type=st_ol_tlr,
        status=status_ol_tlr,
        priority=priority_ol_tlr,
        service_type=service_type_ol_tlr,
        reason="Test reason",
        referral_date=date.today(),
        client_type="existing",
        notes="Test notes TLR"
    )
    response = client.get("/referrals/")
    assert response.status_code == 200
    data = response.json()
    # Ensure the created referral is in the list
    found_referral = False
    for item in data:
        if str(item["id"]) == str(ref_tlr.id):
            found_referral = True
            assert str(item["type"]) == str(st_ol_tlr.id)
            assert str(item["status"]) == str(status_ol_tlr.id)
            assert str(item["priority"]) == str(priority_ol_tlr.id)
            assert str(item["service_type"]) == str(service_type_ol_tlr.id)
            assert item["reason"] == "Test reason" # Assuming reason is consistent
            break
    assert found_referral, f"Referral with id {ref_tlr.id} not found in list response"

@pytest.mark.django_db
def test_retrieve_referral(db, client):
    from apps.optionlists.models import OptionList
    type_ol = OptionList.objects.create(id=21, slug='referral-types', name='Referral Types')
    status_ol_obj = OptionList.objects.create(id=22, slug='referral-statuses', name='Referral Statuses')
    priority_ol_obj = OptionList.objects.create(id=23, slug='referral-priorities', name='Referral Priorities')
    service_type_ol_obj = OptionList.objects.create(id=24, slug='referral-service-types', name='Referral Service Types')
    st_ol = OptionListItem.objects.create(name="Type1", slug="type1", option_list=type_ol)
    status_ol = OptionListItem.objects.create(name="Status1", slug="status1", option_list=status_ol_obj)
    priority_ol = OptionListItem.objects.create(name="Priority1", slug="priority1", option_list=priority_ol_obj)
    service_type_ol = OptionListItem.objects.create(name="ServiceType1", slug="servicetype1", option_list=service_type_ol_obj)
    ref = Referral.objects.create(
        type=st_ol,
        status=status_ol,
        priority=priority_ol,
        service_type=service_type_ol,
        reason="Test reason",
        referral_date=date.today(),
        client_type="existing",
        notes="Test notes"
    )
    response = client.get(f"/referrals/{ref.id}")
    assert response.status_code == 200
    data = response.json()
    assert str(data["id"]) == str(ref.id)
    assert str(data["type"]) == str(st_ol.id)
    assert data["reason"] == "Test reason"

@pytest.mark.django_db
def test_update_referral(db, client):
    User = get_user_model()
    test_user, _ = User.objects.get_or_create(username='api_test_user_tur', defaults={'email': 'api_test_user_tur@example.com'})

    # OptionLists and OptionListItems for Client
    client_status_ol, _ = OptionList.objects.get_or_create(slug='client-statuses-tur', defaults={'name':'Client Statuses TUR'})
    client_language_ol, _ = OptionList.objects.get_or_create(slug='client-languages-tur', defaults={'name':'Client Languages TUR'})
    client_status_item, _ = OptionListItem.objects.get_or_create(option_list=client_status_ol, slug='active-tur', defaults={'name':'Active TUR', 'label':'Active TUR'})
    client_language_item, _ = OptionListItem.objects.get_or_create(option_list=client_language_ol, slug='en-tur', defaults={'name':'English TUR', 'label':'English TUR'})

    # Create Client model instance
    test_model_client = Client.objects.create(
        first_name="ApiTestClientFNameTUR",
        last_name="ApiTestClientLNameTUR",
        date_of_birth=date.today() - timedelta(days=365*30),
        status=client_status_item,
        primary_language=client_language_item,
        created_by=test_user,
        updated_by=test_user
    )

    # Referral OptionLists
    type_ol, _ = OptionList.objects.get_or_create(slug='referral-types-tur', defaults={'name':'Referral Types TUR'})
    status_ol_obj, _ = OptionList.objects.get_or_create(slug='referral-statuses-tur', defaults={'name':'Referral Statuses TUR'})
    priority_ol_obj, _ = OptionList.objects.get_or_create(slug='referral-priorities-tur', defaults={'name':'Referral Priorities TUR'})
    service_type_ol_obj, _ = OptionList.objects.get_or_create(slug='referral-service-types-tur', defaults={'name':'Referral Service Types TUR'})

    # Initial Referral OptionListItems
    initial_type, _ = OptionListItem.objects.get_or_create(option_list=type_ol, slug="type-initial-tur", defaults={'name':"Type Initial TUR"})
    initial_status, _ = OptionListItem.objects.get_or_create(option_list=status_ol_obj, slug="status-initial-tur", defaults={'name':"Status Initial TUR"})
    initial_priority, _ = OptionListItem.objects.get_or_create(option_list=priority_ol_obj, slug="priority-initial-tur", defaults={'name':"Priority Initial TUR"})
    initial_service_type, _ = OptionListItem.objects.get_or_create(option_list=service_type_ol_obj, slug="service-initial-tur", defaults={'name':"Service Initial TUR"})

    # Create the initial referral
    referral_to_update = Referral.objects.create(
        client=test_model_client,
        created_by=test_user,
        updated_by=test_user,
        type=initial_type,
        status=initial_status,
        priority=initial_priority,
        service_type=initial_service_type,
        reason="Initial reason for update test",
        referral_date=date.today(),
        client_type="existing",
        notes="Initial notes for update test"
    )

    # New OptionListItem for status update
    updated_status_item, _ = OptionListItem.objects.get_or_create(option_list=status_ol_obj, slug="status-updated-tur", defaults={'name':"Status Updated TUR"})

    update_payload = {
        "reason": "Updated reason via PATCH",
        "notes": "Updated notes via PATCH",
        "status": str(updated_status_item.id)  # Send ID for FK update
    }

    response = client.patch(f"/referrals/{referral_to_update.id}", json=update_payload)

    assert response.status_code == 200, f"Expected 200, got {response.status_code}. Response: {response.content.decode()}"
    
    updated_data = response.json()
    assert str(updated_data["id"]) == str(referral_to_update.id)
    assert updated_data["reason"] == "Updated reason via PATCH"
    assert updated_data["notes"] == "Updated notes via PATCH"
    assert str(updated_data["status"]) == str(updated_status_item.id)

    # Verify in DB
    referral_from_db = Referral.objects.get(pk=referral_to_update.id)
    assert referral_from_db.reason == "Updated reason via PATCH"
    assert referral_from_db.notes == "Updated notes via PATCH"
    assert referral_from_db.status.id == updated_status_item.id

@pytest.mark.django_db
def test_retrieve_referral_detail_ninja(db, client):
    from apps.optionlists.models import OptionList, OptionListItem
    from datetime import date
    from uuid import uuid4

    User = get_user_model()
    test_user, _ = User.objects.get_or_create(username='ninja_tester', defaults={'email': 'ninja@example.com'})

    # Setup OptionLists - let DB assign IDs, use unique slugs for test isolation
    type_ol, _ = OptionList.objects.get_or_create(slug='referral-types-ninja-detail', defaults={'name':'Referral Types Ninja Detail'})
    status_ol, _ = OptionList.objects.get_or_create(slug='referral-statuses-ninja-detail', defaults={'name':'Referral Statuses Ninja Detail'})
    priority_ol, _ = OptionList.objects.get_or_create(slug='referral-priorities-ninja-detail', defaults={'name':'Referral Priorities Ninja Detail'})
    service_type_ol, _ = OptionList.objects.get_or_create(slug='referral-service-types-ninja-detail', defaults={'name':'Referral Service Types Ninja Detail'})

    # OptionListItems - let DB assign IDs, use get_or_create with slug and option_list for idempotency
    st_ol, _ = OptionListItem.objects.get_or_create(slug="type-ninja-detail", option_list=type_ol, defaults={'name':"TypeNinjaDetail"})
    status_item, _ = OptionListItem.objects.get_or_create(slug="pending-ninja-detail", option_list=status_ol, defaults={'name':"PendingNinjaDetail"})
    priority_item, _ = OptionListItem.objects.get_or_create(slug="high-ninja-detail", option_list=priority_ol, defaults={'name':"HighNinjaDetail"})
    service_type_item, _ = OptionListItem.objects.get_or_create(slug="servicea-ninja-detail", option_list=service_type_ol, defaults={'name':"ServiceANinjaDetail"})

    # Create Client for the Referral
    client_status_ol, _ = OptionList.objects.get_or_create(slug='client-statuses-ninja-detail', defaults={'name':'Client Statuses Ninja Detail'})
    client_language_ol, _ = OptionList.objects.get_or_create(slug='client-languages-ninja-detail', defaults={'name':'Client Languages Ninja Detail'})
    client_status_item, _ = OptionListItem.objects.get_or_create(option_list=client_status_ol, slug='active-ninja-detail', defaults={'name':'Active Ninja Detail', 'label':'Active Ninja Detail'})
    client_language_item, _ = OptionListItem.objects.get_or_create(option_list=client_language_ol, slug='en-ninja-detail', defaults={'name':'English Ninja Detail', 'label':'English Ninja Detail'})

    test_client = Client.objects.create(
        first_name="NinjaClientFName",
        last_name="NinjaClientLName",
        date_of_birth=date.today() - timedelta(days=365*25),
        status=client_status_item,
        primary_language=client_language_item,
        created_by=test_user,
        updated_by=test_user
    )

    # Create Referral with audit fields
    ref = Referral.objects.create(
        type=st_ol,
        status=status_item,
        priority=priority_item,
        service_type=service_type_item,
        reason="Retrieve Ninja Referral",
        referral_date=date.today(),
        client=test_client, # Assign the created client
        client_type="existing", 
        notes="Testing retrieve",
        created_by=test_user,
        updated_by=test_user
    )

    response = client.get(f"/referrals/{ref.id}")
    assert response.status_code == 200
    data = response.json()
    assert str(data["id"]) == str(ref.id)
    assert data["reason"] == "Retrieve Ninja Referral"
    # Assertions for type, status, priority, service_type IDs
    assert str(data["type"]) == str(st_ol.id) 
    assert str(data["status"]) == str(status_item.id)
    assert str(data["priority"]) == str(priority_item.id)
    assert str(data["service_type"]) == str(service_type_item.id)
    # The original test asserted against the pre-generated UUIDs (st_ol_id, etc.)
    # If the API returns the OptionListItem's ID, this is correct.
    # assert isinstance(data["id"], (int, str)) # Referral.id is UUID, so str is expected. int might be if it was an int PK. This can be more specific. 
    assert isinstance(data["id"], str) # Referral.id is UUID
    assert str(data["id"]) == str(ref.id)

@pytest.mark.django_db
def test_delete_referral(db, client):
    from apps.optionlists.models import OptionList
    type_ol = OptionList.objects.create(id=21, slug='referral-types', name='Referral Types')
    status_ol = OptionList.objects.create(id=22, slug='referral-statuses', name='Referral Statuses')
    priority_ol = OptionList.objects.create(id=23, slug='referral-priorities', name='Referral Priorities')
    service_type_ol = OptionList.objects.create(id=24, slug='referral-service-types', name='Referral Service Types')
    st_ol = OptionListItem.objects.create(name="Type1", slug="type1", option_list=type_ol)
    status_ol = OptionListItem.objects.create(name="Status1", slug="status1", option_list=status_ol)
    priority_ol = OptionListItem.objects.create(name="Priority1", slug="priority1", option_list=priority_ol)
    service_type_ol = OptionListItem.objects.create(name="ServiceType1", slug="servicetype1", option_list=service_type_ol)
    ref = Referral.objects.create(
        type=st_ol,
        status=status_ol,
        priority=priority_ol,
        service_type=service_type_ol,
        reason="Test reason",
        referral_date=date.today(),
        client_type="existing",
        notes="Test notes"
    )
    response = client.delete(f"/referrals/{ref.id}")
    assert response.status_code == 204
    # Confirm gone
    response2 = client.get(f"/referrals/{ref.id}")
    assert response2.status_code == 404


@pytest.mark.django_db
def test_update_referral_status_ninja(db, client, test_user): # Changed authenticated_api_client to client
    # Setup: Create Client
    client_status_ol, _ = OptionList.objects.get_or_create(slug='client-statuses-urs', defaults={'name': 'Client Statuses URS'})
    client_language_ol, _ = OptionList.objects.get_or_create(slug='client-languages-urs', defaults={'name': 'Client Languages URS'})
    client_status_item, _ = OptionListItem.objects.get_or_create(option_list=client_status_ol, slug='active-urs', defaults={'name': 'Active URS'})
    client_language_item, _ = OptionListItem.objects.get_or_create(option_list=client_language_ol, slug='en-urs', defaults={'name': 'English URS'})
    
    test_model_client = Client.objects.create(
        first_name="ApiTestClientFNameURS",
        last_name="ApiTestClientLNameURS",
        date_of_birth=date.today() - timedelta(days=365*30),
        status=client_status_item,
        primary_language=client_language_item,
        created_by=test_user,
        updated_by=test_user
    )

    # Setup: Referral OptionLists and Items
    type_ol, _ = OptionList.objects.get_or_create(slug='referral-types-urs', defaults={'name':'Referral Types URS'})
    status_ol, _ = OptionList.objects.get_or_create(slug='referral-statuses', defaults={'name':'Referral Statuses URS'}) # Critical slug
    priority_ol, _ = OptionList.objects.get_or_create(slug='referral-priorities-urs', defaults={'name':'Referral Priorities URS'})
    service_type_ol, _ = OptionList.objects.get_or_create(slug='referral-service-types-urs', defaults={'name':'Referral Service Types URS'})

    initial_type, _ = OptionListItem.objects.get_or_create(option_list=type_ol, slug="type-initial-urs", defaults={'name':"Type Initial URS"})
    initial_status, _ = OptionListItem.objects.get_or_create(option_list=status_ol, slug="status-initial-urs", defaults={'name':"Status Initial URS"})
    new_status, _ = OptionListItem.objects.get_or_create(option_list=status_ol, slug="status-new-urs", defaults={'name':"Status New URS"})
    wrong_type_status, _ = OptionListItem.objects.get_or_create(option_list=type_ol, slug="status-wrong-type-urs", defaults={'name':"Status Wrong Type URS"})
    initial_priority, _ = OptionListItem.objects.get_or_create(option_list=priority_ol, slug="priority-initial-urs", defaults={'name':"Priority Initial URS"})
    initial_service_type, _ = OptionListItem.objects.get_or_create(option_list=service_type_ol, slug="service-initial-urs", defaults={'name':"Service Initial URS"})

    # Setup: Create Referral
    referral = Referral.objects.create(
        client=test_model_client,
        created_by=test_user,
        updated_by=test_user,
        type=initial_type,
        status=initial_status,
        priority=initial_priority,
        service_type=initial_service_type,
        reason="Initial reason for status update test",
        referral_date=date.today(),
        client_type="existing"
    )

    # --- Test 1: Successful status update ---
    auth_headers = {"Authorization": f"Token {test_user.auth_token.key}"}
    payload_success = {"status_id": new_status.id}
    response_success = client.patch(f"/referrals/{referral.id}/update-status/", json=payload_success, headers=auth_headers)
    
    assert response_success.status_code == 200, f"Success case failed: {response_success.content.decode()}"
    updated_data_success = response_success.json()
    assert updated_data_success["status"] == new_status.id
    referral.refresh_from_db()
    assert referral.status.id == new_status.id
    assert referral.updated_by == test_user # Check if updated_by was set

    # --- Test 2: Invalid status_id (non-existent) ---
    non_existent_status_id = 999999
    payload_invalid_id = {"status_id": non_existent_status_id}
    response_invalid_id = client.patch(f"/referrals/{referral.id}/update-status/", json=payload_invalid_id, headers=auth_headers)
    assert response_invalid_id.status_code == 400
    assert "detail" in response_invalid_id.json()
    assert str(non_existent_status_id) in response_invalid_id.json()["detail"]

    # --- Test 3: status_id from wrong OptionList (e.g., a type ID used as status ID) ---
    payload_wrong_type = {"status_id": wrong_type_status.id}
    response_wrong_type = client.patch(f"/referrals/{referral.id}/update-status/", json=payload_wrong_type, headers=auth_headers)
    assert response_wrong_type.status_code == 400
    assert "detail" in response_wrong_type.json()
    assert "does not belong to 'referral-statuses'" in response_wrong_type.json()["detail"]

    # --- Test 4: Non-existent referral_id ---
    non_existent_referral_id = uuid.uuid4()
    response_no_referral = client.patch(f"/referrals/{non_existent_referral_id}/update-status/", json=payload_success, headers=auth_headers)
    assert response_no_referral.status_code == 404

