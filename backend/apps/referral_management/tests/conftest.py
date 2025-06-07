import pytest
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

@pytest.fixture
def test_user(db):
    """Create a test user with an auth token."""
    User = get_user_model()
    user, created = User.objects.get_or_create(
        username='ninja_test_user_rm',
        defaults={'email': 'ninja_rm_test@example.com', 'first_name': 'NinjaRM', 'last_name': 'TestUser'}
    )
    if created:
        user.set_password('strongpassword123') # Set a password if creating
        user.save()
    
    # Ensure token exists for the user
    Token.objects.get_or_create(user=user)
    return user
