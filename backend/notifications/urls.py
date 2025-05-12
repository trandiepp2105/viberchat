from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_yasg.utils import swagger_auto_schema
from .views import NotificationViewSet

# Set up the router
router = DefaultRouter()
router.register(r'', NotificationViewSet, basename='notification')

# Custom tags for the Swagger documentation
tags_dict = {
    '': ['Notifications'],
    'settings': ['Notification Settings'],
}

urlpatterns = [
    path('', include(router.urls)),
]
