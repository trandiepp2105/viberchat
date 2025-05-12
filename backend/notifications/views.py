from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Notification, NotificationSetting
from .serializers import NotificationSerializer, NotificationSettingSerializer


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for notifications.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            # Return an empty queryset
            return Notification.objects.none()
            
        return Notification.objects.filter(recipient=self.request.user)
    
    @action(detail=False, methods=['get'])
    def unread(self, request):
        """Get only unread notifications"""
        unread_notifications = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        )
        serializer = self.get_serializer(unread_notifications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a notification as read"""
        try:
            notification = Notification.objects.get(id=pk, recipient=request.user)
            notification.mark_as_read()
            serializer = self.get_serializer(notification)
            return Response(serializer.data)
        except Notification.DoesNotExist:
            return Response(
                {"detail": "Notification not found"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        current_time = timezone.now()
        unread_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True, read_at=current_time)
        
        return Response({"marked_read": unread_count})


class NotificationSettingViewSet(viewsets.ModelViewSet):
    """
    API endpoint for notification settings.
    """
    serializer_class = NotificationSettingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            # Return an empty queryset
            return NotificationSetting.objects.none()
            
        return NotificationSetting.objects.filter(user=self.request.user)
        
    def list(self, request):
        """Get the user's notification settings"""
        # Get or create settings
        settings, created = NotificationSetting.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(settings)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """Get a specific notification setting (always redirects to the user's settings)"""
        settings, created = NotificationSetting.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(settings)
        return Response(serializer.data)
    
    def create(self, request):
        """Create is not allowed, use update instead"""
        return Response(
            {"detail": "Method not allowed. Use PUT or PATCH to update settings."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    def update(self, request, pk=None):
        """Update notification settings"""
        settings, created = NotificationSetting.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(settings, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def partial_update(self, request, pk=None):
        """Partially update notification settings"""
        settings, created = NotificationSetting.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
            
        return NotificationSetting.objects.filter(user=self.request.user)
        
    def list(self, request):
        """Get the user's notification settings"""
        # Get or create settings
        settings, created = NotificationSetting.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(settings)
        return Response(serializer.data)
    
    def retrieve(self, request, pk=None):
        """Get a specific notification setting (always redirects to the user's settings)"""
        settings, created = NotificationSetting.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(settings)
        return Response(serializer.data)
    
    def create(self, request):
        """Create is not allowed, use update instead"""
        return Response(
            {"detail": "Method not allowed. Use PUT or PATCH to update settings."},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )
    
    def update(self, request, pk=None):
        """Update notification settings"""
        settings, created = NotificationSetting.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(settings, data=request.data, partial=False)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def partial_update(self, request, pk=None):
        """Partially update notification settings"""
        settings, created = NotificationSetting.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(settings, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
