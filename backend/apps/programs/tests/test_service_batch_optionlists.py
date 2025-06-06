from rest_framework.test import APIClient
from django.urls import reverse
from django.contrib.auth import get_user_model
import pytest

@pytest.mark.django_db
def test_batch_optionlists_includes_schema():
    client = APIClient()
    User = get_user_model()
    user = User.objects.create_user(username='testuser', password='testpass')
    client.force_authenticate(user=user)
    # Use the actual URL pattern or hardcode if needed
    url = '/api/service-management/options/batch/' # Corrected URL to match router definition
    response = client.get(url)
    assert response.status_code == 200
    data = response.json()
    # OptionLists keys should be present
    # The response is a flat dictionary of lists, so we check keys directly in data
    assert 'service_types' in data
    assert 'delivery_modes' in data
    assert 'locations' in data

    # Example: Check if the values are lists (even if empty)
    assert isinstance(data['service_types'], list)
    assert isinstance(data['delivery_modes'], list)
    assert isinstance(data['locations'], list)

    # If you expect specific items (e.g., after populating fixtures),
    # you would check for their presence and structure here. For example:
    # if data['service_types'] and len(data['service_types']) > 0:
    #     assert 'id' in data['service_types'][0]
    #     assert 'name' in data['service_types'][0]
    #     assert 'slug' in data['service_types'][0]

