from django.urls import path
from . import views

app_name = 'client_management'

urlpatterns = [
    # Django views (if needed for traditional Django views)
    # path('', views.ClientListView.as_view(), name='client_list'),
    # path('<uuid:pk>/', views.ClientDetailView.as_view(), name='client_detail'),
    
    # Most functionality will be handled by Django Ninja API
    # See api.py for API endpoints
]