from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

@database_sync_to_async
def get_user_from_token(token):
    """
    Get a user from a JWT token
    """
    try:
        access_token = AccessToken(token)
        user_id = access_token['user_id']
        
        logger.debug(f"Extracted user_id {user_id} from token")
        return User.objects.get(id=user_id)
    except (InvalidToken, TokenError) as e:
        logger.error(f"Token error: {str(e)}")
        return AnonymousUser()
    except User.DoesNotExist:
        logger.error(f"User not found for ID: {user_id}")
        return AnonymousUser()
    except Exception as e:
        logger.error(f"Unexpected error in token authentication: {str(e)}")
        return AnonymousUser()

class TokenAuthMiddleware:
    """
    Custom token auth middleware for Django Channels
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Get query parameters
        query_string = scope["query_string"].decode()
        query_params = parse_qs(query_string)
        
        logger.debug(f"WebSocket connection query params: {query_params}")
        
        # Get token from query parameters
        token = query_params.get('token', [None])[0]
        if token:
            logger.debug("Token found in query parameters")
            scope['user'] = await get_user_from_token(token)
        else:
            logger.warning("No token provided in WebSocket connection")
            scope['user'] = AnonymousUser()
        
        logger.debug(f"User authenticated: {scope['user']} (is_anonymous: {scope['user'].is_anonymous})")
        return await self.inner(scope, receive, send)

def TokenAuthMiddlewareStack(inner):
    """
    Wrapper function for the TokenAuthMiddleware
    """
    return TokenAuthMiddleware(inner)
