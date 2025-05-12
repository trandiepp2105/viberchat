from rest_framework_simplejwt.views import TokenObtainPairView
from .token_serializers import UsernameTokenObtainPairSerializer


class UsernameTokenObtainPairView(TokenObtainPairView):
    """
    API endpoint for obtaining JWT tokens using username authentication.
    
    Takes a set of user credentials (username/password) and returns an access and refresh
    token pair to be used for authenticating subsequent requests.
    
    Requires:
    - username: The user's username
    - password: The user's password
    
    Returns:
    - access: JWT access token for authenticating API requests
    - refresh: JWT refresh token for obtaining new access tokens
    """
    serializer_class = UsernameTokenObtainPairSerializer
