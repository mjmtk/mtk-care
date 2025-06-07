import pytest
import uuid
from django.core.exceptions import ObjectDoesNotExist
from django.http import Http404

from apps.external_organisation_management.models import (
    ExternalOrganisation as ExternalOrganisationModel
)
from apps.external_organisation_management.schemas import ExternalOrganisationSchemaIn
from apps.external_organisation_management.services import (
    external_organisation_create,
    external_organisation_get,
    external_organisation_list,
    external_organisation_update,
    external_organisation_delete,
    external_organisation_list_service_providers,
)
from apps.optionlists.models import OptionListItem, OptionList

pytestmark = pytest.mark.django_db

class TestExternalOrganisationServices:
    def test_organisation_create_success(self, service_provider_type, user):
        payload = ExternalOrganisationSchemaIn(
            name="New Awesome Org",
            type_id=service_provider_type.id,
            phone="09-555-1234",
            email="contact@awesome.org",
            address="1 Awesome Ave, Awesometown",
            is_active=True
        )
        org = external_organisation_create(payload=payload, user=user)
        assert org is not None
        assert org.name == "New Awesome Org"
        assert org.type == service_provider_type
        assert org.phone == "09-555-1234"
        assert org.email == "contact@awesome.org"
        assert org.address == "1 Awesome Ave, Awesometown"
        assert org.is_active is True
        assert ExternalOrganisationModel.objects.filter(id=org.id).exists()

    def test_organisation_create_fail_invalid_type_id(self, user):
        invalid_type_id = 999999999  # An integer ID that's unlikely to exist
        payload = ExternalOrganisationSchemaIn(
            name="Org With Invalid Type",
            type_id=invalid_type_id
        )
        with pytest.raises(ValueError, match=f"Invalid type_id: {invalid_type_id}. Organisation type not found."):
            external_organisation_create(payload=payload, user=user)

    def test_organisation_get_success(self, sample_external_organisation):
        retrieved_org = external_organisation_get(organisation_id=sample_external_organisation.id)
        assert retrieved_org is not None
        assert retrieved_org.id == sample_external_organisation.id
        assert retrieved_org.name == sample_external_organisation.name
        assert retrieved_org.contacts.all() is not None
        assert retrieved_org.phones.all() is not None
        assert retrieved_org.emails.all() is not None


    def test_organisation_get_fail_not_found(self):
        non_existent_id = uuid.uuid4()
        with pytest.raises(Http404, match="No ExternalOrganisation matches the given query."):
            external_organisation_get(organisation_id=non_existent_id)

    def test_organisation_list_no_filters(self, sample_external_organisation, another_external_organisation):
        result = external_organisation_list(filters=None)
        assert len(result) >= 2
        org_ids = [o.id for o in result]
        assert sample_external_organisation.id in org_ids
        assert another_external_organisation.id in org_ids
        
    def test_organisation_list_filter_by_type_id(self, sample_external_organisation, another_external_organisation, service_provider_type, funder_type):
        filters_service_provider = {'type_id': service_provider_type.id}
        result_sp = external_organisation_list(filters=filters_service_provider)
        assert sample_external_organisation in result_sp
        assert another_external_organisation not in result_sp
        for org in result_sp:
            assert org.type == service_provider_type

        filters_funder = {'type_id': funder_type.id}
        result_funder = external_organisation_list(filters=filters_funder)
        assert another_external_organisation in result_funder
        assert sample_external_organisation not in result_funder
        for org in result_funder:
            assert org.type == funder_type
            
    def test_organisation_list_filter_by_is_active(self, sample_external_organisation, another_external_organisation):
        sample_external_organisation.is_active = False
        sample_external_organisation.save()
        
        filters_active = {'is_active': True}
        result_active = external_organisation_list(filters=filters_active)
        assert another_external_organisation in result_active
        assert sample_external_organisation not in result_active
        for org in result_active:
            assert org.is_active is True
            
        filters_inactive = {'is_active': False}
        result_inactive = external_organisation_list(filters=filters_inactive)
        assert sample_external_organisation in result_inactive
        assert another_external_organisation not in result_inactive
        for org in result_inactive:
            assert org.is_active is False
        
        sample_external_organisation.is_active = True
        sample_external_organisation.save()

    def test_organisation_list_empty(self):
        ExternalOrganisationModel.objects.all().delete()
        result = external_organisation_list(filters=None)
        assert len(result) == 0

    def test_organisation_update_fields_success(self, sample_external_organisation, funder_type, user):
        payload = ExternalOrganisationSchemaIn(
            name="Updated Org Name",
            type_id=funder_type.id,
            phone="09-UPDATED",
            email="updated@org.com",
            address="Updated Address",
            is_active=False
        )
        updated_org = external_organisation_update(organisation_id=sample_external_organisation.id, payload=payload, user=user)
        assert updated_org.name == "Updated Org Name"
        assert updated_org.type == funder_type
        assert updated_org.phone == "09-UPDATED"
        assert updated_org.email == "updated@org.com"
        assert updated_org.address == "Updated Address"
        assert updated_org.is_active is False

    def test_organisation_update_fail_not_found(self, service_provider_type, user):
        non_existent_id = uuid.uuid4()
        payload = ExternalOrganisationSchemaIn(name="Fail Update", type_id=str(service_provider_type.id))
        with pytest.raises(Http404, match="No ExternalOrganisation matches the given query."):
            external_organisation_update(organisation_id=non_existent_id, payload=payload, user=user)

    def test_organisation_update_fail_invalid_new_type_id(self, sample_external_organisation, user):
        invalid_type_id = 999999999  # An integer ID that's unlikely to exist
        payload = ExternalOrganisationSchemaIn(
            name=sample_external_organisation.name,
            type_id=invalid_type_id
        )
        with pytest.raises(ValueError, match=f"Invalid new type_id: {invalid_type_id}. Organisation type not found."):
            external_organisation_update(organisation_id=sample_external_organisation.id, payload=payload, user=user)

    def test_organisation_delete_success(self, sample_external_organisation, user):
        org_id = sample_external_organisation.id
        external_organisation_delete(organisation_id=org_id, user=user)
        assert not ExternalOrganisationModel.objects.filter(id=org_id).exists()

    def test_organisation_delete_fail_not_found(self, user):
        non_existent_id = uuid.uuid4()
        with pytest.raises(Http404, match="No ExternalOrganisation matches the given query."):
            external_organisation_delete(organisation_id=non_existent_id, user=user)

    def test_list_service_providers_success(self, sample_external_organisation, another_external_organisation, service_provider_type, funder_type):
        sample_external_organisation.is_active = True
        sample_external_organisation.save()

        another_external_organisation.is_active = True
        another_external_organisation.save()
        
        org3, _ = ExternalOrganisationModel.objects.get_or_create(
            name="Active SP Org 2",
            type=service_provider_type,
            defaults={'is_active': True}
        )
        org4, _ = ExternalOrganisationModel.objects.get_or_create(
            name="Inactive SP Org",
            type=service_provider_type,
            defaults={'is_active': False}
        )

        result = external_organisation_list_service_providers()
        assert len(result) == 2
        result_ids = [o.id for o in result]
        assert sample_external_organisation.id in result_ids
        assert org3.id in result_ids
        assert another_external_organisation.id not in result_ids
        assert org4.id not in result_ids

    def test_list_service_providers_no_service_provider_option_list_item(self, ext_org_type_option_list):
        OptionListItem.objects.filter(option_list=ext_org_type_option_list, slug='service-provider').delete()
        result = external_organisation_list_service_providers()
        assert len(result) == 0

    def test_list_service_providers_no_external_org_types_option_list(self):
        OptionList.objects.filter(slug='external_organisation-types').delete()
        result = external_organisation_list_service_providers()
        assert len(result) == 0


    def test_list_service_providers_no_matching_orgs(self, service_provider_type):
        ExternalOrganisationModel.objects.filter(type=service_provider_type).delete()
        result = external_organisation_list_service_providers()
        assert len(result) == 0

    def test_list_service_providers_only_active(self, service_provider_type):
        ExternalOrganisationModel.objects.filter(type=service_provider_type).update(is_active=False)
        
        active_sp, _ = ExternalOrganisationModel.objects.get_or_create(
            name="Only Active SP",
            type=service_provider_type,
            defaults={'is_active': True}
        )
        ExternalOrganisationModel.objects.get_or_create(
            name="Truly Inactive SP",
            type=service_provider_type,
            defaults={'is_active': False}
        )

        result = external_organisation_list_service_providers()
        assert len(result) == 1
        assert result[0].id == active_sp.id
        assert result[0].is_active is True

