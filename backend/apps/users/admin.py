from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from .models import UserProfile, GroupRoleMapping

class UserProfileInline(admin.StackedInline):
    model = UserProfile
    can_delete = False
    verbose_name_plural = 'Profile'
    fk_name = 'user'  # Specify which ForeignKey to use
    readonly_fields = ['created_at', 'updated_at']

class UserAdmin(BaseUserAdmin):
    inlines = (UserProfileInline,)

# Re-register UserAdmin
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'employee_id'] # TODO: add 'email_notifications' back when implemented
    list_filter = ['departments'] # TODO: add 'email_notifications', 'theme_preference' back when implemented
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'employee_id']
    readonly_fields = ['created_at', 'updated_at', 'created_by', 'updated_by']
    filter_horizontal = ['departments']

@admin.register(GroupRoleMapping)
class GroupRoleMappingAdmin(admin.ModelAdmin):
    list_display = ['azure_ad_group_id', 'azure_ad_group_name', 'role', 'created_at', 'updated_at']
    search_fields = ['azure_ad_group_id', 'azure_ad_group_name', 'role__name']
    list_filter = ['role']
    readonly_fields = ['created_at', 'updated_at']