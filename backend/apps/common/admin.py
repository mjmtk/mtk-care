from django.contrib import admin
from .models import Document

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("file_name", "type", "status", "created_at", "created_by")
    list_filter = ("type", "status", "created_at")
    search_fields = ("file_name", "sharepoint_id")
    readonly_fields = ("created_at", "created_by", "updated_at", "updated_by")
