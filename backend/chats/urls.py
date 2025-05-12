from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_yasg.utils import swagger_auto_schema
from .views import ChatSessionViewSet, AttachmentViewSet
from .views_conversation import ConversationViewSet

router = DefaultRouter()
# Existing viewsets (will be removed in the future)
router.register(r'sessions', ChatSessionViewSet, basename='chat-session')
router.register(r'attachments', AttachmentViewSet, basename='attachment')

# New conversation viewset
router.register(r'conversations', ConversationViewSet, basename='conversation')

# Custom tags for the Swagger documentation
tags_dict = {
    'sessions': ['Chat Sessions'],
    'attachments': ['Chat Attachments'],
    'conversations': ['Conversations'],
}

urlpatterns = [
    path('', include(router.urls)),
]
