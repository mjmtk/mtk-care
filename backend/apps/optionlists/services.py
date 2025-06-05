from typing import Optional, List, Any
from .models import OptionList, OptionListItem
from typing import Dict
from django.db.models import QuerySet, Case, When
from django.db import models # Added for models.Case, models.When if not covered by direct import
from .models import OptionList, OptionListItem
from .repositories import OptionListRepository, OptionListItemRepository
# from apps.client_management.schemas import (
#     ClientBatchDropdownsOut,
#     SimpleDropdownItemOut,
#     LanguageDropdownItemOut,
#     CulturalGroupDropdownItemOut,
#     CountryDropdownItemOut
# )
# from apps.reference_data.models import Country, Language
# from apps.cultural_groups.models import CulturalGroup

class OptionListService:
    @staticmethod
    def get_active_items_for_list_slug(list_slug: str) -> List[OptionListItem]:
        """
        Retrieves all active OptionListItems for a given OptionList slug,
        ordered by sort_order (assuming repository handles ordering).
        """
        try:
            # Assuming OptionListRepository.get_by_slug does not need organization_id for global lists like 'external-organisation-types'
            # If OptionListRepository.get_by_slug can't find the list, it should raise an exception (e.g., OptionList.DoesNotExist)
            option_list = OptionListRepository.get_by_slug(slug=list_slug, organization_id=None) # Explicitly pass None if org_id is not relevant here
            if option_list:
                # OptionListItemService.get_items_for_scope already handles active_only=True
                # and repository should handle ordering by sort_order.
                return OptionListItemService.get_items_for_scope(option_list=option_list, active_only=True)
        except OptionList.DoesNotExist:
            # This case will be handled by the API layer to return a 404 if the list itself is not found.
            return []
        return []

    @staticmethod
    def _get_option_list_items(slug: str, organization_id: Optional[Any] = None) -> List[OptionListItem]:
        option_list = OptionListRepository.get_by_slug(slug=slug, organization_id=organization_id)
        if option_list:
            # Assuming get_items_for_scope handles active_only and ordering by sort_order
            return list(OptionListItemService.get_items_for_scope(option_list=option_list, active_only=True))
        return []

    # @staticmethod
    # def get_options_for_client_batch_dropdowns(organization_id: Optional[Any] = None) -> ClientBatchDropdownsOut:
    #     """
    #     Fetches all necessary dropdown items for the client management context.
    #     Uses OptionListItem for most dropdowns, and dedicated models for Countries and Cultural Groups.
    #     """
    #     # OptionListItem based dropdowns
    #     client_statuses_items = OptionListService._get_option_list_items('client-statuses', organization_id)
    #     pronouns_items = OptionListService._get_option_list_items('pronouns', organization_id)
    #     # languages_items = OptionListService._get_option_list_items('languages', organization_id) # Fetched from dedicated model below
    #     ethnicities_items = OptionListService._get_option_list_items('ethnicities', organization_id)
    #     primary_identities_items = OptionListService._get_option_list_items('primary-identities', organization_id)
    #     secondary_identities_items = OptionListService._get_option_list_items('secondary-identities', organization_id)
    #     client_required_documents_items = OptionListService._get_option_list_items('client-required-documents', organization_id)
    #     document_types_items = OptionListService._get_option_list_items('document-types', organization_id)
    #     bypass_reasons_items = OptionListService._get_option_list_items('bypass-reasons', organization_id)

    #     # Dedicated model based dropdowns
    #     active_countries = list(Country.objects.filter(is_active=True).order_by(
    #         Case(
    #             When(code="NZL", then=0),
    #             When(code="AUS", then=1),
    #             default=2,
    #             output_field=models.IntegerField(),
    #         ),
    #         'name'
    #     ))
    #     active_cultural_groups = list(CulturalGroup.objects.filter(is_active=True).order_by('name'))
    #     active_languages = list(Language.objects.filter(is_active=True).order_by(
    #         Case(
    #             When(code="mi", then=0),  # Te Reo Māori
    #             When(code="en", then=1),
    #             When(code="sm", then=2),
    #             default=3,
    #             output_field=models.IntegerField(),
    #         ),
    #         'name'
    #     ))

    #     return ClientBatchDropdownsOut(
    #         client_statuses=[SimpleDropdownItemOut.model_validate(item) for item in client_statuses_items],
    #         pronouns=[SimpleDropdownItemOut.model_validate(item) for item in pronouns_items],
    #         languages=[LanguageDropdownItemOut.model_validate(lang) for lang in active_languages],
    #         ethnicities=[SimpleDropdownItemOut.model_validate(item) for item in ethnicities_items],
    #         primary_identities=[SimpleDropdownItemOut.model_validate(item) for item in primary_identities_items],
    #         secondary_identities=[SimpleDropdownItemOut.model_validate(item) for item in secondary_identities_items],
    #         cultural_groups=[CulturalGroupDropdownItemOut.model_validate(cg) for cg in active_cultural_groups],
    #         countries=[CountryDropdownItemOut.model_validate(c) for c in active_countries],
    #         client_required_documents=[SimpleDropdownItemOut.model_validate(item) for item in client_required_documents_items],
    #         document_types=[SimpleDropdownItemOut.model_validate(item) for item in document_types_items],
    #         bypass_reasons=[SimpleDropdownItemOut.model_validate(item) for item in bypass_reasons_items],
    #     )

    """
    Service for OptionList business logic.
    """
    @staticmethod
    def get_option_list_by_id(option_list_id) -> Optional[OptionList]:
        return OptionListRepository.get_by_id(option_list_id)

    @staticmethod
    def get_option_list_by_name(name: str) -> Optional[OptionList]:
        return OptionListRepository.get_by_name(name)

    @staticmethod
    def get_all_option_lists() -> List[OptionList]:
        return OptionListRepository.get_all()


class OptionListItemService:
    """
    Service for OptionListItem business logic, including scoping logic.
    """
    @staticmethod
    def get_items_for_scope(option_list: OptionList, region: Optional[str] = None, client_id: Optional[str] = None, active_only: bool = True) -> List[OptionListItem]:
        return list(OptionListItemRepository.get_items(option_list, region, client_id, active_only))
