from drf_spectacular.generators import SchemaGenerator
from .serializers import ServiceProgramSerializer
from rest_framework.request import Request
from rest_framework.views import APIView


def get_service_program_json_schema():
    from copy import deepcopy
    generator = SchemaGenerator(title="Service Program Schema")
    openapi_schema = generator.get_schema(request=None, public=True)
    components = openapi_schema.get("components", {}).get("schemas", {})
    # Try to find both the request and response schemas
    request_schema = None
    response_schema = None
    # Look for request/response schemas for ServiceProgram
    for key, value in components.items():
        if "ServiceProgram" in key and "Request" in key:
            request_schema = value
        elif key == "ServiceProgram":
            response_schema = value
    # If request schema is found, merge its properties into the response schema
    if response_schema and request_schema:
        merged = deepcopy(response_schema)
        merged["properties"].update(request_schema.get("properties", {}))
        # Merge required fields
        merged_required = set(merged.get("required", [])) | set(request_schema.get("required", []))
        merged["required"] = list(merged_required)
        return merged
    # If only one is found, return it
    if request_schema:
        return request_schema
    if response_schema:
        return response_schema
    # Fallback: return all components for debugging
    return components
