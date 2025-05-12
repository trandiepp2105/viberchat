"""
URL configuration for core project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from users.token_views import UsernameTokenObtainPairView

# Schema view for Swagger/OpenAPI documentation
schema_view = get_schema_view(
    openapi.Info(
        title="ViberChat API",
        default_version='v1',
        description="API documentation for ViberChat application",
        terms_of_service="https://www.viberchat.com/terms/",
        contact=openapi.Contact(email="contact@viberchat.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
    url=f"{settings.BASE_API_URL}/api/v1/" if hasattr(settings, 'BASE_API_URL') else None,
    patterns=[path('api/v1/', include('api.urls'))],
)

urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),
    
    # API v1 routes
    path('api/v1/', include([
        # Main API routes from api.urls (all endpoints defined in api/urls.py)
        path('', include('api.urls')),
        
        # API Documentation
        path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
        path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
        
        # JWT Authentication
        path('token/', UsernameTokenObtainPairView.as_view(), name='token_obtain_pair', kwargs={'swagger_tags': ['Authentication']}),
        path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh', kwargs={'swagger_tags': ['Authentication']}),
        path('token/verify/', TokenVerifyView.as_view(), name='token_verify', kwargs={'swagger_tags': ['Authentication']}),
    ])),
    
    # Legacy documentation URLs (for backward compatibility)
    path('docs/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui-legacy'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
