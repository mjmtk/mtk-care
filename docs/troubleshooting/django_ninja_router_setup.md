# Troubleshooting Django Ninja Router Registration Issues

## Problem: `ninja.errors.ConfigError: Router@'/prefix/' has already been attached to API NinjaAPI:X.Y.Z`

This error indicates that a specific `ninja.Router` instance is being added to the main `NinjaAPI` instance multiple times, or that the router instance already has its internal `_api` attribute set when `api.add_router()` is called.

This can be caused by:
1.  **Duplicate `api.add_router()` calls**: The same router instance is explicitly added more than once in the central router registration file (e.g., `backend/api/ninja.py`).
2.  **Module Reloading/Caching Issues**: Python's module import system or Django's development server reloader might cause a router module to be processed in a way that leads to a stale or pre-attached router instance.
3.  **Premature Attachment**: The router instance might be inadvertently attached to an API instance (perhaps a different one, or the same one through an unexpected import path) before its intended registration.

In our case, this error was persistent for the `optionlists_router` despite ensuring no obvious duplicate `add_router` calls in `backend/api/ninja.py`.

## Solution: Router Factory Function Pattern

To ensure a "fresh" router instance is always used during registration and to eliminate potential issues from shared instances or module state, we adopted a factory function pattern for the problematic router.

**1. Modify the Application's Router Module (e.g., `apps/optionlists/api.py`)**

Instead of defining and exporting a global router instance directly, define a function that creates, configures, and returns the router instance.

**Before:**
```python
# apps/optionlists/api.py
from ninja import Router

optionlists_router = Router(tags=["Option Lists"])

@optionlists_router.get("/items/")
def list_items(request):
    # ... endpoint logic ...
    return [...]

# Other endpoints...
```

**After (Factory Function):**
```python
# apps/optionlists/api.py
from ninja import Router

def create_optionlists_router():
    router = Router(tags=["Option Lists"]) # Create a new instance

    @router.get("/items/") # Note: using 'router' (local var) not 'optionlists_router'
    def list_items(request):
        # ... endpoint logic ...
        return [...]

    # Other endpoints defined on the local 'router' instance...
    
    return router # Return the newly created and configured router
```

**2. Update Central Router Registration (e.g., `backend/api/ninja.py`)**

In the file where the main `NinjaAPI` instance is defined and app routers are registered, import the factory function and call it when adding the router.

**Before:**
```python
# backend/api/ninja.py
from ninja import NinjaAPI
from apps.optionlists.api import optionlists_router # Importing the instance

api = NinjaAPI(...)
api.add_router("/optionlists/", optionlists_router, tags=["OptionLists"])
```

**After (Using Factory Function):**
```python
# backend/api/ninja.py
from ninja import NinjaAPI
from apps.optionlists.api import create_optionlists_router # Importing the factory

api = NinjaAPI(...)
api.add_router("/optionlists/", create_optionlists_router(), tags=["OptionLists"]) # Call the factory
```

### Why this Works

*   **Isolation**: Each call to `create_optionlists_router()` produces a new, independent `Router` object. This prevents state from one part of the application or a previous reload from affecting the router instance being registered.
*   **Explicit Control**: The main API setup in `backend/api/ninja.py` has explicit control over when and how the router instance is created, right before it's needed for registration.

This pattern is particularly useful for resolving stubborn "router already attached" errors when simpler fixes (like checking for duplicate `add_router` lines) have failed. It promotes a cleaner separation of concerns, where app-specific router modules are responsible for *defining* their routes, and the central API configuration is responsible for *instantiating* and *integrating* them.
