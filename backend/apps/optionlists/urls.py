from rest_framework.routers import DefaultRouter
from .views import OptionListViewSet, OptionListItemViewSet

router = DefaultRouter()
router.register(r'option-lists', OptionListViewSet, basename='optionlist')
router.register(r'option-list-items', OptionListItemViewSet, basename='optionlistitem')

urlpatterns = router.urls
