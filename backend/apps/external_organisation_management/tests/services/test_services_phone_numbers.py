import pytest
import uuid
from django.http import Http404

from apps.external_organisation_management.models import (
    PhoneNumber as PhoneNumberModel,
)
from apps.external_organisation_management.schemas import PhoneNumberSchemaIn
from apps.external_organisation_management.services import (
    phone_number_create,
    phone_number_get,
    phone_number_list,
    phone_number_update,
    phone_number_delete,
)
from apps.optionlists.models import OptionListItem

pytestmark = pytest.mark.django_db 

class TestPhoneNumberServices:
    def test_phone_number_create_for_contact_success(self, sample_contact, work_phone_type, user):
        payload = PhoneNumberSchemaIn(
            number="098765432",
            type_id=str(work_phone_type.id),
            contact_id=str(sample_contact.id),
            organisation_id=None,
            is_active=True
        )
        phone = phone_number_create(payload=payload, user=user)
        assert phone is not None
        assert phone.created_by == user
        assert phone.updated_by == user
        assert phone.number == "098765432"
        assert phone.type == work_phone_type
        assert phone.contact == sample_contact
        assert phone.organisation is None
        assert phone.is_active is True
        assert PhoneNumberModel.objects.filter(id=phone.id).exists()

    def test_phone_number_create_for_organisation_success(self, sample_external_organisation, mobile_phone_type, user):
        payload = PhoneNumberSchemaIn(
            number="021123456",
            type_id=str(mobile_phone_type.id),
            contact_id=None,
            organisation_id=str(sample_external_organisation.id),
            is_active=True
        )
        phone = phone_number_create(payload=payload, user=user)
        assert phone is not None
        assert phone.created_by == user
        assert phone.updated_by == user
        assert phone.number == "021123456"
        assert phone.type == mobile_phone_type
        assert phone.contact is None
        assert phone.organisation == sample_external_organisation
        assert phone.is_active is True

    def test_phone_number_create_fail_no_association(self, work_phone_type, user):
        payload = PhoneNumberSchemaIn(
            number="111222333",
            type_id=str(work_phone_type.id),
            contact_id=None,
            organisation_id=None, 
            is_active=True
        )
        with pytest.raises(ValueError, match="PhoneNumber must be associated with a contact or an organisation."):
            phone_number_create(payload=payload, user=user)

    def test_phone_number_create_fail_both_associations(self, sample_contact, sample_external_organisation, work_phone_type, user):
        payload = PhoneNumberSchemaIn(
            number="111222333",
            type_id=str(work_phone_type.id),
            contact_id=str(sample_contact.id),
            organisation_id=str(sample_external_organisation.id),
            is_active=True
        )
        with pytest.raises(ValueError, match="PhoneNumber cannot be associated with both a contact and an organisation simultaneously."):
            phone_number_create(payload=payload, user=user)
            
    def test_phone_number_create_fail_invalid_type_id(self, sample_contact, user):
        invalid_type_id = 999999999  # An integer ID that's unlikely to exist
        payload = PhoneNumberSchemaIn(
            number="123456789",
            type_id=invalid_type_id,
            contact_id=str(sample_contact.id),
            is_active=True
        )
        with pytest.raises(Http404, match="No OptionListItem matches the given query."):
             phone_number_create(payload=payload, user=user)


    def test_phone_number_get_success(self, sample_phone_for_contact):
        retrieved_phone = phone_number_get(phone_number_id=sample_phone_for_contact.id)
        assert retrieved_phone is not None
        assert retrieved_phone.id == sample_phone_for_contact.id
        assert retrieved_phone.number == sample_phone_for_contact.number

    def test_phone_number_get_fail_not_found(self):
        non_existent_id = uuid.uuid4()
        with pytest.raises(Http404, match="No PhoneNumber matches the given query."):
            phone_number_get(phone_number_id=non_existent_id)

    # Tests for phone_number_list
    def test_phone_number_list_no_filters(self, sample_phone_for_contact, sample_phone_for_org):
        result = phone_number_list(filters=None)
        assert len(result) >= 2
        assert sample_phone_for_contact in result
        assert sample_phone_for_org in result

    def test_phone_number_list_filter_by_contact_id(self, sample_contact, sample_phone_for_contact, sample_phone_for_org):
        if sample_phone_for_org.contact == sample_contact:
             sample_phone_for_org.contact = None
             sample_phone_for_org.organisation_id = sample_phone_for_org.organisation_id or uuid.uuid4()
             sample_phone_for_org.save()

        filters = {'contact_id': sample_contact.id}
        result = phone_number_list(filters=filters)
        assert len(result) == 1
        assert result[0].id == sample_phone_for_contact.id
        assert result[0].contact == sample_contact

    def test_phone_number_list_filter_by_organisation_id(self, sample_external_organisation, sample_phone_for_org, sample_phone_for_contact):
        if sample_phone_for_contact.organisation == sample_external_organisation:
            sample_phone_for_contact.organisation = None
            sample_phone_for_contact.contact_id = sample_phone_for_contact.contact_id or uuid.uuid4()
            sample_phone_for_contact.save()
            
        filters = {'organisation_id': sample_external_organisation.id}
        result = phone_number_list(filters=filters)
        assert len(result) == 1
        assert result[0].id == sample_phone_for_org.id
        assert result[0].organisation == sample_external_organisation
        
    def test_phone_number_list_empty(self):
        PhoneNumberModel.objects.all().delete()
        result = phone_number_list(filters=None)
        assert len(result) == 0

    # Tests for phone_number_update
    def test_phone_number_update_fields_success(self, sample_phone_for_contact, mobile_phone_type, user):
        payload = PhoneNumberSchemaIn(
            number="09-NEW-NUMBER",
            type_id=str(mobile_phone_type.id),
            contact_id=str(sample_phone_for_contact.contact.id),
            organisation_id=None,
            is_active=False
        )
        original_created_by = sample_phone_for_contact.created_by
        original_created_at = sample_phone_for_contact.created_at
        updated_phone = phone_number_update(phone_number_id=sample_phone_for_contact.id, payload=payload, user=user)
        assert updated_phone.created_by == original_created_by
        assert updated_phone.created_at == original_created_at
        assert updated_phone.updated_by == user
        assert updated_phone.number == "09-NEW-NUMBER"
        assert updated_phone.type == mobile_phone_type
        assert updated_phone.is_active is False
        assert updated_phone.contact == sample_phone_for_contact.contact

    def test_phone_number_update_change_association_from_contact_to_org(self, sample_phone_for_contact, sample_external_organisation, work_phone_type, user):
        payload = PhoneNumberSchemaIn(
            number=sample_phone_for_contact.number,
            type_id=str(work_phone_type.id),
            contact_id=None,
            organisation_id=str(sample_external_organisation.id),
            is_active=True
        )
        original_created_by = sample_phone_for_contact.created_by
        original_created_at = sample_phone_for_contact.created_at
        updated_phone = phone_number_update(phone_number_id=sample_phone_for_contact.id, payload=payload, user=user)
        assert updated_phone.created_by == original_created_by
        assert updated_phone.created_at == original_created_at
        assert updated_phone.updated_by == user
        assert updated_phone.contact is None
        assert updated_phone.organisation == sample_external_organisation

    def test_phone_number_update_fail_not_found(self, work_phone_type, user):
        non_existent_id = uuid.uuid4()
        payload = PhoneNumberSchemaIn(number="123", type_id=str(work_phone_type.id))
        with pytest.raises(Http404, match="No PhoneNumber matches the given query."):
            phone_number_update(phone_number_id=non_existent_id, payload=payload, user=user)

    def test_phone_number_update_fail_invalid_new_type_id(self, sample_phone_for_contact, user):
        invalid_type_id = 999999999  # An integer ID that's unlikely to exist
        payload = PhoneNumberSchemaIn(
            number=sample_phone_for_contact.number,
            type_id=invalid_type_id,
            contact_id=str(sample_phone_for_contact.contact.id)
        )
        with pytest.raises(Http404, match="No OptionListItem matches the given query."):
            phone_number_update(phone_number_id=sample_phone_for_contact.id, payload=payload, user=user)
            
    def test_phone_number_update_fail_setting_both_associations(self, sample_phone_for_contact, sample_external_organisation, work_phone_type, user):
        payload = PhoneNumberSchemaIn(
            number=sample_phone_for_contact.number,
            type_id=str(work_phone_type.id),
            contact_id=str(sample_phone_for_contact.contact.id),
            organisation_id=str(sample_external_organisation.id),
            is_active=True
        )
        with pytest.raises(ValueError, match="PhoneNumber cannot be associated with both a contact and an organisation simultaneously."):
            phone_number_update(phone_number_id=sample_phone_for_contact.id, payload=payload, user=user)


    # Tests for phone_number_delete
    def test_phone_number_delete_success(self, sample_phone_for_contact, user):
        phone_id = sample_phone_for_contact.id
        phone_number_delete(phone_number_id=phone_id, user=user)

        try:
            deleted_phone = PhoneNumberModel.objects_including_deleted.get(id=phone_id)
        except AttributeError:
            deleted_phone = PhoneNumberModel.all_objects.get(id=phone_id)

        assert deleted_phone.is_deleted is True
        assert deleted_phone.deleted_by == user
        assert deleted_phone.deleted_at is not None
        assert not PhoneNumberModel.objects.filter(id=phone_id).exists()

    def test_phone_number_delete_fail_not_found(self, user):
        non_existent_id = uuid.uuid4()
        with pytest.raises(Http404, match="No PhoneNumber matches the given query."):
            phone_number_delete(phone_number_id=non_existent_id, user=user)

