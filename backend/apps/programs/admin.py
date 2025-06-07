from django.contrib import admin
from .models import ServiceProgram, Enrolment \
    , ServiceProgramFunding, ServiceCulturalGroup, ServiceAssignedStaff,\
        ServiceAssessmentForm, ServiceRegion # Removed ServiceTypeLink, ServiceDeliveryMode

# Register all models for service_management
admin.site.register(ServiceProgram)
admin.site.register(Enrolment)
admin.site.register(ServiceProgramFunding)
admin.site.register(ServiceCulturalGroup)
admin.site.register(ServiceAssignedStaff)
admin.site.register(ServiceAssessmentForm)
admin.site.register(ServiceRegion)
# admin.site.register(ServiceTypeLink) # Removed
# admin.site.register(ServiceDeliveryMode) # Removed

