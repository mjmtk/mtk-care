import pytest
import uuid

# from apps.external_organisation_management.models import (
#     EmailAddress as EmailAddressModel,
# )
from django.contrib.auth.models import User

pytestmark = pytest.mark.django_db

class TestEmailAddressListRetrieveAPI:

    # GET (List) Tests
    def test_list_emails_success(self, django_api_client, user, sample_contact, work_email_type, personal_email_type):
        # Create a couple of email addresses
        payload1 = {"email": "list.test1@example.com", "type_id": work_email_type.id, "contact_id": str(sample_contact.id)}
        payload2 = {"email": "list.test2@example.com", "type_id": personal_email_type.id, "contact_id": str(sample_contact.id)}
        
        create_url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(user)
        response1 = django_api_client.post(create_url, data=payload1, content_type='application/json')
        assert response1.status_code == 201
        email1_id = response1.json()["id"]
        
        # user already logged in
        response2 = django_api_client.post(create_url, data=payload2, content_type='application/json')
        assert response2.status_code == 201

        list_url = "/api/ext-org-mgmt/email-addresses/"
        # user already logged in
        response = django_api_client.get(list_url)
        assert response.status_code == 200
        response_data = response.json()
        assert isinstance(response_data, list)
        assert len(response_data) >= 2 # Accounts for emails created in other tests or fixtures

        ids_in_response = {item['id'] for item in response_data}
        assert email1_id in ids_in_response

        for item in response_data:
            if item['id'] == email1_id:
                assert item["email"] == payload1["email"]
                assert item["type"]["id"] == payload1["type_id"]
                assert item["contact_id"] == payload1["contact_id"]
                assert item["created_by"]["id"] == user.id
                assert item["updated_by"]["id"] == user.id

    def test_list_emails_unauthenticated(self, django_api_client):
        list_url = "/api/ext-org-mgmt/email-addresses/"
        response = django_api_client.get(list_url) # No login needed, client should be unauthenticated
        assert response.status_code == 401

    # GET (Retrieve by ID) Tests
    def test_retrieve_email_success(self, django_api_client, user, sample_contact, work_email_type):
        payload = {"email": "retrieve.success@example.com", "type_id": work_email_type.id, "contact_id": str(sample_contact.id)}
        create_url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=payload, content_type='application/json')
        assert create_response.status_code == 201
        email_id = create_response.json()["id"]

        retrieve_url = f"/api/ext-org-mgmt/email-addresses/{email_id}"
        # user already logged in
        response = django_api_client.get(retrieve_url)
        assert response.status_code == 200
        response_data = response.json()
        assert response_data["id"] == email_id
        assert response_data["email"] == payload["email"]
        assert response_data["type"]["id"] == payload["type_id"]
        assert response_data["contact_id"] == payload["contact_id"]
        assert response_data["created_by"]["id"] == user.id
        assert response_data["updated_by"]["id"] == user.id

    def test_retrieve_email_not_found(self, django_api_client, user):
        non_existent_id = uuid.uuid4()
        retrieve_url = f"/api/ext-org-mgmt/email-addresses/{non_existent_id}"
        django_api_client.force_login(user)
        response = django_api_client.get(retrieve_url)
        assert response.status_code == 404

    def test_retrieve_email_unauthenticated(self, django_api_client, sample_contact, work_email_type):
        # Create an email with an admin/temp user
        admin_user = User.objects.create_user(username="tempemailadmin_get_unauth", password="password", email="tempget@example.com")
        payload = {"email": "get.unauth@example.com", "type_id": work_email_type.id, "contact_id": str(sample_contact.id)}
        create_url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(admin_user)
        create_response = django_api_client.post(create_url, data=payload, content_type='application/json')
        assert create_response.status_code == 201
        email_id = create_response.json()["id"]

        # Attempt to retrieve with unauthenticated client
        retrieve_url = f"/api/ext-org-mgmt/email-addresses/{email_id}"
        django_api_client.logout() # Ensure unauthenticated for this GET
        response = django_api_client.get(retrieve_url) # api_client is not authenticated here
        assert response.status_code == 401
