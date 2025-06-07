import uuid
from apps.external_organisation_management.models import PhoneNumber as PhoneNumberModel
from django.contrib.auth import get_user_model

# Fixtures (api_client, user, sample_contact, work_phone_type) 
# and pytestmark are automatically sourced from conftest.py

class TestPhoneNumberAPIDelete:

    def test_delete_phone_success(self, django_api_client, user, sample_contact, work_phone_type):
        create_payload = {"number": "0355555555", "type_id": str(work_phone_type.id), "contact_id": str(sample_contact.id)}
        create_url = "/api/ext-org-mgmt/phone-numbers/"
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        phone_id = create_response.json()["id"]

        delete_url = f"/api/ext-org-mgmt/phone-numbers/{phone_id}"
        # user already logged in
        response = django_api_client.delete(delete_url)
        assert response.status_code == 204

        # Check if the object is soft-deleted
        # Depending on your SoftDeleteQuerySet manager name
        try:
            db_phone = PhoneNumberModel.objects_including_deleted.get(id=phone_id)
        except AttributeError: 
            # Fallback to a common alternative name if 'objects_including_deleted' isn't standard for your project
            db_phone = PhoneNumberModel.all_objects.get(id=phone_id) 
        
        assert db_phone.is_deleted is True
        assert db_phone.deleted_by == user
        assert db_phone.deleted_at is not None

        # Verify it's not retrievable via standard GET (should be 404)
        retrieve_url = f"/api/ext-org-mgmt/phone-numbers/{phone_id}"
        # user already logged in
        get_response = django_api_client.get(retrieve_url) # Still need user to attempt access protected endpoint
        assert get_response.status_code == 404


    def test_delete_phone_unauthenticated(self, django_api_client, user, sample_contact, work_phone_type):
        # Create a phone number first using an authenticated user
        create_payload = {"number": "0366666666", "type_id": str(work_phone_type.id), "contact_id": str(sample_contact.id)}
        create_url = "/api/ext-org-mgmt/phone-numbers/" # This URL is correct with trailing slash for POST
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201 # Ensure creation was successful
        phone_id = create_response.json()["id"]

        # Attempt to delete without authentication
        delete_url = f"/api/ext-org-mgmt/phone-numbers/{phone_id}" # No trailing slash for DELETE
        django_api_client.logout()
        response = django_api_client.delete(delete_url) # Note: No 'user=user' passed
        assert response.status_code == 401    

    def test_delete_phone_not_found(self, django_api_client, user):
        non_existent_id = uuid.uuid4()
        delete_url = f"/api/ext-org-mgmt/phone-numbers/{non_existent_id}"
        django_api_client.force_login(user)
        response = django_api_client.delete(delete_url)
        assert response.status_code == 404
