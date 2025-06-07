import pytest
from apps.optionlists.models import OptionList, OptionListItem
from apps.service_management.services import ServiceManagementOptionListService

@pytest.mark.django_db
class TestServiceManagementOptionListService:
    def test_get_batch_option_lists(self, db):
        # Setup: Create OptionLists and OptionListItems for slugs used by the service
        st_ol, _ = OptionList.objects.get_or_create(slug='service_management-service_types', defaults={'name':'Service Types'})
        OptionListItem.objects.get_or_create(option_list=st_ol, slug='st-online', defaults={'name':'Online Support', 'is_active': True})
        OptionListItem.objects.get_or_create(option_list=st_ol, slug='st-inperson', defaults={'name':'In-Person Support', 'is_active': True})

        dm_ol, _ = OptionList.objects.get_or_create(slug='service_management-delivery_modes', defaults={'name':'Delivery Modes'})
        OptionListItem.objects.get_or_create(option_list=dm_ol, slug='dm-remote', defaults={'name':'Remote Delivery', 'is_active': True})

        loc_ol, _ = OptionList.objects.get_or_create(slug='service_management-locations', defaults={'name':'Locations'})
        OptionListItem.objects.get_or_create(option_list=loc_ol, slug='loc-main', defaults={'name':'Main Office', 'is_active': True})

        # Call the service method (no arguments)
        result = ServiceManagementOptionListService.get_batch_option_lists()

        # Assertions for service_types
        assert 'service_types' in result
        active_st_items = OptionListItem.objects.filter(option_list=st_ol, is_active=True).count()
        assert len(result['service_types']) == active_st_items
        service_type_slugs = {item['slug'] for item in result['service_types']}
        assert 'st-online' in service_type_slugs
        assert 'st-inperson' in service_type_slugs

        # Assertions for delivery_modes
        assert 'delivery_modes' in result
        active_dm_items = OptionListItem.objects.filter(option_list=dm_ol, is_active=True).count()
        assert len(result['delivery_modes']) == active_dm_items
        if active_dm_items > 0: 
            assert any(item['slug'] == 'dm-remote' for item in result['delivery_modes'])

        # Assertions for locations
        assert 'locations' in result
        active_loc_items = OptionListItem.objects.filter(option_list=loc_ol, is_active=True).count()
        assert len(result['locations']) == active_loc_items
        if active_loc_items > 0: 
           assert any(item['slug'] == 'loc-main' for item in result['locations'])
        
        expected_keys = {'service_types', 'delivery_modes', 'locations'}
        assert set(result.keys()) == expected_keys
