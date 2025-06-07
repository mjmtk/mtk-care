import pytest
import uuid

# from apps.external_organisation_management.models import (
#     ExternalOrganisationContact as ExternalOrganisationContactModel,
#     ExternalOrganisation as ExternalOrganisationModel
# )
from django.contrib.auth.models import User

pytestmark = pytest.mark.django_db

class TestExternalOrganisationContactListRetrieveAPI:

    def test_list_contacts_success(self, django_api_client, user, sample_external_organisation):
        contact1_payload = {
            "first_name": "ListTest1", "last_name": "Contact1", "job_title": "Tester1",
            "organisation_id": str(sample_external_organisation.id)
        }
        contact2_payload = {
            "first_name": "ListTest2", "last_name": "Contact2", "job_title": "Tester2",
            "organisation_id": str(sample_external_organisation.id)
        }
        create_url = "/api/ext-org-mgmt/contacts/"
        django_api_client.force_login(user)
        response1 = django_api_client.post(create_url, data=contact1_payload, content_type='application/json')
        assert response1.status_code == 201
        contact1_id = response1.json()["id"]
        # user already logged in
        response2 = django_api_client.post(create_url, data=contact2_payload, content_type='application/json')
        assert response2.status_code == 201

        list_url = "/api/ext-org-mgmt/contacts/"
        # user already logged in
        response = django_api_client.get(list_url)
        assert response.status_code == 200
        response_data = response.json()
        assert isinstance(response_data, list)
        assert len(response_data) >= 2

        ids_in_response = {item['id'] for item in response_data}
        assert contact1_id in ids_in_response

        for item in response_data:
            if item['id'] == contact1_id:
                assert item["first_name"] == contact1_payload["first_name"]
                assert item["created_by"]["id"] == user.id # User.id is int, schema might return int or str
                assert item["updated_by"]["id"] == user.id

    def test_list_contacts_unauthenticated(self, django_api_client):
        list_url = "/api/ext-org-mgmt/contacts/"
        # No login needed, assuming GETs are public or test client is fresh
        response = django_api_client.get(list_url)
        assert response.status_code == 200 # GETs are currently unauthenticated

    def test_retrieve_contact_success(self, django_api_client, user, sample_external_organisation):
        payload = {
            "first_name": "RetrieveTest", "last_name": "Contact", "job_title": "Getter",
            "organisation_id": str(sample_external_organisation.id)
        }
        create_url = "/api/ext-org-mgmt/contacts/"
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=payload, content_type='application/json')
        assert create_response.status_code == 201
        contact_id = create_response.json()["id"]

        retrieve_url = f"/api/ext-org-mgmt/contacts/{contact_id}"
        # user already logged in
        response = django_api_client.get(retrieve_url)
        assert response.status_code == 200
        response_data = response.json()
        assert response_data["id"] == contact_id
        assert response_data["first_name"] == payload["first_name"]
        assert response_data["created_by"]["id"] == user.id
        assert response_data["updated_by"]["id"] == user.id

    def test_retrieve_contact_not_found(self, django_api_client, user):
        non_existent_id = uuid.uuid4()
        retrieve_url = f"/api/ext-org-mgmt/contacts/{non_existent_id}"
        django_api_client.force_login(user)
        response = django_api_client.get(retrieve_url)
        assert response.status_code == 404

    def test_retrieve_contact_unauthenticated(self, django_api_client, sample_external_organisation):
        admin_user = User.objects.create_user(username="tempadmin_retrieve", password="password")
        create_payload = {
            "first_name": "RetrieveUnauthTest", "last_name": "Contact", "job_title": "GetterUnauth",
            "organisation_id": str(sample_external_organisation.id)
        }
        create_url = "/api/ext-org-mgmt/contacts/"
        django_api_client.force_login(admin_user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        contact_id = create_response.json()["id"]

        retrieve_url = f"/api/ext-org-mgmt/contacts/{contact_id}"
        django_api_client.logout() # Ensure unauthenticated for this GET
        response = django_api_client.get(retrieve_url)
        assert response.status_code == 200 # GETs are currently unauthenticated
