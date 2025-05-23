from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_yasg.utils import swagger_auto_schema
from .views import ConversationViewSet

router = DefaultRouter()
# New conversation viewset

# New conversation viewset
router.register(r'conversations', ConversationViewSet, basename='conversation')

# Manually define the route for start_direct_conversation to include user_id in the URL
# This needs to be defined before including router.urls if it's to override a router-generated URL
# or if the action is not meant to be on the detail route of the ViewSet by default.
# However, since we changed @action(detail=True), the router will generate /conversations/{pk}/start_direct_conversation/
# If the intention is /conversations/start_direct_conversation/{user_id}/, then it needs a custom setup.
# For now, assuming the change to @action(detail=True) means the {pk} in the URL IS the other_user_id.

# Custom tags for the Swagger documentation
tags_dict = {
    'sessions': ['Chat Sessions'],
    'attachments': ['Chat Attachments'],
    'conversations': ['Conversations'],
}

urlpatterns = [
    path('', include(router.urls)),
]
