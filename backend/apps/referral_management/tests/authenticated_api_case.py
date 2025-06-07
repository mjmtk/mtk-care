# from rest_framework.test import APITestCase
# from django.contrib.auth import get_user_model
# from unittest.mock import patch

# class AuthenticatedAPITestCase(APITestCase):
#     """
#     Base test case for API tests that require authentication via Bearer token.
#     Automatically patches AzureADAuthentication and injects a test user and Bearer token for all requests.
#     """
#     @classmethod
#     def setUpTestData(cls):
#         # Create the test user once for all tests in the class
#         User = get_user_model()
#         cls.user, _ = User.objects.get_or_create(username='apitestuser')

#     def setUp(self):
#         # Patch AzureADAuthentication to always authenticate as the test user
#         self._patcher = patch('apps.user_management.auth.AzureADAuthentication.authenticate', return_value=(self.user, None))
#         self._patcher.start()
#         self.addCleanup(self._patcher.stop)

#     def authenticate(self):
#         self.client.credentials(HTTP_AUTHORIZATION='Bearer testtoken', Authorization='Bearer testtoken')

#     def test_debug_print_client_headers(self):
#         self.authenticate()
#         # Rest of the test method remains the same

from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
# Remove: from unittest.mock import patch # Not needed anymore

class AuthenticatedAPITestCase(APITestCase):
    """
    Base test case for API tests that require authentication.
    Automatically authenticates a test user for all requests.
    """
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData() # Call APITestCase's setUpTestData
        # Create the test user once for all tests in the class
        User = get_user_model()
        cls.user, created = User.objects.get_or_create(username='apitestuser')
        if created or not cls.user.is_active: # Ensure user is active
            cls.user.is_active = True
            cls.user.save()

    def setUp(self):
        super().setUp() # Call super().setUp() if APITestCase has its own setUp
        # Authenticate the client for all tests in this class or subclasses
        self.client.force_authenticate(user=self.__class__.user)
        # The patcher for AzureADAuthentication is removed as force_authenticate handles this.

    def authenticate(self):
        # This method is now effectively a no-op as authentication is handled in setUp
        # by force_authenticate. It's kept for compatibility if any tests still call it,
        # but it doesn't need to do anything.
        pass

    # The test_debug_print_client_headers method was here,
    # but it's better practice to keep test methods in the actual test files.
    # If you need it, move it to a specific test suite.