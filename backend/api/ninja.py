"""
ALL Django Ninja routers must be registered here, using a trailing slash in the path (e.g., '/users/', '/roles/').
Do NOT register routers in any other file. This prevents redirect/proxy issues and maintains a single source of truth.
Always use consistent import and naming conventions for routers. Add new routers here only.
"""

from django.conf import settings
from ninja import NinjaAPI

# Import application routers
from apps.optionlists.api import create_optionlists_router
from apps.users.api import users_router, roles_router
from apps.common.api import documents_router
from apps.authentication.api import router as auth_router
from apps.external_organisation_management.api_external_organisation_crud import external_org_router
from apps.external_organisation_management.api import contacts_router, emails_router, phones_router
from apps.referral_management.api import router as referrals_router
from apps.client_management.api import router as clients_router
# Add additional router imports here as needed, following the pattern above.

# Instantiate NinjaAPI - This is the single, central API instance for the project.
# It will be imported by config/urls.py.
# Endpoints like /health, /profile defined in config/urls.py will be added to this instance.
api = NinjaAPI(
    title="MTK-Care API",
    description="Healthcare Task Manager API with Azure AD Authentication",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    # auth=HttpBearer(), # Example: Global authentication, if needed
)

# Register all application routers with trailing slash for consistency
api.add_router("/optionlists/", create_optionlists_router(), tags=["OptionLists"])
api.add_router("/users/", users_router, tags=["Users"])
api.add_router("/roles/", roles_router, tags=["Roles"])
api.add_router("/documents/", documents_router, tags=["Documents"])
api.add_router("/auth/", auth_router, tags=["Authentication"])
api.add_router("/external-organisations/", external_org_router, tags=["External Organisations"])
api.add_router("/external-organisation-contacts/", contacts_router, tags=["External Organisation Contacts"])
api.add_router("/external-organisation-emails/", emails_router, tags=["External Organisation Emails"])
api.add_router("/external-organisation-phones/", phones_router, tags=["External Organisation Phones"])
api.add_router("/referrals/", referrals_router, tags=["Referrals"])
api.add_router("/clients/", clients_router, tags=["Clients"])

# Add any new application routers here, ensuring they use a trailing slash:
# Example: api.add_router("/newfeature/", newfeature_router, tags=["NewFeature"])

# The 'api' instance is now correctly configured with all application routers
# and ready to be used by config/urls.py.
