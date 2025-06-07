# Troubleshooting API 301 Redirect Loops with Django Ninja and Next.js

This document outlines a common issue leading to `ERR_TOO_MANY_REDIRECTS` (HTTP 301) when integrating a Next.js frontend with a Django Ninja backend, and how to resolve it.

## Symptom

- The frontend application gets stuck in a redirect loop when trying to access certain API endpoints (e.g., `/api/documents/`).
- Browser network tools show repeated 301 (Moved Permanently) responses for the requested API path.
- Backend logs (Django) might show requests being received for the API path *without* a trailing slash (e.g., `/api/documents`), followed by a 301 response.

## Common Cause

The primary cause for this specific loop, especially when the frontend *is* correctly requesting the URL with a trailing slash, is often that the **Django Ninja router for that specific API endpoint (e.g., `documents_router`) has not been correctly registered with the main `NinjaAPI` instance in the backend.**

Here's a breakdown of the sequence of events:

1.  **Frontend Request:** The Next.js frontend makes a request to an API endpoint, typically with a trailing slash (e.g., `fetch('/api/documents/')`).
2.  **Next.js Proxy:** The Next.js `rewrites` configuration in `next.config.ts` proxies this request to the Django backend. While proxy configuration can sometimes strip trailing slashes, the core issue here is often deeper.
3.  **Django Receives Request:** The Django backend receives the request. If the proxy mishandled the slash, or if the specific Ninja router isn't registered, Django might not find a direct handler for the slash-appended URL at the Ninja API level.
4.  **Missing Ninja Router Registration:** If the `documents_router` (or equivalent) isn't added to the main `NinjaAPI` instance in `backend/api/ninja.py`, the main API object doesn't know how to route `/api/documents/` internally to the correct view functions.
5.  **Django's `APPEND_SLASH`:** If Django's `APPEND_SLASH` setting is `True` (default), and it receives a request for a URL pattern that it *would* match if a trailing slash were present (or if it can't find the route and tries to correct it), it issues a 301 redirect to the URL with an appended slash. In this specific scenario, because the Ninja router itself is missing from the main API, Django might fall back to its global URL patterns or default behaviors, leading to the 301 if it thinks the request should have a different slash convention than what it received from the proxy.
6.  **Loop:** The browser follows the 301, re-requests the (potentially modified by proxy) URL, and if the underlying issue of the unregistered router persists, the cycle repeats.

## Diagnosis Checklist

1.  **Frontend Request URL:** Verify in your frontend code (e.g., `fetch` calls, Axios instances) that API requests are made with a trailing slash if your backend expects it (e.g., `/api/documents/`).
2.  **Browser Network Tab:** Inspect the redirect chain. Note the exact URL being requested and the URL in the `Location` header of the 301 response.
3.  **Next.js `next.config.ts`:**
    *   Ensure `trailingSlash: true` is set in the main `NextConfig` object if your backend universally expects trailing slashes.
    *   Review `rewrites` rules. Ensure the `destination` path correctly proxies to the backend and aims to preserve trailing slashes (e.g., using `:path` rather than `:path*` if the source captures the slash).
4.  **Backend Logs (Django):** Check the Django development server logs. Note the exact path that Django reports receiving (e.g., `"GET /api/documents HTTP/1.1" 301`). This is a key indicator of whether the trailing slash made it to Django.
5.  **Django `APPEND_SLASH`:** Confirm this setting (usually `True` in `settings.py`). While generally useful, it can contribute to loops if other configurations are incorrect.
6.  **Django Ninja Router Registration (`backend/api/ninja.py`):**
    *   **CRITICAL:** Ensure the specific Ninja router (e.g., `documents_router` from `apps.common.api`) is imported.
    *   **CRITICAL:** Ensure it's added to the main `NinjaAPI` instance with the correct path prefix (e.g., `api.add_router("/documents", documents_router)`).
7.  **Main API URLs (`backend/api/urls.py`):** Verify that the main Ninja API's URLs are included in Django's root URL patterns (e.g., `path('api/', api.urls)` or `path('', api.urls)` if Ninja handles the `/api` prefix internally via its routers).

## Solution

The most direct solution for the described scenario is to **ensure correct registration of all Django Ninja routers**:

In `backend/api/ninja.py`:

```python
# 1. Import your specific router
from apps.common.api import documents_router # Example for documents
# ... other router imports

# Get the main NinjaAPI instance
api = NinjaAPI()

# 2. Add your router to the API instance with the desired prefix
api.add_router("/documents", documents_router, tags=["Documents"]) # Example
# ... add other routers
```

By correctly registering the router, the main Ninja API instance will know how to delegate requests for `/api/documents/` (or whatever prefix is used) to the appropriate view functions within that router, resolving the 301 loop.
