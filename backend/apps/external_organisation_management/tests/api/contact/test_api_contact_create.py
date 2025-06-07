import pytest
import uuid

from apps.external_organisation_management.models import (
    ExternalOrganisationContact as ExternalOrganisationContactModel,
    ExternalOrganisation as ExternalOrganisationModel
)
from django.contrib.auth.models import User

pytestmark = pytest.mark.django_db

class TestExternalOrganisationContactCreateAPI:

    def test_create_contact_success(self, django_api_client, user, sample_external_organisation):
        payload = {
            "first_name": "ApiTest",
            "last_name": "UserContact",
            "job_title": "API Tester",
            "organisation_id": str(sample_external_organisation.id),
            "notes": "Created via API test"
        }
        url = "/api/ext-org-mgmt/contacts/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 201
        response_data = response.json()
        
        assert response_data["first_name"] == payload["first_name"]
        assert response_data["last_name"] == payload["last_name"]
        assert response_data["job_title"] == payload["job_title"]
        assert response_data["organisation"]["id"] == str(sample_external_organisation.id)
        assert response_data["created_by"]["id"] == user.id
        assert response_data["updated_by"]["id"] == user.id
        assert "id" in response_data

        contact_id = response_data["id"]
        db_contact = ExternalOrganisationContactModel.objects.get(id=contact_id)
        assert db_contact.first_name == payload["first_name"]
        assert db_contact.created_by == user
        assert db_contact.updated_by == user

    def test_create_contact_unauthenticated(self, django_api_client, sample_external_organisation):
        payload = {
            "first_name": "ApiTestUnauth",
            "last_name": "UserContactUnauth",
            "job_title": "API Tester Unauth",
            "organisation_id": str(sample_external_organisation.id)
        }
        url = "/api/ext-org-mgmt/contacts/"
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 401

    def test_create_contact_invalid_organisation_id(self, django_api_client, user):
        non_existent_org_id = uuid.uuid4()
        payload = {
            "first_name": "ApiTestInvalidOrg",
            "last_name": "UserContactInvalidOrg",
            "job_title": "API Tester InvalidOrg",
            "organisation_id": str(non_existent_org_id)
        }
        url = "/api/ext-org-mgmt/contacts/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 404

    def test_create_contact_missing_required_fields(self, django_api_client, user, sample_external_organisation):
        payload = {
            "organisation_id": str(sample_external_organisation.id)
        }
        url = "/api/ext-org-mgmt/contacts/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 422
        response_data = response.json()
        details = response_data.get("detail", [])
        assert len(details) == 2 # Expecting 2 errors as job_title is optional
        # Extract field names from 'loc' using the now known structure: ['body', 'payload', 'field_name']
        field_errors = set()
        for e in details:
            loc = e.get("loc")
            if (
                isinstance(loc, list) and 
                len(loc) == 3 and 
                loc[0] == "body" and 
                loc[1] == "payload" and 
                isinstance(loc[2], str) # Ensure the field name itself is a string
            ):
                field_errors.add(loc[2])

        assert len(field_errors) == 2, f"Expected 2 field errors, found {len(field_errors)} based on loc. Details: {details}"
        assert "first_name" in field_errors, f"'first_name' error not found in loc. Details: {details}"
        assert "last_name" in field_errors, f"'last_name' error not found in loc. Details: {details}"
        assert "job_title" not in field_errors # job_title is optional
