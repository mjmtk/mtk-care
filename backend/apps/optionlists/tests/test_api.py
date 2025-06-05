from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from apps.optionlists.models import OptionList, OptionListItem
from apps.optionlists.services import OptionListService, OptionListItemService
import unittest
from django.contrib.auth import get_user_model


# --- API Tests ---

from apps.reference_data.models import Country
from apps.cultural_groups.models import CulturalGroup

class OptionListAPITestCase(APITestCase):
    """
    Tests for legacy/flat OptionList and OptionListItem APIs. Does not test tree endpoints.
    """
    def setUp(self):
        # Create and login a superuser for API auth
        User = get_user_model()
        self.user = User.objects.create_superuser(username="apitest", email="apitest@example.com", password="testpass")
        self.client.force_login(self.user)
        # Create a country for testing
        self.country = Country.objects.create(code="NZL", name="New Zealand")
        # Restore original option_list1 and option_list2 for legacy tests
        self.option_list1 = OptionList.objects.create(name="Languages", description="Supported languages")
        self.option_list2 = OptionList.objects.create(name="Pronouns", description="Supported pronouns")
        self.item1 = OptionListItem.objects.create(option_list=self.option_list1, slug="en", name="en", label="English", is_active=True)
        self.item2 = OptionListItem.objects.create(option_list=self.option_list1, slug="es", name="es", label="Spanish", is_active=True)
        self.item3 = OptionListItem.objects.create(option_list=self.option_list2, slug="he", name="he", label="He/Him", is_active=True)

    @unittest.skip("Skipping test: POST /api/optionlists/ endpoint not implemented.")
    def test_create_optionlist_with_country_and_global(self):
        url = "/api/optionlists/"
        data = {
            "name": "Ethnicities",
            "description": "Ethnic groups",
            "country": self.country.id,
            "global_option_list": True
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["country"], self.country.id)
        self.assertTrue(response.data["global_option_list"])

    @unittest.skip("Skipping test: POST /api/optionlistitems/ endpoint not implemented.")
    def test_create_optionlistitem_with_country_and_global(self):
        # Create an option list to attach the item to
        option_list = OptionList.objects.create(name="Identities", description="Identity types")
        url = "/api/optionlistitems/"
        data = {
            "option_list": option_list.id,
            "slug": "test-item",
            "name": "Test Item",
            "label": "Test Item Label",
            "country": self.country.id,
            "global_option": True,
            "is_active": True,
            "sort_order": 1
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["country"], self.country.id)
        self.assertTrue(response.data["global_option"])


