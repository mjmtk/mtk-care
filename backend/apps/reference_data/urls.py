from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CountryViewSet, LanguageViewSet

router = DefaultRouter()
router.register(r'countries', CountryViewSet, basename='country')
router.register(r'languages', LanguageViewSet, basename='language')

urlpatterns = [
    path('', include(router.urls)),
]
