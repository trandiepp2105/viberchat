from django.urls import include, path

# Main API URL patterns - all these routes are prefixed with /api/v1/ from core/urls.py
urlpatterns = [
    # User-related endpoints - authentication, profiles
    path("users/contacts/", include("users.contacts_urls")),

    path("users/", include("users.urls")),
    
    # Chat-related endpoints - sessions, messages, attachments
    path("chats/", include("chats.urls")),
    
    # Notification-related endpoints
    path("notifications/", include("notifications.urls")),
    
    # Dedicated paths to avoid conflict with other URL patterns
    # These are registered last to ensure they're not overshadowed by more general patterns
    path("notifications/settings/", include("notifications.settings_urls")),
]