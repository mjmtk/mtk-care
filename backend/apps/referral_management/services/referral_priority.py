from django.utils.translation import gettext_lazy as _
from typing import Any, Union
from django.db.models import QuerySet
from ..repositories import ReferralRepository

class ReferralPriorityService:
    """
    Service for ReferralPriority business logic.
    """
    @staticmethod
    def get_all_priorities() -> QuerySet:
        return ReferralRepository.get_all_priorities()

    @staticmethod
    def get_priority(priority_id: Union[int, str]) -> Any:
        return ReferralRepository.get_priority_by_id(priority_id)
