import uuid
from apps.external_organisation_management.models import PhoneNumber as PhoneNumberModel

# Fixtures (api_client, user, sample_contact, work_phone_type, 
# sample_external_organisation, mobile_phone_type) and pytestmark
# are automatically sourced from conftest.py

class TestPhoneNumberAPICreate:

    def test_create_phone_for_contact_success(self, django_api_client, user, sample_contact, work_phone_type):
        payload = {
            "number": "031234567",
            "type_id": str(work_phone_type.id),
            "contact_id": str(sample_contact.id),
            "is_active": True
        }
        url = "/api/ext-org-mgmt/phone-numbers/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')
        
        assert response.status_code == 201
        response_data = response.json()
        assert response_data["number"] == payload["number"]
        assert response_data["type"]["id"] == work_phone_type.id
        assert response_data["contact_id"] == str(sample_contact.id)
        assert response_data["organisation_id"] is None
        assert response_data["created_by"]["id"] == user.id
        assert response_data["updated_by"]["id"] == user.id

        db_phone = PhoneNumberModel.objects.get(id=response_data["id"])
        assert db_phone.created_by == user
        assert db_phone.updated_by == user

    def test_create_phone_for_organisation_success(self, django_api_client, user, sample_external_organisation, mobile_phone_type):
        payload = {
            "number": "021987654",
            "type_id": str(mobile_phone_type.id),
            "organisation_id": str(sample_external_organisation.id),
            "is_active": True
        }
        url = "/api/ext-org-mgmt/phone-numbers/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')

        assert response.status_code == 201
        response_data = response.json()
        assert response_data["number"] == payload["number"]
        assert response_data["type"]["id"] == mobile_phone_type.id
        assert response_data["contact_id"] is None
        assert response_data["organisation_id"] == str(sample_external_organisation.id)
        assert response_data["created_by"]["id"] == user.id
        assert response_data["updated_by"]["id"] == user.id

        db_phone = PhoneNumberModel.objects.get(id=response_data["id"])
        assert db_phone.created_by == user
        assert db_phone.updated_by == user

    def test_create_phone_fail_both_associations(self, django_api_client, user, sample_contact, sample_external_organisation, work_phone_type):
        payload = {
            "number": "0987654321",
            "type_id": str(work_phone_type.id),
            "contact_id": str(sample_contact.id),
            "organisation_id": str(sample_external_organisation.id)
        }
        url = "/api/ext-org-mgmt/phone-numbers/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 400 
        assert "PhoneNumber cannot be associated with both a contact and an organisation simultaneously." in response.content.decode() 

    def test_create_phone_fail_no_association(self, django_api_client, user, work_phone_type):
        payload = {
            "number": "0123456789",
            "type_id": str(work_phone_type.id)
        }
        url = "/api/ext-org-mgmt/phone-numbers/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 400 
        assert "PhoneNumber must be associated with a contact or an organisation." in response.content.decode()

    def test_create_phone_unauthenticated(self, django_api_client, work_phone_type, sample_contact):
        payload = {
            "number": "071234567",
            "type_id": str(work_phone_type.id),
            "contact_id": str(sample_contact.id)
        }
        url = "/api/ext-org-mgmt/phone-numbers/"
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 401

    def test_create_phone_invalid_type_id(self, django_api_client, user, sample_contact):
        non_existent_type_id = 999999  # Assuming this ID does not exist for OptionListItem
        payload = {
            "number": "0412345678", # Made number unique to avoid potential clashes if test reruns 
            "type_id": non_existent_type_id,
            "contact_id": str(sample_contact.id)
        }
        url = "/api/ext-org-mgmt/phone-numbers/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 404 

    def test_create_phone_invalid_contact_id(self, django_api_client, user, work_phone_type):
        non_existent_contact_id = uuid.uuid4()
        payload = {
            "number": "051234567",
            "type_id": work_phone_type.id, # Ensure type_id is int
            "contact_id": str(non_existent_contact_id)
        }
        url = "/api/ext-org-mgmt/phone-numbers/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 404 

    def test_create_phone_missing_required_fields(self, django_api_client, user, sample_contact):
        payload = { 
            "contact_id": str(sample_contact.id)
        }
        url = "/api/ext-org-mgmt/phone-numbers/"
        django_api_client.force_login(user)
        response = django_api_client.post(url, data=payload, content_type='application/json')
        assert response.status_code == 422 
        response_data = response.json()
        assert isinstance(response_data.get("detail"), list), "Error detail is not a list"
        details = response_data.get("detail", [])
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

        assert len(field_errors) == 2, f"Expected 2 field errors (number, type_id), found {len(field_errors)} based on loc. Details: {details}"
        assert "number" in field_errors, f"'number' error not found in loc. Details: {details}"
        assert "type_id" in field_errors, f"'type_id' error not found in loc. Details: {details}"
