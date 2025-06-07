from django.utils.translation import gettext_lazy as _
from typing import Any, Union
from django.db.models import QuerySet
from ..repositories import ServiceTypeRepository

class ServiceTypeService:
    """
    Service for ServiceType business logic.
    """
    @staticmethod
    def get_all_service_types() -> QuerySet:
        return ServiceTypeRepository.get_all_service_types()

    @staticmethod
    def get_service_type(service_type_id: Union[int, str]) -> Any:
        return ServiceTypeRepository.get_service_type_by_id(service_type_id)
