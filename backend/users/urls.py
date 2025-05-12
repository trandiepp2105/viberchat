from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_yasg.utils import swagger_auto_schema
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .views import (
    UserViewSet, 
    RegisterView, 
    VerifyOTPView,
    ResendOTPView,
    PasswordResetRequestView,
    PasswordResetCompleteView
)

# Set up the router
user_router = DefaultRouter()
user_router.register(r'', UserViewSet, basename='user')

# Custom tags for the Swagger documentation
tags_dict = {
    'register': ['User Registration'],
    'verify-otp': ['Authentication'],
    'resend-otp': ['Authentication'],
    'password-reset-request': ['Password Management'],
    'password-reset-complete': ['Password Management'],
}

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('password-reset/complete/', PasswordResetCompleteView.as_view(), name='password-reset-complete'),
    path('', include(user_router.urls)),
]
