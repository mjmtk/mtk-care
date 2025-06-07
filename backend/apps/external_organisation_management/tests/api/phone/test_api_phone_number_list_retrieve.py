import pytest
import uuid

# Fixtures (api_client, user, sample_contact, work_phone_type, 
# mobile_phone_type, sample_phone_for_contact) and pytestmark
# are automatically sourced from conftest.py

@pytest.mark.django_db
class TestPhoneNumberAPIListRetrieve:

    def test_list_phones_success(self, django_api_client, user, sample_contact, work_phone_type, mobile_phone_type):
        payload1 = {"number": "0300111222", "type_id": str(work_phone_type.id), "contact_id": str(sample_contact.id)}
        payload2 = {"number": "0300333444", "type_id": str(mobile_phone_type.id), "contact_id": str(sample_contact.id)}
        
        create_url = "/api/ext-org-mgmt/phone-numbers/"
        django_api_client.force_login(user)
        response1 = django_api_client.post(create_url, data=payload1, content_type='application/json')
        assert response1.status_code == 201
        phone1_id = response1.json()["id"]
        
        # user already logged in
        response2 = django_api_client.post(create_url, data=payload2, content_type='application/json')
        assert response2.status_code == 201

        list_url = "/api/ext-org-mgmt/phone-numbers/"
        # user already logged in
        response = django_api_client.get(list_url)
        assert response.status_code == 200
        response_data = response.json()
        assert isinstance(response_data, list)
        assert len(response_data) >= 2

        ids_in_response = {item['id'] for item in response_data}
        assert phone1_id in ids_in_response

        for item in response_data:
            if item['id'] == phone1_id:
                assert item["number"] == payload1["number"]
                assert item["type"]["id"] == work_phone_type.id # Nested OptionListItemSchemaOut
                assert item["contact_id"] == str(sample_contact.id) # Direct UUID from schema
                assert item["created_by"]["id"] == user.id # Nested UserAuditSchema
                assert item["updated_by"]["id"] == user.id # Nested UserAuditSchema
                break

    def test_list_phones_unauthenticated(self, django_api_client):
        url = "/api/ext-org-mgmt/phone-numbers/"
        # django_api_client.logout() # Ensure unauthenticated if client state persists, though usually not needed for fresh fixture
        response = django_api_client.get(url)
        assert response.status_code == 401 # GETs now require authentication

    def test_retrieve_phone_success(self, django_api_client, user, sample_contact, work_phone_type):
        payload = {"number": "0312312312", "type_id": str(work_phone_type.id), "contact_id": str(sample_contact.id)}
        create_url = "/api/ext-org-mgmt/phone-numbers/"
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=payload, content_type='application/json')
        assert create_response.status_code == 201
        phone_id = create_response.json()["id"]

        retrieve_url = f"/api/ext-org-mgmt/phone-numbers/{phone_id}"
        # user already logged in
        response = django_api_client.get(retrieve_url)
        assert response.status_code == 200
        response_data = response.json()
        assert response_data["id"] == phone_id
        assert response_data["number"] == payload["number"]
        assert response_data["type"]["id"] == work_phone_type.id # Nested OptionListItemSchemaOut
        assert response_data["contact_id"] == str(sample_contact.id) # Direct UUID from schema
        assert response_data["created_by"]["id"] == user.id # Nested UserAuditSchema
        assert response_data["updated_by"]["id"] == user.id # Nested UserAuditSchema

    def test_retrieve_phone_not_found(self, django_api_client, user):
        non_existent_id = uuid.uuid4()
        retrieve_url = f"/api/ext-org-mgmt/phone-numbers/{non_existent_id}"
        django_api_client.force_login(user)
        response = django_api_client.get(retrieve_url)
        assert response.status_code == 404

    def test_retrieve_phone_unauthenticated(self, django_api_client, sample_phone_for_contact):
        phone_id = sample_phone_for_contact.id 
        retrieve_url = f"/api/ext-org-mgmt/phone-numbers/{phone_id}"
        # django_api_client.logout() # Ensure unauthenticated if client state persists
        response = django_api_client.get(retrieve_url)
        assert response.status_code == 401 # GETs now require authentication
