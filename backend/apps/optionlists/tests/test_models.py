from django.test import TestCase
from apps.optionlists.models import OptionList, OptionListItem


class ServiceCategoryFixturesTest(TestCase):
    fixtures = ['5_referral-service-types.json']

    def test_referral_service_categories_loaded(self):
        """Test that the main OptionList and a sample parent/child are loaded correctly."""
        try:
            service_categories_list = OptionList.objects.get(pk=5)
        except OptionList.DoesNotExist:
            self.fail("OptionList with pk=5 (Referral Service Categories) was not loaded.")

        self.assertEqual(service_categories_list.name, "Referral Service Categories")
        self.assertEqual(service_categories_list.slug, "referral-service-categories")

        # Test a top-level parent category: Government Agencies
        try:
            govt_agencies = OptionListItem.objects.get(
                option_list=service_categories_list,
                name="Government Agencies"
            )
        except OptionListItem.DoesNotExist:
            self.fail("OptionListItem 'Government Agencies' was not loaded.")
        self.assertIsNone(govt_agencies.parent, "'Government Agencies' should have no parent.")

        # Test a child category: Oranga Tamariki, child of Government Agencies
        try:
            oranga_tamariki = OptionListItem.objects.get(
                option_list=service_categories_list,
                name="Oranga Tamariki"
            )
        except OptionListItem.DoesNotExist:
            self.fail("OptionListItem 'Oranga Tamariki' was not loaded.")

        self.assertIsNotNone(oranga_tamariki.parent, "'Oranga Tamariki' should have a parent.")
        self.assertEqual(oranga_tamariki.parent, govt_agencies,
                         f"'Oranga Tamariki' parent should be 'Government Agencies', got '{oranga_tamariki.parent.name if oranga_tamariki.parent else None}'.")

    def test_all_top_level_categories_have_no_parent(self):
        """Verify all defined top-level categories are loaded and have no parent."""
        service_categories_list = OptionList.objects.get(pk=5)
        top_level_names = [
            "Government Agencies", "Education Providers", "Health Services", 
            "Community Support", "Iwi and Cultural Services", "Specialized Support"
        ]
        
        loaded_top_level_items = OptionListItem.objects.filter(
            option_list=service_categories_list,
            name__in=top_level_names,
            parent__isnull=True
        )
        self.assertEqual(len(top_level_names), 6, "Fixture defines 6 top-level categories.") # Sanity check for test definition
        self.assertEqual(loaded_top_level_items.count(), len(top_level_names),
                         f"Expected {len(top_level_names)} top-level categories with no parent, found {loaded_top_level_items.count()}.")

        for name in top_level_names:
            self.assertTrue(loaded_top_level_items.filter(name=name).exists(),
                            f"Top-level category '{name}' was not found or has a parent.")

    def test_all_child_categories_have_correct_parent(self):
        """Verify a sample of child categories are loaded and linked to the correct parent."""
        service_categories_list = OptionList.objects.get(pk=5)
        
        children_parent_map = {
            "Oranga Tamariki": "Government Agencies",
            "Work and Income New Zealand": "Government Agencies",
            "Child and Adolescent Mental Health Services (CAMHS)": "Health Services",
            "Food Banks and Pantries": "Community Support",
            "Budgeting and Financial Mentoring": "Specialized Support",
            "Disability Support Services": "Specialized Support",
            "Refugee Support Services": "Specialized Support",
        }

        for child_name, parent_name in children_parent_map.items():
            try:
                child_item = OptionListItem.objects.get(
                    option_list=service_categories_list,
                    name=child_name
                )
                # Parent is asserted by name, assuming names are unique within this OptionList for parents
                expected_parent_item = OptionListItem.objects.get(
                    option_list=service_categories_list,
                    name=parent_name
                )
            except OptionListItem.DoesNotExist as e:
                self.fail(f"Could not find OptionListItem '{child_name}' or its expected parent '{parent_name}': {e}")

            self.assertIsNotNone(child_item.parent, f"Child item '{child_name}' should have a parent.")
            self.assertEqual(child_item.parent, expected_parent_item,
                             f"Child '{child_name}' parent is '{child_item.parent.name if child_item.parent else None}', expected '{parent_name}'.")
