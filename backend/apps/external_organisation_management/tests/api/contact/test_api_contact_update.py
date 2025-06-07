import pytest
import uuid

from apps.external_organisation_management.models import (
    ExternalOrganisationContact as ExternalOrganisationContactModel,
    # ExternalOrganisation as ExternalOrganisationModel
)
from django.contrib.auth.models import User

pytestmark = pytest.mark.django_db

class TestExternalOrganisationContactUpdateAPI:

    def test_update_contact_success(self, django_api_client, user, sample_external_organisation):
        create_payload = {
            "first_name": "UpdateInitial", "last_name": "Contact", "job_title": "Updater",
            "organisation_id": str(sample_external_organisation.id)
        }
        create_url = "/api/ext-org-mgmt/contacts/"
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        contact_data = create_response.json()
        contact_id = contact_data["id"]
        original_created_by_id = contact_data["created_by"]["id"]

        update_payload = {
            "first_name": "UpdateFinal",
            "last_name": "ContactUpdated",
            "job_title": "Senior Updater",
            "organisation_id": str(sample_external_organisation.id),
            "notes": "Updated via API test"
        }
        update_url = f"/api/ext-org-mgmt/contacts/{contact_id}"
        # user already logged in from create_payload call
        response = django_api_client.put(update_url, data=update_payload, content_type='application/json')
        assert response.status_code == 200
        updated_response_data = response.json()

        assert updated_response_data["id"] == contact_id
        assert updated_response_data["first_name"] == update_payload["first_name"]
        assert updated_response_data["last_name"] == update_payload["last_name"]
        assert updated_response_data["job_title"] == update_payload["job_title"]
        assert updated_response_data["notes"] == update_payload["notes"]
        assert updated_response_data["organisation"]["id"] == str(sample_external_organisation.id)
        assert updated_response_data["created_by"]["id"] == original_created_by_id # Should not change
        assert updated_response_data["updated_by"]["id"] == user.id # Should update to current user

        db_contact = ExternalOrganisationContactModel.objects.get(id=contact_id)
        assert db_contact.first_name == update_payload["first_name"]
        assert db_contact.updated_by == user

    def test_update_contact_unauthenticated(self, django_api_client, sample_external_organisation):
        admin_user = User.objects.create_user(username="tempadmin_update_setup", password="password")
        create_payload = {
            "first_name": "UpdateUnauthInitial", "last_name": "Contact", "job_title": "UnauthUpdaterSetup",
            "organisation_id": str(sample_external_organisation.id)
        }
        create_url = "/api/ext-org-mgmt/contacts/"
        django_api_client.force_login(admin_user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        created_contact_data = create_response.json()
        contact_id = created_contact_data["id"]

        update_payload = {
            "first_name": "UpdateUnauthFinal",
            "last_name": created_contact_data["last_name"], # Use existing last_name
            "organisation_id": created_contact_data["organisation"]["id"] # Use existing organisation_id
        }
        update_url = f"/api/ext-org-mgmt/contacts/{contact_id}"
        django_api_client.logout() # Ensure unauthenticated for this PUT
        response = django_api_client.put(update_url, data=update_payload, content_type='application/json')
        assert response.status_code == 401

    def test_update_contact_not_found(self, django_api_client, user, sample_external_organisation): # Added sample_external_organisation for a valid org_id
        non_existent_id = uuid.uuid4()
        update_payload = {
            "first_name": "NotFoundUpdate",
            "last_name": "LastNameForNotFound",
            "organisation_id": str(sample_external_organisation.id) # Provide a valid org_id
        }
        update_url = f"/api/ext-org-mgmt/contacts/{non_existent_id}"
        django_api_client.force_login(user)
        response = django_api_client.put(update_url, data=update_payload, content_type='application/json')
        assert response.status_code == 404

    def test_update_contact_invalid_organisation_id(self, django_api_client, user, sample_external_organisation):
        create_payload = {
            "first_name": "UpdateInvalidOrgInitial", "last_name": "Contact", "job_title": "OrgUpdaterSetup",
            "organisation_id": str(sample_external_organisation.id)
        }
        create_url = "/api/ext-org-mgmt/contacts/"
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        created_contact_data = create_response.json()
        contact_id = created_contact_data["id"]

        non_existent_org_id = uuid.uuid4()
        update_payload = {
            "first_name": "UpdateInvalidOrgFinal",
            "last_name": created_contact_data["last_name"], # Use existing last_name
            "organisation_id": str(non_existent_org_id)
        }
        update_url = f"/api/ext-org-mgmt/contacts/{contact_id}"
        # user already logged in from create_payload call
        response = django_api_client.put(update_url, data=update_payload, content_type='application/json')
        assert response.status_code == 404
