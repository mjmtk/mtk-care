from ninja import Router

# Import individual routers
from .contact_api import contacts_router
from .email_api import emails_router
from .phone_api import phones_router
# from ..api_external_organisation_crud import external_org_router as external_organisation_specific_router # CAUSES CIRCULAR IMPORT

# Define and assemble the main router for this app's API
# This single router instance will be imported by the main project API configuration.
# external_org_management_api_router = Router() # THIS IS NOW HANDLED IN api_external_organisation_crud.py
# external_org_management_api_router.add_router("/organisations", external_organisation_specific_router, tags=["Organisations"]) # CAUSES CIRCULAR IMPORT
# external_org_management_api_router.add_router("/contacts", contacts_router, tags=["Contacts"]) # Router structure now in crud file
# external_org_management_api_router.add_router("/phone-numbers", phones_router, tags=["Phone Numbers"]) # Router structure now in crud file
# external_org_management_api_router.add_router("/email-addresses", emails_router, tags=["Email Addresses"]) # Router structure now in crud file

# __all__ = [
# "external_org_management_api_router",
# ]

# It's possible this __init__.py is no longer strictly needed if all imports are direct.
# For now, just ensure it doesn't cause circular imports.
# If individual routers need to be importable from 'apps.external_organisation_management.api', they can be listed in __all__.
__all__ = [
    "contacts_router",
    "emails_router",
    "phones_router",
]
