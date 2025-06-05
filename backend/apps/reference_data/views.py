from rest_framework import viewsets, mixins
from .models import Country, Language
from .serializers import CountrySerializer, LanguageSerializer

class CountryViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Country.objects.filter(is_active=True)
    serializer_class = CountrySerializer
    pagination_class = None

class LanguageViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Language.objects.filter(is_active=True)
    serializer_class = LanguageSerializer
    pagination_class = None
