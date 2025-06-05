from rest_framework import viewsets, permissions
from django.conf import settings
from apps.azure_sync.models import AzureUser
from rest_framework import serializers

class AzureUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = AzureUser
        fields = [
            'id', 'azure_id', 'user_principal_name', 'display_name', 'email',
            'first_name', 'last_name', 'is_active', 'last_sync'
        ]

class DevAllowAnyOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        # Allow all requests in dev mode (DEV_USER_ID or DEBUG), otherwise require admin
        if getattr(settings, "DEV_USER_ID", None) or getattr(settings, "DEBUG", False):
            return True
        return bool(request.user and request.user.is_staff)

class AzureUserViewSet(viewsets.ReadOnlyModelViewSet):
    """List and retrieve Azure users."""
    queryset = AzureUser.objects.all()
    serializer_class = AzureUserSerializer
    permission_classes = [DevAllowAnyOrAdmin]
    lookup_field = 'azure_id'
