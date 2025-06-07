import pytest
import uuid
from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404

from apps.external_organisation_management.models import (
    ExternalOrganisationContact as ExternalOrganisationContactModel,
    ExternalOrganisation as ExternalOrganisationModel
)
from apps.external_organisation_management.schemas import ExternalOrganisationContactSchemaIn
from apps.external_organisation_management.services import (
    external_organisation_contact_create,
    external_organisation_contact_get,
    external_organisation_contact_list,
    external_organisation_contact_update,
    external_organisation_contact_delete,
)

pytestmark = pytest.mark.django_db

class TestExternalOrganisationContactServices:
    def test_contact_create_success(self, sample_external_organisation, user):
        payload = ExternalOrganisationContactSchemaIn(
            organisation_id=str(sample_external_organisation.id),
            first_name="Alice",
            last_name="Wonderland",
            job_title="Explorer",
            is_active=True,
            notes="Curiouser and curiouser."
        )
        contact = external_organisation_contact_create(payload=payload, user=user)
        assert contact is not None
        assert contact.created_by == user
        assert contact.updated_by == user
        assert contact.first_name == "Alice"
        assert contact.last_name == "Wonderland"
        assert contact.job_title == "Explorer"
        assert contact.organisation == sample_external_organisation
        assert contact.is_active is True
        assert contact.notes == "Curiouser and curiouser."
        assert ExternalOrganisationContactModel.objects.filter(id=contact.id).exists()

    def test_contact_create_fail_invalid_organisation_id(self, user):
        invalid_org_id = uuid.uuid4()
        payload = ExternalOrganisationContactSchemaIn(
            organisation_id=str(invalid_org_id),
            first_name="Bob",
            last_name="Nobody"
        )
        with pytest.raises(Http404, match="No ExternalOrganisation matches the given query."):
            external_organisation_contact_create(payload=payload, user=user)

    def test_contact_get_success(self, sample_contact):
        retrieved_contact = external_organisation_contact_get(contact_id=sample_contact.id)
        assert retrieved_contact is not None
        assert retrieved_contact.id == sample_contact.id
        assert retrieved_contact.first_name == sample_contact.first_name

    def test_contact_get_fail_not_found(self):
        non_existent_id = uuid.uuid4()
        with pytest.raises(Http404, match="No ExternalOrganisationContact matches the given query."):
            external_organisation_contact_get(contact_id=non_existent_id)

    def test_contact_list_no_filters(self, sample_contact, another_contact):
        result = external_organisation_contact_list(filters=None)
        assert len(result) >= 2
        contact_ids = [c.id for c in result]
        assert sample_contact.id in contact_ids
        assert another_contact.id in contact_ids


    def test_contact_list_filter_by_organisation_id(self, sample_external_organisation, sample_contact, another_contact):
        if another_contact.organisation == sample_external_organisation:
            pass
            
        filters = {'organisation_id': sample_external_organisation.id}
        result = external_organisation_contact_list(filters=filters)
        
        for contact in result:
            assert contact.organisation == sample_external_organisation
        
        assert sample_contact in result
        assert another_contact not in result


    def test_contact_list_empty(self, sample_external_organisation):
        ExternalOrganisationContactModel.objects.filter(organisation=sample_external_organisation).delete()
        filters = {'organisation_id': sample_external_organisation.id}
        result = external_organisation_contact_list(filters=filters)
        assert len(result) == 0
        
        ExternalOrganisationContactModel.objects.all().delete()
        result_all = external_organisation_contact_list(filters=None)
        assert len(result_all) == 0


    def test_contact_update_fields_success(self, sample_contact, another_external_organisation, user):
        payload = ExternalOrganisationContactSchemaIn(
            organisation_id=str(another_external_organisation.id),
            first_name="Johnny",
            last_name="Doebly",
            job_title="Senior Manager",
            is_active=False,
            notes="Updated notes."
        )
        original_created_by = sample_contact.created_by # Store original creator
        original_created_at = sample_contact.created_at # Store original creation time

        updated_contact = external_organisation_contact_update(contact_id=sample_contact.id, payload=payload, user=user)
        
        assert updated_contact.created_by == original_created_by
        assert updated_contact.created_at == original_created_at
        assert updated_contact.updated_by == user
        assert updated_contact.first_name == "Johnny"
        assert updated_contact.last_name == "Doebly"
        assert updated_contact.job_title == "Senior Manager"
        assert updated_contact.organisation == another_external_organisation
        assert updated_contact.is_active is False
        assert updated_contact.notes == "Updated notes."

    def test_contact_update_fail_not_found(self, sample_external_organisation, user):
        non_existent_id = uuid.uuid4()
        payload = ExternalOrganisationContactSchemaIn(
            organisation_id=str(sample_external_organisation.id),
            first_name="Test",
            last_name="Test"
        )
        with pytest.raises(Http404, match="No ExternalOrganisationContact matches the given query."):
            external_organisation_contact_update(contact_id=non_existent_id, payload=payload, user=user)

    def test_contact_update_fail_invalid_new_organisation_id(self, sample_contact, user):
        invalid_org_id = uuid.uuid4()
        payload = ExternalOrganisationContactSchemaIn(
            organisation_id=str(invalid_org_id),
            first_name=sample_contact.first_name,
            last_name=sample_contact.last_name
        )
        with pytest.raises(Http404, match="No ExternalOrganisation matches the given query."):
            external_organisation_contact_update(contact_id=sample_contact.id, payload=payload, user=user)

    def test_contact_delete_success(self, sample_contact, user):
        contact_id = sample_contact.id
        external_organisation_contact_delete(contact_id=contact_id, user=user)
        
        # Check that the contact is marked as deleted and audit fields are set
        # Assuming a manager like 'objects_including_deleted' or 'all_objects' exists on the model
        # to fetch soft-deleted records.
        try:
            # Try with a common manager name first
            deleted_contact = ExternalOrganisationContactModel.objects_including_deleted.get(id=contact_id)
        except AttributeError:
            # Fallback to another common name if the first one doesn't exist
            deleted_contact = ExternalOrganisationContactModel.all_objects.get(id=contact_id)
            
        assert deleted_contact.is_deleted is True
        assert deleted_contact.deleted_by == user
        assert deleted_contact.deleted_at is not None
        
        # Ensure it's not available through the default manager
        assert not ExternalOrganisationContactModel.objects.filter(id=contact_id).exists()

    def test_contact_delete_fail_not_found(self, user):
        non_existent_id = uuid.uuid4()
        with pytest.raises(Http404, match="No ExternalOrganisationContact matches the given query."):
            external_organisation_contact_delete(contact_id=non_existent_id, user=user)

