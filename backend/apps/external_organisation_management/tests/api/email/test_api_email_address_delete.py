import pytest
import uuid

from apps.external_organisation_management.models import (
    EmailAddress as EmailAddressModel,
)
from django.contrib.auth.models import User

pytestmark = pytest.mark.django_db

class TestEmailAddressDeleteAPI:

    # DELETE (Soft Delete) Tests
    def test_delete_email_success(self, django_api_client, user, sample_contact, work_email_type):
        create_payload = {"email": "delete.me@example.com", "type_id": work_email_type.id, "contact_id": str(sample_contact.id)}
        create_url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        email_id = create_response.json()["id"]

        delete_url = f"/api/ext-org-mgmt/email-addresses/{email_id}"
        # user already logged in
        response = django_api_client.delete(delete_url)
        assert response.status_code == 204

        try:
            db_email = EmailAddressModel.objects_including_deleted.get(id=email_id)
        except AttributeError:
            db_email = EmailAddressModel.all_objects.get(id=email_id)
        
        assert db_email.is_deleted is True
        assert db_email.deleted_by == user
        assert db_email.deleted_at is not None

        retrieve_url = f"/api/ext-org-mgmt/email-addresses/{email_id}"
        # user already logged in
        get_response = django_api_client.get(retrieve_url)
        assert get_response.status_code == 404

    def test_delete_email_unauthenticated(self, django_api_client, sample_contact, work_email_type):
        admin_user = User.objects.create_user(username="temp_email_admin_del_unauth", password="password", email="tempdel@example.com")
        create_payload = {"email": "delete.unauth@example.com", "type_id": work_email_type.id, "contact_id": str(sample_contact.id)}
        create_url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(admin_user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        email_id = create_response.json()["id"]

        delete_url = f"/api/ext-org-mgmt/email-addresses/{email_id}"
        django_api_client.logout() # Ensure unauthenticated for this DELETE
        response = django_api_client.delete(delete_url) # Unauthenticated client
        assert response.status_code == 401

    def test_delete_email_not_found(self, django_api_client, user):
        non_existent_id = uuid.uuid4()
        delete_url = f"/api/ext-org-mgmt/email-addresses/{non_existent_id}"
        django_api_client.force_login(user)
        response = django_api_client.delete(delete_url)
        assert response.status_code == 404
