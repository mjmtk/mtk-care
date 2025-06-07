from django.contrib import admin
from .models import Program, Enrolment, ProgramFunding, ProgramAssignedStaff, ProgramRegion

# Register all models for programs
admin.site.register(Program)
admin.site.register(Enrolment)
admin.site.register(ProgramFunding)
admin.site.register(ProgramAssignedStaff)
admin.site.register(ProgramRegion)
# admin.site.register(ServiceTypeLink) # Removed
# admin.site.register(ServiceDeliveryMode) # Removed

