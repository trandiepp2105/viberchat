from django.urls import path
from rest_framework.routers import DefaultRouter
from users.views import ContactViewSet

# Create a dedicated router for contacts
router = DefaultRouter()
router.register(r'', ContactViewSet, basename='contact')

# Use router.urls directly as urlpatterns
urlpatterns = router.urls
