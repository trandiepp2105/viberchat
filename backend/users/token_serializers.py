from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that uses username as the authentication field.
    
    This serializer extends the standard JWT TokenObtainPairSerializer to use
    username instead of the default email field for authentication purposes.
    
    Fields:
    - username: The user's username
    - password: The user's password
    """
    username_field = 'username'
