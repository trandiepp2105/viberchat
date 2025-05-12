from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import NotificationSettingViewSet

# Create a router for notification settings
router = DefaultRouter()
router.register(r'', NotificationSettingViewSet, basename='notification-settings')

# Define URL patterns for notification settings
urlpatterns = router.urls
