from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceProgramViewSet, EnrolmentViewSet, ServiceBatchOptionListsView, ServiceAssignedStaffViewSet

app_name = 'service-management'

router = DefaultRouter()
router.register(r'services', ServiceProgramViewSet,basename='service')
router.register(r'service-enrolments', EnrolmentViewSet,basename='service-enrolment')
router.register(r'service-assigned-staff', ServiceAssignedStaffViewSet, basename='service-assigned-staff')


# urlpatterns = router.urls
# The API URLs are now determined automatically by the router
from .api import api

urlpatterns = [
    path('', include(router.urls)),
    path('batch-optionlists/', ServiceBatchOptionListsView.as_view(), name='service-batch-optionlists'),
]

