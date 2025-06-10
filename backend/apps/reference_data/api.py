from typing import List
from ninja import Router
from .models import Country, Language
from .schemas import CountryOut, LanguageOut

def create_reference_router():
    router = Router(tags=["Reference Data"])

    @router.get("/countries/", response=List[CountryOut], summary="List all active countries")
    def list_countries(request):
        """
        Retrieves all active countries for use in dropdowns and forms.
        """
        countries = Country.objects.filter(is_active=True).order_by('name')
        return [
            {
                'id': country.id,
                'code': country.code,
                'name': country.name
            }
            for country in countries
        ]

    @router.get("/languages/", response=List[LanguageOut], summary="List all active languages")
    def list_languages(request):
        """
        Retrieves all active languages for use in dropdowns and forms.
        """
        languages = Language.objects.filter(is_active=True).order_by('name')
        return [
            {
                'id': language.id,
                'code': language.code,
                'name': language.name
            }
            for language in languages
        ]

    return router