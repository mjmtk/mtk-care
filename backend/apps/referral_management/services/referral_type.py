from django.utils.translation import gettext_lazy as _
from typing import Any, Union
from django.db.models import QuerySet
from ..repositories import ReferralRepository

class ReferralTypeService:
    """
    Service for ReferralType business logic.
    """
    @staticmethod
    def get_all_types() -> QuerySet:
        return ReferralRepository.get_all_types()

    @staticmethod
    def get_type(type_id: Union[int, str]) -> Any:
        return ReferralRepository.get_type_by_id(type_id)
