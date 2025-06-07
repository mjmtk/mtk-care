import uuid
from apps.external_organisation_management.models import PhoneNumber as PhoneNumberModel
from django.contrib.auth import get_user_model

# Fixtures (api_client, user, sample_contact, work_phone_type, 
# mobile_phone_type, sample_external_organisation) and pytestmark 
# are automatically sourced from conftest.py

class TestPhoneNumberAPIUpdate:

    def test_update_phone_number_success(self, django_api_client, user, sample_contact, work_phone_type, mobile_phone_type):
        create_payload = {
            "number": "0333111222", "type_id": work_phone_type.id, # int
            "contact_id": str(sample_contact.id), "is_active": True
        }
        create_url = "/api/ext-org-mgmt/phone-numbers/"
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        phone_data = create_response.json()
        phone_id = phone_data["id"]
        original_created_by_id = phone_data["created_by"]["id"]

        update_payload = {
            "number": "0333999888",
            "type_id": mobile_phone_type.id, # int 
            "contact_id": str(sample_contact.id), 
            "is_active": False,
            "notes": "Updated via API test"
        }
        update_url = f"/api/ext-org-mgmt/phone-numbers/{phone_id}"
        # user already logged in
        response = django_api_client.put(update_url, data=update_payload, content_type='application/json')
        assert response.status_code == 200
        updated_response_data = response.json()

        assert updated_response_data["id"] == phone_id
        assert updated_response_data["number"] == update_payload["number"]
        assert updated_response_data["type"]["id"] == mobile_phone_type.id
        assert updated_response_data["is_active"] == update_payload["is_active"]
        assert updated_response_data["notes"] == update_payload["notes"]
        assert updated_response_data["created_by"]["id"] == original_created_by_id
        assert updated_response_data["updated_by"]["id"] == user.id

        db_phone = PhoneNumberModel.objects.get(id=phone_id)
        assert db_phone.number == update_payload["number"]
        assert db_phone.updated_by == user

    def test_update_phone_change_association_to_org(self, django_api_client, user, sample_contact, sample_external_organisation, work_phone_type):
        create_payload = {"number": "0333123456", "type_id": work_phone_type.id, "contact_id": str(sample_contact.id)} # int for type_id
        create_url = "/api/ext-org-mgmt/phone-numbers/"
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        phone_id = create_response.json()["id"]

        update_payload = {
            "number": "0333654321",
            "type_id": work_phone_type.id, # int
            "organisation_id": str(sample_external_organisation.id),
        }
        update_url = f"/api/ext-org-mgmt/phone-numbers/{phone_id}"
        # user already logged in
        response = django_api_client.put(update_url, data=update_payload, content_type='application/json')
        assert response.status_code == 200
        updated_data = response.json()
        assert updated_data["organisation_id"] == str(sample_external_organisation.id)
        assert updated_data["contact_id"] is None

        db_phone = PhoneNumberModel.objects.get(id=phone_id)
        assert db_phone.organisation == sample_external_organisation
        assert db_phone.contact is None

    def test_update_phone_fail_to_both_associations(self, django_api_client, user, sample_contact, sample_external_organisation, work_phone_type):
        create_payload = {"number": "0333777888", "type_id": work_phone_type.id, "contact_id": str(sample_contact.id)} # int for type_id
        create_url = "/api/ext-org-mgmt/phone-numbers/"
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        phone_id = create_response.json()["id"]

        update_payload = {
            "number": "0333888777", "type_id": work_phone_type.id, # int for type_id
            "contact_id": str(sample_contact.id),
            "organisation_id": str(sample_external_organisation.id)
        }
        update_url = f"/api/ext-org-mgmt/phone-numbers/{phone_id}"
        # user already logged in
        response = django_api_client.put(update_url, data=update_payload, content_type='application/json')
        assert response.status_code == 400 
        assert "PhoneNumber cannot be associated with both a contact and an organisation simultaneously." in response.content.decode()

    def test_update_phone_fail_to_no_association(self, django_api_client, user, sample_contact, work_phone_type):
        create_payload = {"number": "0333444555", "type_id": work_phone_type.id, "contact_id": str(sample_contact.id)} # int for type_id
        create_url = "/api/ext-org-mgmt/phone-numbers/"
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        phone_id = create_response.json()["id"]

        update_payload_explicit_null = {
            "number": "0333555444", 
            "type_id": work_phone_type.id, # int for type_id
            "contact_id": None,
            "organisation_id": None
        }
        update_url = f"/api/ext-org-mgmt/phone-numbers/{phone_id}"
        # user already logged in
        response = django_api_client.put(update_url, data=update_payload_explicit_null, content_type='application/json')
        assert response.status_code == 400
        assert "PhoneNumber must be associated with a contact or an organisation." in response.content.decode()

    def test_update_phone_unauthenticated(self, django_api_client, sample_contact, work_phone_type):
        User = get_user_model()
        admin_user, _ = User.objects.get_or_create(username="temp_phone_admin_upd_unauth", defaults={"password":"password"})
        
        create_payload = {"number": "0399888777", "type_id": work_phone_type.id, "contact_id": str(sample_contact.id)} # int for type_id
        create_url = "/api/ext-org-mgmt/phone-numbers/"
        django_api_client.force_login(admin_user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        phone_id = create_response.json()["id"]

        update_payload = {"number": "0399888666", "type_id": work_phone_type.id} # int for type_id
        update_url = f"/api/ext-org-mgmt/phone-numbers/{phone_id}"
        django_api_client.logout()
        response = django_api_client.put(update_url, data=update_payload, content_type='application/json') # Unauthenticated client
        assert response.status_code == 401

    def test_update_phone_not_found(self, django_api_client, user, work_phone_type):
        non_existent_id = uuid.uuid4()
        update_payload = {
            "number": "0311223344",
            "type_id": work_phone_type.id # int
        }
        update_url = f"/api/ext-org-mgmt/phone-numbers/{non_existent_id}"
        django_api_client.force_login(user)
        response = django_api_client.put(update_url, data=update_payload, content_type='application/json')
        assert response.status_code == 404