class TestClientBatchDropdownsAPI(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_superuser(username="batchtest", email="batchtest@example.com", password="testpass")
        self.client.force_login(self.user)

        # OptionLists
        self.client_statuses_list = OptionList.objects.create(name="Client Statuses", slug="client-statuses")
        self.pronouns_list = OptionList.objects.create(name="Pronouns", slug="pronouns")
        self.ethnicities_list = OptionList.objects.create(name="Ethnicities", slug="ethnicities")
        self.primary_identities_list = OptionList.objects.create(name="Primary Identities", slug="primary-identities")
        self.secondary_identities_list = OptionList.objects.create(name="Secondary Identities", slug="secondary-identities")

        # OptionListItems
        OptionListItem.objects.create(option_list=self.client_statuses_list, name="Active", label="Active", slug="active", is_active=True, sort_order=1)
        OptionListItem.objects.create(option_list=self.client_statuses_list, name="Inactive", label="Inactive", slug="inactive", is_active=False, sort_order=2)
        OptionListItem.objects.create(option_list=self.client_statuses_list, name="Pending", label="Pending", slug="pending", is_active=True, sort_order=0)

        OptionListItem.objects.create(option_list=self.pronouns_list, name="He/Him", label="He/Him", slug="he-him", is_active=True, sort_order=0)
        OptionListItem.objects.create(option_list=self.pronouns_list, name="She/Her", label="She/Her", slug="she-her", is_active=True, sort_order=1)

        OptionListItem.objects.create(option_list=self.ethnicities_list, name="NZ European", label="NZ European", slug="nz-european", is_active=True, sort_order=0)
        OptionListItem.objects.create(option_list=self.primary_identities_list, name="Man", label="Man", slug="man", is_active=True, sort_order=0)
        OptionListItem.objects.create(option_list=self.secondary_identities_list, name="Woman", label="Woman", slug="woman", is_active=True, sort_order=0)

        # Language Model Instances (not OptionListItems)
        from apps.reference_data.models import Language # Import here to avoid circular dependency issues at module level if any
        Language.objects.create(code="en", name="English", is_active=True)
        Language.objects.create(code="es", name="Spanish", is_active=True)
        Language.objects.create(code="mi", name="Te Reo Māori", is_active=False) # Test inactive

        # Countries
        self.nz = Country.objects.create(code="NZ", name="New Zealand", is_active=True)
        self.au = Country.objects.create(code="AU", name="Australia", is_active=True)
        self.us = Country.objects.create(code="US", name="United States", is_active=False)

        # Cultural Groups
        self.maori_group = CulturalGroup.objects.create(name="Maori Test Group", slug="maori-test-group", type="iwi", country=self.nz, is_active=True)
        self.pasifika_group = CulturalGroup.objects.create(name="Pasifika Test Group", slug="pasifika-test-group", type="community", country=self.nz, is_active=True)
        self.aboriginal_group = CulturalGroup.objects.create(name="Aboriginal Test Group", slug="aboriginal-test-group", type="nation", country=self.au, is_active=False)

        self.expected_top_level_keys = [
            "client_statuses", "pronouns", "languages", "ethnicities",
            "primary_identities", "secondary_identities", "cultural_groups",
            "countries", "client_required_documents", "document_types", "bypass_reasons"
        ]

    def test_get_client_batch_dropdowns_success_and_structure(self):
        url = "/api/optionlists/client-batch-dropdowns/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response_data = response.json()
        for key in self.expected_top_level_keys:
            self.assertIn(key, response_data)

    def test_client_statuses_data_and_order(self):
        url = "/api/optionlists/client-batch-dropdowns/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()

        client_statuses = response_data.get("client_statuses", [])
        self.assertEqual(len(client_statuses), 2) # Active and Pending
        self.assertEqual(client_statuses[0]["name"], "Pending") # Sorted by sort_order
        self.assertEqual(client_statuses[1]["name"], "Active")
        for item in client_statuses:
            self.assertIn("id", item)
            self.assertIn("name", item)
            self.assertIn("slug", item)

    def test_languages_data_and_order(self):
        url = "/api/optionlists/client-batch-dropdowns/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()

        languages = response_data.get("languages", [])
        self.assertEqual(len(languages), 2) # English and Spanish (Te Reo Māori is inactive)
        # Order is defined in service: mi, en, sm, then by name. So English should be first of active.
        self.assertEqual(languages[0]["name"], "English") 
        self.assertEqual(languages[0]["code"], "en")     # Code is lowercase 'en' from model
        self.assertEqual(languages[1]["name"], "Spanish")
        self.assertEqual(languages[1]["code"], "es")     # Code is lowercase 'es' from model
        for item in languages:
            self.assertIn("id", item)
            self.assertIn("name", item) # Check for 'name' not 'label'
            # self.assertIn("slug", item) # LanguageDropdownItemOut does not have slug
            self.assertIn("code", item)

    def test_countries_data(self):
        url = "/api/optionlists/client-batch-dropdowns/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()

        countries = response_data.get("countries", [])
        self.assertEqual(len(countries), 2) # NZ and AU (US is inactive)
        country_names = [c["name"] for c in countries]
        self.assertIn("New Zealand", country_names)
        self.assertIn("Australia", country_names)
        for item in countries:
            self.assertIn("id", item)
            self.assertIn("name", item)
            self.assertIn("code", item)

    def test_pronouns_data(self):
        url = "/api/optionlists/client-batch-dropdowns/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()

        pronouns = response_data.get("pronouns", [])
        self.assertGreater(len(pronouns), 0, "Pronouns list should not be empty")
        self.assertEqual(len(pronouns), 2) 
        self.assertEqual(pronouns[0]["name"], "He/Him")
        self.assertEqual(pronouns[1]["name"], "She/Her")
        for item in pronouns:
            self.assertIn("id", item)
            self.assertIn("name", item)
            self.assertIn("slug", item)

    def test_ethnicities_data(self):
        url = "/api/optionlists/client-batch-dropdowns/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()

        ethnicities = response_data.get("ethnicities", [])
        self.assertGreater(len(ethnicities), 0, "Ethnicities list should not be empty")
        self.assertEqual(len(ethnicities), 1)
        self.assertEqual(ethnicities[0]["name"], "NZ European")
        for item in ethnicities:
            self.assertIn("id", item)
            self.assertIn("name", item)
            self.assertIn("slug", item)

    def test_primary_identities_data(self):
        url = "/api/optionlists/client-batch-dropdowns/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()

        primary_identities = response_data.get("primary_identities", [])
        self.assertGreater(len(primary_identities), 0, "Primary Identities list should not be empty")
        self.assertEqual(len(primary_identities), 1)
        self.assertEqual(primary_identities[0]["name"], "Man")
        for item in primary_identities:
            self.assertIn("id", item)
            self.assertIn("name", item)
            self.assertIn("slug", item)

    def test_secondary_identities_data(self):
        url = "/api/optionlists/client-batch-dropdowns/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()

        secondary_identities = response_data.get("secondary_identities", [])
        self.assertGreater(len(secondary_identities), 0, "Secondary Identities list should not be empty")
        self.assertEqual(len(secondary_identities), 1)
        self.assertEqual(secondary_identities[0]["name"], "Woman")
        for item in secondary_identities:
            self.assertIn("id", item)
            self.assertIn("name", item)
            self.assertIn("slug", item)

    def test_cultural_groups_data(self):
        url = "/api/optionlists/client-batch-dropdowns/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        response_data = response.json()

        cultural_groups = response_data.get("cultural_groups", [])
        self.assertEqual(len(cultural_groups), 2) # Maori and Pasifika (Aboriginal is inactive)
        group_names = [cg["name"] for cg in cultural_groups]
        self.assertIn("Maori Test Group", group_names)
        self.assertIn("Pasifika Test Group", group_names)
        self.assertNotIn("Aboriginal Test Group", group_names) # Aboriginal is inactive
        for item in cultural_groups:
            self.assertIn("id", item)
            self.assertIn("name", item)
            self.assertIn("country_id", item)
