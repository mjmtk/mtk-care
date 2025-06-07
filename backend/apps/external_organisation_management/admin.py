from django.contrib import admin
from .models import ExternalOrganisation, ExternalOrganisationContact, PhoneNumber, EmailAddress

@admin.register(ExternalOrganisation)
class ExternalOrganisationAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'phone', 'email', 'is_active')
    search_fields = ('name', 'phone', 'email')
    list_filter = ('type', 'is_active')

@admin.register(ExternalOrganisationContact)
class ExternalOrganisationContactAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'organisation', 'job_title', 'is_active')
    search_fields = ('first_name', 'last_name', 'organisation__name', 'job_title')
    list_filter = ('is_active',)

@admin.register(PhoneNumber)
class PhoneNumberAdmin(admin.ModelAdmin):
    list_display = ('number', 'type', 'contact', 'organisation', 'is_active')
    search_fields = ('number', 'contact__first_name', 'contact__last_name', 'organisation__name')
    list_filter = ('type', 'is_active')

@admin.register(EmailAddress)
class EmailAddressAdmin(admin.ModelAdmin):
    list_display = ('email', 'type', 'contact', 'organisation', 'is_active')
    search_fields = ('email', 'contact__first_name', 'contact__last_name', 'organisation__name')
    list_filter = ('type', 'is_active')
