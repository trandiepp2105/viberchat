"""
ASGI config for core project.
"""

import os
import django
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.urls import path, re_path
from corsheaders.middleware import CorsMiddleware

# Set up Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Import after Django setup
from chats.routing import websocket_urlpatterns
from chats.auth import TokenAuthMiddlewareStack

# Configure the ASGI application
application = ProtocolTypeRouter({
    # Django's ASGI application for HTTP requests
    "http": get_asgi_application(),
    
    # WebSocket support with JWT token authentication
    "websocket": AllowedHostsOriginValidator(
        TokenAuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
