from django.urls import re_path
from . import consumers, consumers_conversation

websocket_urlpatterns = [
    # Existing chat session pattern (will be removed in the future)
    re_path(r'ws/chat/(?P<chat_session_id>[0-9a-f-]+)/$', consumers.ChatConsumer.as_asgi()),
    
    # New conversation pattern
    re_path(r'ws/conversation/(?P<conversation_id>[0-9a-f-]+)/$', consumers_conversation.ConversationConsumer.as_asgi()),
]
