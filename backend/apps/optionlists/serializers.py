from rest_framework import serializers
from .models import OptionList, OptionListItem

from apps.reference_data.models import Country

class OptionListSerializer(serializers.ModelSerializer):
    country = serializers.PrimaryKeyRelatedField(queryset=Country.objects.all(), allow_null=True, required=False)
    class Meta:
        model = OptionList
        fields = ['id', 'name', 'description', 'country', 'global_option_list', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

from apps.client_management.models import Client

class OptionListItemSerializer(serializers.ModelSerializer):
    """
    Serializer for OptionListItem. Always includes 'id' (UUID), exposes 'parent' as UUID, and optionally nests children for tree API.
    """
    option_list = serializers.PrimaryKeyRelatedField(queryset=OptionList.objects.all())
    client = serializers.PrimaryKeyRelatedField(allow_null=True, required=False, queryset=Client.objects.all(), default=None)
    country = serializers.PrimaryKeyRelatedField(queryset=Country.objects.all(), allow_null=True, required=False)
    parent = serializers.PrimaryKeyRelatedField(queryset=OptionListItem.objects.all(), allow_null=True, required=False)
    children = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = OptionListItem
        fields = [
            'id', 'option_list', 'label', 'slug', 'region', 'client', 'country', 'global_option', 'is_active', 'sort_order',
            'parent', 'children', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'children']

    def get_children(self, obj) -> list | None:
        # Only return children if explicitly requested in context (for tree API)
        if self.context.get('tree', False):
            children = obj.children.all().order_by('sort_order', 'label')
            return OptionListItemSerializer(children, many=True, context=self.context).data
        return None

class SimpleOptionListItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptionListItem
        fields = ['id', 'label', 'slug', 'sort_order']
