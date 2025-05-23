from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Support both URL patterns to maintain compatibility
    re_path(r'ws/conversation/(?P<conversation_id>[0-9a-f-]+)/$', consumers.ConversationConsumer.as_asgi()),
    re_path(r'ws/chat/(?P<conversation_id>[0-9a-f-]+)/$', consumers.ConversationConsumer.as_asgi()),
]
