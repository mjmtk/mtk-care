from django.contrib import admin
from .models import OptionList, OptionListItem

from django.contrib import messages
from django.shortcuts import redirect

class OptionListItemInline(admin.TabularInline):
    model = OptionListItem
    extra = 1
    fields = ("name", "slug", "label", "region", "global_option", "is_active", "sort_order")
    readonly_fields = ("created_at", "updated_at")
    show_change_link = True

@admin.register(OptionList)
class OptionListAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "organization", "global_option_list", "is_template", "description", "created_at", "updated_at", "is_active")
    list_filter = ("organization", "global_option_list", "is_template", "is_active")
    search_fields = ("name", "slug", "description")
    ordering = ("name",)
    actions = ["clone_to_organization", "soft_delete"]
    readonly_fields = ("created_at", "updated_at")
    inlines = [OptionListItemInline]

    def clone_to_organization(self, request, queryset):
        """
        Clone selected template OptionLists (is_template=True) to a specified organization (org_id required in GET params).
        All OptionListItems are also cloned. Organization selection UI should be improved in the future.
        """
        from apps.common.models import Organisation
        org_id = request.GET.get('org_id') or None
        if not org_id:
            self.message_user(request, "No organization specified (set org_id in GET params)", level=messages.ERROR)
            return
        try:
            org = Organisation.objects.get(id=org_id)
        except Organisation.DoesNotExist:
            self.message_user(request, f"Organization ID {org_id} not found.", level=messages.ERROR)
            return
        count = 0
        for optionlist in queryset:
            if not optionlist.is_template:
                continue
            items = list(optionlist.items.all())
            optionlist.pk = None
            optionlist.organization = org
            optionlist.is_template = False
            optionlist.save()
            for item in items:
                item.pk = None
                item.option_list = optionlist
                item.save()
            count += 1
        self.message_user(request, f"Cloned {count} OptionList(s) to organization {org.name}.", level=messages.SUCCESS)
    clone_to_organization.short_description = "Clone selected template OptionLists to an organization (org_id param required)"

    def soft_delete(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"Soft-deleted {updated} OptionList(s).", level=messages.SUCCESS)
    soft_delete.short_description = "Soft delete selected OptionLists (set is_active=False)"

@admin.register(OptionListItem)
class OptionListItemAdmin(admin.ModelAdmin):
    list_display = ("indented_name", "slug", "option_list", "parent", "global_option", "region", "is_active", "sort_order", "created_at", "updated_at")
    list_filter = ("option_list", "parent", "global_option", "region", "is_active")
    search_fields = ("name", "slug", "region")
    ordering = ("option_list", "parent", "sort_order", "name")
    readonly_fields = ("created_at", "updated_at")
    actions = ["soft_delete"]

    def indented_name(self, obj):
        indent = ""
        if obj.parent:
            indent = "— "  # em dash for visual indentation
            # Optional: further indent if you support deeper trees
            parent = obj.parent
            while parent.parent:
                indent += "— "
                parent = parent.parent
        return f"{indent}{obj.name}"
    indented_name.short_description = "Name (hierarchical)"

    def soft_delete(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"Soft-deleted {updated} OptionListItem(s).", level=messages.SUCCESS)
    soft_delete.short_description = "Soft delete selected OptionListItems (set is_active=False)"
