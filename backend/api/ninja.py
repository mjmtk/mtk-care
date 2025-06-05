from ninja import NinjaAPI
from ninja.security import SessionAuth
# from apps.service_management.api import router as sm_router
# from apps.client_management.api import router as client_management_router
# from apps.referral_management.api import router as referral_router
from apps.optionlists.api import router as optionlists_router
from apps.users.api import users_router, roles_router
# from apps.external_organisation_management.api_external_organisation_crud import external_org_router as external_org_management_api_router
# from apps.external_organisation_management.api.contact_api import contacts_router as contacts_router_eom
# from apps.external_organisation_management.api.email_api import emails_router as emails_router_eom
# from apps.external_organisation_management.api.phone_api import phones_router as phones_router_eom
# from apps.cultural_groups.api import router as cultural_groups_router
# from apps.audit.api import router as audit_router
# from apps.core.api import router as core_router
# from apps.entity_properties.api import router as entity_properties_router
# from apps.timeline.api import router as timeline_router
# from apps.user_management.api_auth import auth_router as user_auth_router # Added for MSAL Auth
# from apps.user_management.roles_api import router as roles_router
# from apps.user_management.api import get_router as get_user_router

print(f"DEBUG: Executing api/ninja.py module level. Current NinjaAPI._registry: {getattr(NinjaAPI, '_registry', 'Not_Yet_Set')}")

# Instantiate NinjaAPI directly at module level
api = NinjaAPI() #auth=SessionAuth())
print(f"DEBUG: api/ninja.py: New NinjaAPI() instance created. ID: {id(api)}, Version: {api.version}, Namespace: {api.urls_namespace}")
print(f"DEBUG: api/ninja.py: New NinjaAPI() instance's _routers before adding: {api._routers}")

# Add routers directly to this 'api' instance
# api.add_router("/service-management", sm_router)
# api.add_router("/client-management", client_management_router) # Direct router instance
# api.add_router("/referrals", referral_router)
api.add_router("/optionlists", optionlists_router)
api.add_router("/users", users_router, tags=["Users"])
api.add_router("/roles", roles_router, tags=["Roles"])
# api.add_router("/external-organisations/", external_org_management_api_router, tags=["External Organisations"]) # Gold Standard Path for ExternalOrg CRUD & Batch Dropdowns
# api.add_router("/ext-org-mgmt/contacts/", contacts_router_eom, tags=["External Organisation Contacts"])
# api.add_router("/ext-org-mgmt/email-addresses/", emails_router_eom, tags=["External Organisation Email Addresses"])
# api.add_router("/ext-org-mgmt/phone-numbers/", phones_router_eom, tags=["External Organisation Phone Numbers"])
# api.add_router("/cultural-groups", cultural_groups_router)
# api.add_router("/audit", audit_router)
# api.add_router("/core", core_router)
# api.add_router("/entity-properties", entity_properties_router)
# api.add_router("/timeline", timeline_router)
# api.add_router("/auth", user_auth_router, tags=["Authentication"]) # Added for MSAL Auth
# api.add_router("/roles", roles_router, tags=["Roles"])  # New roles endpoints
# api.add_router("/users", get_user_router(), tags=["Users"])  # New: User management endpoints (Ninja)

print(f"DEBUG: api/ninja.py: Finished adding all routers. api._routers after adding: {api._routers}")

# The 'api' instance is now directly used by api/urls.py
