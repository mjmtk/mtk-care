from django.contrib import admin
from .models import Country, Language

@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "is_active")
    search_fields = ("name", "code")
    list_filter = ("is_active",)

@admin.register(Language)
class LanguageAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "is_active")
    search_fields = ("name", "code")
    list_filter = ("is_active",)
