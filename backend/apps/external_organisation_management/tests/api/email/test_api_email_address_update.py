import pytest
import uuid

from apps.external_organisation_management.models import (
    EmailAddress as EmailAddressModel,
)
from django.contrib.auth.models import User

pytestmark = pytest.mark.django_db

class TestEmailAddressUpdateAPI:

    # PUT (Update) Tests
    def test_update_email_address_success(self, django_api_client, user, sample_contact, work_email_type, personal_email_type):
        # Create an email address first
        create_payload = {
            "email": "initial.update@example.com", "type_id": work_email_type.id,
            "contact_id": str(sample_contact.id), "is_active": True, "is_primary": False
        }
        create_url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        email_data = create_response.json()
        email_id = email_data["id"]
        original_created_by_id = email_data["created_by"]["id"]

        # Now update it
        update_payload = {
            "email": "final.update@example.com",
            "type_id": personal_email_type.id, # Change type
            "contact_id": str(sample_contact.id), # Keep association for this test
            "is_active": False,
            "is_primary": True
        }
        update_url = f"/api/ext-org-mgmt/email-addresses/{email_id}"
        # user already logged in
        response = django_api_client.put(update_url, data=update_payload, content_type='application/json')
        assert response.status_code == 200
        updated_response_data = response.json()

        assert updated_response_data["id"] == email_id
        assert updated_response_data["email"] == update_payload["email"]
        assert updated_response_data["type"]["id"] == update_payload["type_id"]
        assert updated_response_data["is_active"] == update_payload["is_active"]
        assert updated_response_data["is_primary"] == update_payload["is_primary"]
        assert updated_response_data["created_by"]["id"] == original_created_by_id # This should remain user.id, or specifically the creator's ID from initial creation if different
        assert updated_response_data["updated_by"]["id"] == user.id # This is correct as 'user' is the one performing the update

        db_email = EmailAddressModel.objects.get(id=email_id)
        assert db_email.email == update_payload["email"]
        assert db_email.updated_by == user
        assert db_email.is_primary is True

    def test_update_email_change_association_to_org(self, django_api_client, user, sample_contact, sample_external_organisation, work_email_type):
        create_payload = {"email": "contact.assoc@example.com", "type_id": work_email_type.id, "contact_id": str(sample_contact.id)}
        create_url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        email_id = create_response.json()["id"]

        update_payload = {
            "email": "org.assoc@example.com",
            "type_id": work_email_type.id,
            "organisation_id": str(sample_external_organisation.id),
        }
        update_url = f"/api/ext-org-mgmt/email-addresses/{email_id}"
        # user already logged in
        response = django_api_client.put(update_url, data=update_payload, content_type='application/json')
        assert response.status_code == 200
        updated_data = response.json()
        assert updated_data["organisation_id"] == str(sample_external_organisation.id)
        assert updated_data["contact_id"] is None

        db_email = EmailAddressModel.objects.get(id=email_id)
        assert db_email.organisation == sample_external_organisation
        assert db_email.contact is None

    def test_update_email_fail_to_both_associations(self, django_api_client, user, sample_contact, sample_external_organisation, work_email_type):
        create_payload = {"email": "fail.both1@example.com", "type_id": work_email_type.id, "contact_id": str(sample_contact.id)}
        create_url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        email_id = create_response.json()["id"]

        update_payload = {
            "email": "fail.both2@example.com", "type_id": work_email_type.id,
            "contact_id": str(sample_contact.id),
            "organisation_id": str(sample_external_organisation.id)
        }
        update_url = f"/api/ext-org-mgmt/email-addresses/{email_id}"
        # user already logged in
        response = django_api_client.put(update_url, data=update_payload, content_type='application/json')
        assert response.status_code == 400
        assert "EmailAddress cannot be associated with both a contact and an organisation simultaneously." in response.content.decode()

    def test_update_email_fail_to_no_association(self, django_api_client, user, sample_contact, work_email_type):
        create_payload = {"email": "fail.none1@example.com", "type_id": work_email_type.id, "contact_id": str(sample_contact.id)}
        create_url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        email_id = create_response.json()["id"]

        update_payload_explicit_null = {
            "email": "fail.none2@example.com", 
            "type_id": work_email_type.id,
            "contact_id": None,
            "organisation_id": None
        }
        update_url = f"/api/ext-org-mgmt/email-addresses/{email_id}"
        # user already logged in
        response = django_api_client.put(update_url, data=update_payload_explicit_null, content_type='application/json')
        assert response.status_code == 400
        assert "EmailAddress must be associated with a contact or an organisation." in response.content.decode()

    def test_update_email_invalid_format(self, django_api_client, user, sample_contact, work_email_type):
        create_payload = {"email": "valid.format@example.com", "type_id": work_email_type.id, "contact_id": str(sample_contact.id)}
        create_url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        email_id = create_response.json()["id"]
        
        update_payload = {"email": "invalid-email-format"}
        update_url = f"/api/ext-org-mgmt/email-addresses/{email_id}"
        # user already logged in
        response = django_api_client.put(update_url, data=update_payload, content_type='application/json')
        assert response.status_code == 422
        response_data = response.json()
        field_errors = {e['loc'][-1] for e in response_data.get('detail', []) if isinstance(e.get('loc'), list) and e['loc']}
        assert 'email' in field_errors
        assert any('email' in e['msg'] for e in response_data.get('detail', []))

    def test_update_email_unauthenticated(self, django_api_client, sample_contact, work_email_type):
        admin_user = User.objects.create_user(username="temp_email_admin_upd_unauth", password="password", email="tempupd@example.com")
        create_payload = {"email": "authfirst@example.com", "type_id": work_email_type.id, "contact_id": str(sample_contact.id)}
        create_url = "/api/ext-org-mgmt/email-addresses/"
        django_api_client.force_login(admin_user)
        create_response = django_api_client.post(create_url, data=create_payload, content_type='application/json')
        assert create_response.status_code == 201
        email_id = create_response.json()["id"]

        update_payload = {"email": "noauthupdate@example.com", "type_id": work_email_type.id, "contact_id": str(sample_contact.id)}
        update_url = f"/api/ext-org-mgmt/email-addresses/{email_id}"
        django_api_client.logout()
        response = django_api_client.put(update_url, data=update_payload, content_type='application/json') # Unauthenticated client
        assert response.status_code == 401

    def test_update_email_not_found(self, django_api_client, user, sample_contact, work_email_type):
        non_existent_id = uuid.uuid4()
        update_payload = {"email": "notfound@example.com", "type_id": work_email_type.id, "contact_id": str(sample_contact.id)}
        update_url = f"/api/ext-org-mgmt/email-addresses/{non_existent_id}"
        django_api_client.force_login(user)
        response = django_api_client.put(update_url, data=update_payload, content_type='application/json')
        assert response.status_code == 404
