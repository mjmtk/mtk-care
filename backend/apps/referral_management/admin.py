# manaaki_care/referral_system/admin.py
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
# from simple_history.admin import SimpleHistoryAdmin  # Temporarily disabled
from .models import Referral






class ReferralPriorityAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'order', 'is_active')







@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ('id', 'client_type', 'service_type', 'type', 'status', 'priority', 'referral_date')
    list_filter = ('status', 'priority', 'type', 'service_type', 'client_type', 'referral_date')
    search_fields = ('notes', 'reason')
    date_hierarchy = 'referral_date'
    
    # Temporarily removed until client_management is implemented
    # def get_client_name(self, obj):
    #     """Get client name from the client relationship."""
    #     if obj.client:
    #         return f"{obj.client.first_name} {obj.client.last_name}"
    #     return "Unknown Client"
    # 
    # get_client_name.short_description = 'Client Name'  # type: ignore[attr-defined]
    
    fieldsets = (
        (_('Referral Information'), {
            'fields': ('type', 'status', 'priority', 'service_type', 'reason')
        }),
        (_('Client Information'), {
            'fields': ('client_type', 'client_consent_date')
        }),

        (_('Dates & Status'), {
            'fields': ('referral_date', 'accepted_date', 'completed_date', 'follow_up_date')
        }),

        (_('Additional Information'), {
            'fields': ('notes',)
        }),
        (_('Audit Information'), {
            'fields': ('created_at', 'updated_at', 'created_by'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at', 'created_by')