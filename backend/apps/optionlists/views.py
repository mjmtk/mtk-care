from rest_framework import viewsets, filters, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import OptionList, OptionListItem
from .serializers import OptionListSerializer, OptionListItemSerializer
from .services import OptionListService, OptionListItemService

class OptionListViewSet(viewsets.ModelViewSet):
    queryset = OptionList.objects.all()
    serializer_class = OptionListSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["name", "description"]
    ordering_fields = ["name"]

    @action(detail=True, methods=["get"])
    def items(self, request, pk=None):
        """
        Returns all items for this optionlist.
        """
        optionlist = self.get_object()
        items = OptionListItem.objects.filter(option_list=optionlist)
        serializer = OptionListItemSerializer(items, many=True)
        return Response(serializer.data)

class OptionListItemViewSet(viewsets.ModelViewSet):
    queryset = OptionListItem.objects.all()
    serializer_class = OptionListItemSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["label", "value", "region"]
    ordering_fields = ["option_list", "display_order", "label"]

    def get_queryset(self):
        queryset = OptionListItem.objects.all()
        option_list_id = self.request.query_params.get("option_list")
        region = self.request.query_params.get("region")
        client_id = self.request.query_params.get("client")
        is_active = self.request.query_params.get("is_active", "true").lower() == "true"
        if option_list_id:
            option_list = OptionListService.get_option_list_by_id(option_list_id)
            if option_list:
                return OptionListItemService.get_items_for_scope(option_list, region, client_id, is_active)
            return OptionListItem.objects.none()
        return queryset

    # Generic alias endpoint: /api/optionlistitems/<slug>/
    @action(detail=False, methods=["get"], url_path=r"(?P<slug>[^/]+)")
    def by_slug(self, request, slug=None):
        """
        Returns OptionListItems for the given pluralized slug (flat or tree mode).
        Example: GET /api/optionlistitems/ethnicities/?tree=true
        """
        return self._option_list_items_by_slug(slug)

    # (Commented out: legacy explicit alias endpoints)
    # @action(detail=False, methods=["get"], url_path="client-statuses")
    # def client_statuses(self, request):
    #     return self._option_list_items_by_slug("client-statuses")
    # ... (repeat for other explicit aliases)

    def _option_list_items_by_slug(self, slug):
        """
        Returns all items for this optionlist alias (by slug).
        - If ?tree=true is present, returns only root items, each with nested children (recursive tree).
        - Otherwise, returns a flat list (default, for dropdowns).
        """
        from .serializers import OptionListItemSerializer, SimpleOptionListItemSerializer
        option_list = OptionList.objects.filter(slug=slug).first()
        if not option_list:
            return Response({"detail": f"OptionList with slug '{slug}' not found."}, status=status.HTTP_404_NOT_FOUND)
        items = OptionListItem.objects.filter(option_list=option_list, is_active=True).order_by("sort_order", "label")
        if self.request.query_params.get("tree", "false").lower() == "true":
            root_items = items.filter(parent__isnull=True)
            serializer = OptionListItemSerializer(root_items, many=True, context={"tree": True})
            return Response(serializer.data)
        else:
            serializer = SimpleOptionListItemSerializer(items, many=True)
            return Response(serializer.data)
