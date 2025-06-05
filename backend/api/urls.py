from django.urls import path, include
# from apps.user_management.api import ActivateAzureUsersView
# from apps.user_management.deactivate_api import DeactivateAzureUsersView
# from api.legacy_urls import legacy_urlpatterns as drf_legacy_urlpatterns # Import the variable directly

# Import Ninja routers from each app
from api.ninja import api

urlpatterns = [
    # Ninja APIs (default)
    path('', api.urls),

    # Legacy DRF APIs (temporarily disabled)
    # path('legacy/', include(drf_legacy_urlpatterns)),

    # Reference and other endpoints
    # path('reference/', include('apps.reference_data.urls')),
    # path('assessment-forms/', include('apps.assessment_forms.urls')),
    # path('assessments/', include('apps.assessments.urls')),
    # path('activities/', include('apps.activity_management.urls')),
    # path('activate-azure-user/', ActivateAzureUsersView.as_view(), name='activate-azure-user'),
    # path('deactivate-azure-user/', DeactivateAzureUsersView.as_view(), name='deactivate-azure-user'),
    # path('azure-sync/sync-users/',
    #      __import__('apps.azure_sync.api', fromlist=['SyncAzureUsersView']).SyncAzureUsersView.as_view(),
    #      name='azure-sync-users'),
    # path('user-management/', include('apps.user_management.urls')),
    # path('', include('apps.user_management.urls_current_user')),
    # path('', include('apps.user_management.urls_user_list')),
    # path('', include('apps.user_management.roles_urls')),
    # path('', include('apps.user_management.urls_azure_admin')),
    # # path('service-management/', include('apps.service_management.urls')), # Replaced by Ninja API router in api.ninja.py

]

# from apps.user_management.test_session_login import test_login
# urlpatterns += [path("test-login/", test_login)]