import pytest
import uuid

from apps.external_organisation_management.models import (
    ExternalOrganisationContact as ExternalOrganisationContactModel,
    ExternalOrganisation as ExternalOrganisationModel
)
from django.contrib.auth.models import User

pytestmark = pytest.mark.django_db

class TestExternalOrganisationContactDeleteAPI:

    def test_delete_contact_success(self, django_api_client, user, sample_external_organisation):
        create_payload = {
            "first_name": "DeleteTest", "last_name": "Contact", "job_title": "Deleter",
            "organisation_id": str(sample_external_organisation.id)
        }
        create_url = "/api/ext-org-mgmt/contacts/"  # Corrected URL prefix
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        contact_id = create_response.json()["id"]

        db_contact_before_delete = ExternalOrganisationContactModel.objects.get(id=contact_id)
        assert not db_contact_before_delete.is_deleted

        delete_url = f"/api/ext-org-mgmt/contacts/{contact_id}"
        django_api_client.force_login(user) # Ensure login for delete if it wasn't done prior in a multi-step test
        response = django_api_client.delete(delete_url)
        assert response.status_code == 204

        assert not ExternalOrganisationContactModel.objects.filter(id=contact_id).exists()
        db_contact_after_delete = ExternalOrganisationContactModel.all_objects.get(id=contact_id)
        assert db_contact_after_delete.is_deleted
        assert db_contact_after_delete.deleted_by == user
        assert db_contact_after_delete.deleted_at is not None

        retrieve_url = f"/api/ext-org-mgmt/contacts/{contact_id}"
        django_api_client.force_login(user) # Ensure login for get
        get_response = django_api_client.get(retrieve_url)
        assert get_response.status_code == 404

    def test_delete_contact_unauthenticated(self, django_api_client, sample_external_organisation):
        admin_user = User.objects.create_user(username="tempadmin_delete_setup", password="password")
        create_payload = {
            "first_name": "DeleteUnauthInitial", "last_name": "Contact", "job_title": "UnauthDeleterSetup",
            "organisation_id": str(sample_external_organisation.id)
        }
        create_url = "/api/ext-org-mgmt/contacts/"
        django_api_client.force_login(admin_user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        contact_id = create_response.json()["id"]

        django_api_client.logout() # Log out before making the unauthenticated request
        delete_url = f"/api/ext-org-mgmt/contacts/{contact_id}"
        response = django_api_client.delete(delete_url)
        assert response.status_code == 401

    def test_delete_contact_not_found(self, django_api_client, user):
        non_existent_id = uuid.uuid4()
        delete_url = f"/api/ext-org-mgmt/contacts/{non_existent_id}"
        django_api_client.force_login(user)
        response = django_api_client.delete(delete_url)
        assert response.status_code == 404
