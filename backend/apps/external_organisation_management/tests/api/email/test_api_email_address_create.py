import pytest
import uuid

from apps.external_organisation_management.models import (
    EmailAddress as EmailAddressModel,
)
# from django.contrib.auth.models import User # Retained as user fixture might use it

pytestmark = pytest.mark.django_db

class TestEmailAddressCreateAPI:

    def test_create_email_for_contact_success(self, django_api_client, user, sample_contact, work_email_type):
        payload = {
            "email": "contact.worker@example.com",
            "type_id": work_email_type.id,
            "contact_id": str(sample_contact.id),
            "is_active": True
        }
        url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')
        
        assert response.status_code == 201
        response_data = response.json()
        assert response_data["email"] == payload["email"]
        assert response_data["type"]["id"] == work_email_type.id
        assert response_data["contact_id"] == str(sample_contact.id)
        assert response_data["organisation_id"] is None
        assert response_data["created_by"]["id"] == user.id
        assert response_data["updated_by"]["id"] == user.id

        db_email = EmailAddressModel.objects.get(id=response_data["id"])
        assert db_email.created_by == user
        assert db_email.updated_by == user

    def test_create_email_for_organisation_success(self, django_api_client, user, sample_external_organisation, work_email_type):
        payload = {
            "email": "info@organisation.com",
            "type_id": work_email_type.id,
            "organisation_id": str(sample_external_organisation.id),
            "is_active": True
        }
        url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')

        assert response.status_code == 201
        response_data = response.json()
        assert response_data["email"] == payload["email"]
        assert response_data["type"]["id"] == work_email_type.id
        assert response_data["contact_id"] is None
        assert response_data["organisation_id"] == str(sample_external_organisation.id)
        assert response_data["created_by"]["id"] == user.id
        assert response_data["updated_by"]["id"] == user.id

        db_email = EmailAddressModel.objects.get(id=response_data["id"])
        assert db_email.created_by == user
        assert db_email.updated_by == user

    def test_create_email_fail_both_associations(self, django_api_client, user, sample_contact, sample_external_organisation, work_email_type):
        payload = {
            "email": "dual@example.com",
            "type_id": work_email_type.id,
            "contact_id": str(sample_contact.id),
            "organisation_id": str(sample_external_organisation.id)
        }
        url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 400
        assert "EmailAddress cannot be associated with both a contact and an organisation simultaneously." in response.content.decode()

    def test_create_email_fail_no_association(self, django_api_client, user, work_email_type):
        payload = {
            "email": "unassociated@example.com",
            "type_id": work_email_type.id
        }
        url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 400
        assert "EmailAddress must be associated with a contact or an organisation." in response.content.decode()

    def test_create_email_unauthenticated(self, django_api_client, work_email_type, sample_contact):
        payload = {
            "email": "noauth@example.com",
            "type_id": work_email_type.id,
            "contact_id": str(sample_contact.id)
        }
        url = "/api/ext-org-mgmt/email-addresses/"
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 401

    def test_create_email_invalid_type_id(self, django_api_client, user, sample_contact):
        non_existent_type_pk = 99999
        payload = {
            "email": "badtype@example.com",
            "type_id": non_existent_type_pk,
            "contact_id": str(sample_contact.id)
        }
        url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 404 

    def test_create_email_invalid_contact_id(self, django_api_client, user, work_email_type):
        non_existent_contact_id = uuid.uuid4()
        payload = {
            "email": "badcontact@example.com",
            "type_id": work_email_type.id,
            "contact_id": str(non_existent_contact_id)
        }
        url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 404

    def test_create_email_missing_required_fields(self, django_api_client, user, sample_contact):
        payload = {
            "contact_id": str(sample_contact.id)
        }
        url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 422
        response_data = response.json()
        field_errors = {e['loc'][-1] for e in response_data.get('detail', []) if isinstance(e.get('loc'), list) and e['loc']}
        assert "email" in field_errors
        assert "type_id" in field_errors

    def test_create_email_invalid_format(self, django_api_client, user, sample_contact, work_email_type):
        payload = {
            "email": "not-an-email",
            "type_id": work_email_type.id,
            "contact_id": str(sample_contact.id)
        }
        url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 422 # Ninja validation for EmailStr
        response_data = response.json()
        assert any(e['loc'][-1] == 'email' and 'not a valid email address' in e['msg'].lower() for e in response_data.get('detail', []) if isinstance(e.get('loc'), list) and e['loc'])
