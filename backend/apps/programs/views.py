from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import ServiceProgram, Enrolment, ServiceAssignedStaff
from .serializers import (
    ServiceProgramSerializer, EnrolmentSerializer, ServiceAssignedStaffSerializer
)
# Import serializers and models for option lists
from apps.optionlists.models import OptionList, OptionListItem
from apps.optionlists.serializers import SimpleOptionListItemSerializer

from django.utils import timezone

class ServiceProgramViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing ServiceProgram objects.

    - Uses soft delete (is_deleted, deleted_at, deleted_by) for removal/archival.
    - The is_active field is no longer used; use status and is_deleted.
    - STATUS_CHOICES includes 'inactive' for services that have completed setup but are not yet operational.
    """
    queryset = ServiceProgram.objects.filter(is_deleted=False)
    serializer_class = ServiceProgramSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.deleted_at = timezone.now()
        if hasattr(instance, 'deleted_by') and request.user.is_authenticated:
            instance.deleted_by = str(request.user)
        instance.save()
        return Response(status=204)

    def create(self, request, *args, **kwargs):
        from apps.optionlists.models import OptionListItem
        print('DEBUG: Incoming data:', request.data)
        print('DEBUG: All OptionListItems:', list(OptionListItem.objects.values('id', 'option_list_id', 'slug', 'name')))
        st_qs = OptionListItem.objects.filter(option_list__slug='service_management-service-types')
        dm_qs = OptionListItem.objects.filter(option_list__slug='service_management-delivery-modes')
        print('DEBUG: service_types queryset:', list(st_qs.values('id', 'slug', 'name')))
        print('DEBUG: delivery_modes queryset:', list(dm_qs.values('id', 'slug', 'name')))
        return super().create(request, *args, **kwargs)

class EnrolmentViewSet(viewsets.ModelViewSet):
    queryset = Enrolment.objects.all()
    serializer_class = EnrolmentSerializer

from rest_framework import mixins

class ServiceAssignedStaffViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = ServiceAssignedStaffSerializer

    def get_queryset(self):
        queryset = ServiceAssignedStaff.objects.all()
        service_program_uuid = self.request.query_params.get('service_program')
        if service_program_uuid:
            queryset = queryset.filter(service_program__id=service_program_uuid)
        return queryset
    # This endpoint is now read-only (GET/list only) and filters by service_program UUID.


from .serializers import ServiceBatchOptionListsResponseSerializer

class ServiceBatchOptionListsView(APIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ServiceBatchOptionListsResponseSerializer

    def get(self, request, *args, **kwargs):
        # Define the slugs for the dropdowns
        dropdown_slugs = {
            "service_types": "service_management-service-types",
            "delivery_modes": "service_management-delivery-modes",
            "locations": "service_management-locations",
        }
        response_data = {}
        for key, slug in dropdown_slugs.items():
            option_list = OptionList.objects.filter(slug=slug).first()
            if option_list:
                items = OptionListItem.objects.filter(option_list=option_list, is_active=True).order_by("sort_order", "label")
                serializer = SimpleOptionListItemSerializer(items, many=True)
                response_data[key] = serializer.data
            else:
                response_data[key] = []

        # --- Add JSON Schema for ServiceProgram (using drf-spectacular) ---
        from .utils import get_service_program_json_schema
        response_data["schema"] = get_service_program_json_schema()
        return Response(response_data)