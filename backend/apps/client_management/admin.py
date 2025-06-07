from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'first_name', 'last_name', 'preferred_name', 
        'date_of_birth', 'status', 'risk_level', 'primary_language'
    )
    list_filter = (
        'status', 'risk_level', 'primary_language', 
        'interpreter_needed', 'consent_required', 'incomplete_documentation'
    )
    search_fields = ('first_name', 'last_name', 'preferred_name', 'email', 'phone')
    date_hierarchy = 'date_of_birth'
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        (_('Personal Information'), {
            'fields': (
                'first_name', 'last_name', 'preferred_name', 'date_of_birth'
            )
        }),
        (_('Contact Information'), {
            'fields': ('email', 'phone', 'address')
        }),
        (_('Status & Language'), {
            'fields': (
                'status', 'primary_language', 'interpreter_needed'
            )
        }),
        (_('Risk & Safety'), {
            'fields': ('risk_level', 'consent_required', 'incomplete_documentation')
        }),
        (_('Cultural Identity'), {
            'fields': ('cultural_identity',),
            'classes': ('collapse',)
        }),
        (_('Additional Information'), {
            'fields': ('notes', 'extended_data'),
            'classes': ('collapse',)
        }),
        (_('Audit Information'), {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related for foreign keys."""
        return super().get_queryset(request).select_related(
            'status', 'primary_language'
        )
