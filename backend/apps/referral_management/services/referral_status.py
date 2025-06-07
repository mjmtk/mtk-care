from django.utils.translation import gettext_lazy as _
from typing import Any, Union
from django.db.models import QuerySet
from ..repositories import ReferralRepository

class ReferralStatusService:
    """
    Service for ReferralStatus business logic.
    """
    @staticmethod
    def get_all_statuses() -> QuerySet:
        return ReferralRepository.get_all_statuses()

    @staticmethod
    def get_status(status_id: Union[int, str]) -> Any:
        return ReferralRepository.get_status_by_id(status_id)
