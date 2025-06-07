import pytest
import uuid
from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404

from apps.external_organisation_management.models import (
    EmailAddress as EmailAddressModel,
    ExternalOrganisation as ExternalOrganisationModel,
    ExternalOrganisationContact as ExternalOrganisationContactModel
)
from apps.external_organisation_management.schemas import EmailAddressSchemaIn
from apps.external_organisation_management.services import (
    email_address_create,
    email_address_get,
    email_address_list,
    email_address_update,
    email_address_delete,
)
from apps.optionlists.models import OptionListItem

pytestmark = pytest.mark.django_db

class TestEmailAddressServices:
    def test_email_address_create_for_contact_success(self, sample_contact, work_email_type, user):
        payload = EmailAddressSchemaIn(
            email="new.contact@example.com",
            type_id=str(work_email_type.id),
            contact_id=str(sample_contact.id),
            organisation_id=None,
            is_active=True
        )
        email_obj = email_address_create(payload=payload, user=user)
        assert email_obj is not None
        assert email_obj.created_by == user
        assert email_obj.updated_by == user
        assert email_obj.email == "new.contact@example.com"
        assert email_obj.type == work_email_type
        assert email_obj.contact == sample_contact
        assert email_obj.organisation is None
        assert email_obj.is_active is True
        assert EmailAddressModel.objects.filter(id=email_obj.id).exists()

    def test_email_address_create_for_organisation_success(self, sample_external_organisation, work_email_type, user):
        payload = EmailAddressSchemaIn(
            email="new.org@example.com",
            type_id=str(work_email_type.id),
            contact_id=None,
            organisation_id=str(sample_external_organisation.id),
            is_active=True
        )
        email_obj = email_address_create(payload=payload, user=user)
        assert email_obj is not None
        assert email_obj.created_by == user
        assert email_obj.updated_by == user
        assert email_obj.email == "new.org@example.com"
        assert email_obj.type == work_email_type
        assert email_obj.contact is None
        assert email_obj.organisation == sample_external_organisation
        assert email_obj.is_active is True

    def test_email_address_create_fail_no_association(self, work_email_type, user):
        payload = EmailAddressSchemaIn(
            email="no.assoc@example.com",
            type_id=str(work_email_type.id),
            contact_id=None,
            organisation_id=None,
            is_active=True
        )
        with pytest.raises(ValueError, match="EmailAddress must be associated with a contact or an organisation."):
            email_address_create(payload=payload, user=user)

    def test_email_address_create_fail_both_associations(self, sample_contact, sample_external_organisation, work_email_type, user):
        payload = EmailAddressSchemaIn(
            email="both.assoc@example.com",
            type_id=str(work_email_type.id),
            contact_id=str(sample_contact.id),
            organisation_id=str(sample_external_organisation.id),
            is_active=True
        )
        with pytest.raises(ValueError, match="EmailAddress cannot be associated with both a contact and an organisation simultaneously."):
            email_address_create(payload=payload, user=user)
            
    def test_email_address_create_fail_invalid_type_id(self, sample_contact, user):
        invalid_type_id = 999999999  # An integer ID that's unlikely to exist
        payload = EmailAddressSchemaIn(
            email="invalid.type@example.com",
            type_id=invalid_type_id,
            contact_id=str(sample_contact.id),
            is_active=True
        )
        with pytest.raises(Http404, match="No OptionListItem matches the given query."):
             email_address_create(payload=payload, user=user)

    def test_email_address_get_success(self, sample_email_for_contact):
        retrieved_email = email_address_get(email_address_id=sample_email_for_contact.id)
        assert retrieved_email is not None
        assert retrieved_email.id == sample_email_for_contact.id
        assert retrieved_email.email == sample_email_for_contact.email

    def test_email_address_get_fail_not_found(self):
        non_existent_id = uuid.uuid4()
        with pytest.raises(Http404, match="No EmailAddress matches the given query."):
            email_address_get(email_address_id=non_existent_id)

    def test_email_address_list_no_filters(self, sample_email_for_contact, sample_email_for_org):
        result = email_address_list(filters=None)
        assert len(result) >= 2
        assert sample_email_for_contact in result
        assert sample_email_for_org in result

    def test_email_address_list_filter_by_contact_id(self, sample_contact, sample_email_for_contact, sample_email_for_org):
        if sample_email_for_org.contact == sample_contact:
             sample_email_for_org.contact = None
             sample_email_for_org.organisation_id = sample_email_for_org.organisation_id or uuid.uuid4()
             sample_email_for_org.save()

        filters = {'contact_id': sample_contact.id}
        result = email_address_list(filters=filters)
        assert len(result) == 1
        assert result[0].id == sample_email_for_contact.id
        assert result[0].contact == sample_contact

    def test_email_address_list_filter_by_organisation_id(self, sample_external_organisation, sample_email_for_org, sample_email_for_contact):
        if sample_email_for_contact.organisation == sample_external_organisation:
            sample_email_for_contact.organisation = None
            sample_email_for_contact.contact_id = sample_email_for_contact.contact_id or uuid.uuid4()
            sample_email_for_contact.save()
            
        filters = {'organisation_id': sample_external_organisation.id}
        result = email_address_list(filters=filters)
        assert len(result) == 1
        assert result[0].id == sample_email_for_org.id
        assert result[0].organisation == sample_external_organisation
        
    def test_email_address_list_empty(self):
        EmailAddressModel.objects.all().delete()
        result = email_address_list(filters=None)
        assert len(result) == 0

    def test_email_address_update_fields_success(self, sample_email_for_contact, work_email_type, user):
        new_type_id = work_email_type.id

        payload = EmailAddressSchemaIn(
            email="updated.email@example.com",
            type_id=str(new_type_id), 
            contact_id=str(sample_email_for_contact.contact.id),
            organisation_id=None,
            is_active=False
        )
        original_created_by = sample_email_for_contact.created_by
        original_created_at = sample_email_for_contact.created_at
        updated_email = email_address_update(email_address_id=sample_email_for_contact.id, payload=payload, user=user)
        assert updated_email.created_by == original_created_by
        assert updated_email.created_at == original_created_at
        assert updated_email.updated_by == user
        assert updated_email.email == "updated.email@example.com"
        assert updated_email.type_id == new_type_id
        assert updated_email.is_active is False
        assert updated_email.contact == sample_email_for_contact.contact

    def test_email_address_update_change_association_from_contact_to_org(self, sample_email_for_contact, sample_external_organisation, work_email_type, user):
        payload = EmailAddressSchemaIn(
            email=sample_email_for_contact.email,
            type_id=str(work_email_type.id),
            contact_id=None,
            organisation_id=str(sample_external_organisation.id),
            is_active=True
        )
        original_created_by = sample_email_for_contact.created_by
        original_created_at = sample_email_for_contact.created_at
        updated_email = email_address_update(email_address_id=sample_email_for_contact.id, payload=payload, user=user)
        assert updated_email.created_by == original_created_by
        assert updated_email.created_at == original_created_at
        assert updated_email.updated_by == user
        assert updated_email.contact is None
        assert updated_email.organisation == sample_external_organisation

    def test_email_address_update_fail_not_found(self, work_email_type, user):
        non_existent_id = uuid.uuid4()
        payload = EmailAddressSchemaIn(email="fail@example.com", type_id=str(work_email_type.id))
        with pytest.raises(Http404, match="No EmailAddress matches the given query."):
            email_address_update(email_address_id=non_existent_id, payload=payload, user=user)

    def test_email_address_update_fail_invalid_new_type_id(self, sample_email_for_contact, user):
        invalid_type_id = 999999999  # An integer ID that's unlikely to exist
        payload = EmailAddressSchemaIn(
            email=sample_email_for_contact.email,
            type_id=invalid_type_id,
            contact_id=str(sample_email_for_contact.contact.id)
        )
        with pytest.raises(Http404, match="No OptionListItem matches the given query."):
            email_address_update(email_address_id=sample_email_for_contact.id, payload=payload, user=user)

    def test_email_address_update_fail_setting_both_associations(self, sample_email_for_contact, sample_external_organisation, work_email_type, user):
        payload = EmailAddressSchemaIn(
            email=sample_email_for_contact.email,
            type_id=str(work_email_type.id),
            contact_id=str(sample_email_for_contact.contact.id),
            organisation_id=str(sample_external_organisation.id),
            is_active=True
        )
        with pytest.raises(ValueError, match="EmailAddress cannot be associated with both a contact and an organisation simultaneously."):
            email_address_update(email_address_id=sample_email_for_contact.id, payload=payload, user=user)

    def test_email_address_update_fail_invalid_new_org_id(self, sample_email_for_contact, user):
        invalid_uuid = uuid.uuid4()
        payload = EmailAddressSchemaIn(
            email=sample_email_for_contact.email,
            type_id=str(sample_email_for_contact.type.id),
            contact_id=None,
            organisation_id=str(invalid_uuid),
            is_active=True
        )
        with pytest.raises(Http404, match="No ExternalOrganisation matches the given query."):
            email_address_update(email_address_id=sample_email_for_contact.id, payload=payload, user=user)

    def test_email_address_update_fail_invalid_new_contact_id(self, sample_email_for_org, user):
        invalid_uuid = uuid.uuid4()
        payload = EmailAddressSchemaIn(
            email=sample_email_for_org.email,
            type_id=str(sample_email_for_org.type.id),
            contact_id=str(invalid_uuid),
            organisation_id=None,
            is_active=True
        )
        with pytest.raises(Http404, match="No ExternalOrganisationContact matches the given query."):
            email_address_update(email_address_id=sample_email_for_org.id, payload=payload, user=user)

    def test_email_address_delete_success(self, sample_email_for_contact, user):
        email_id = sample_email_for_contact.id
        email_address_delete(email_address_id=email_id, user=user)

        try:
            deleted_email = EmailAddressModel.objects_including_deleted.get(id=email_id)
        except AttributeError:
            deleted_email = EmailAddressModel.all_objects.get(id=email_id)

        assert deleted_email.is_deleted is True
        assert deleted_email.deleted_by == user
        assert deleted_email.deleted_at is not None
        assert not EmailAddressModel.objects.filter(id=email_id).exists()

    def test_email_address_delete_fail_not_found(self, user):
        non_existent_id = uuid.uuid4()
        with pytest.raises(Http404, match="No EmailAddress matches the given query."):
            email_address_delete(email_address_id=non_existent_id, user=user)
