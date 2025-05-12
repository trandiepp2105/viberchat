from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import gettext_lazy as _

User = get_user_model()


class Notification(models.Model):
    """
    Generic notification model
    """
    # Notification recipient
    recipient = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='notifications'
    )
    
    # Notification sender (optional)
    sender = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        related_name='sent_notifications',
        null=True, 
        blank=True
    )
    
    # Notification type
    NOTIFICATION_TYPES = (
        ('message', 'New Message'),
        ('friend_request', 'Friend Request'),
        ('friend_accept', 'Friend Request Accepted'),
        ('group_invite', 'Group Chat Invite'),
        ('system', 'System Notification'),
    )
    notification_type = models.CharField(
        max_length=20, 
        choices=NOTIFICATION_TYPES
    )
    
    # Notification text
    text = models.TextField()
    
    # Link to the related object using GenericForeignKey
    content_type = models.ForeignKey(
        ContentType, 
        on_delete=models.CASCADE,
        null=True, 
        blank=True
    )
    object_id = models.CharField(max_length=50, null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    # Notification status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ['-created_at']
        verbose_name = _('notification')
        verbose_name_plural = _('notifications')
        db_table = 'notification'
        
    def __str__(self):
        return f"{self.notification_type} for {self.recipient.username} at {self.created_at}"
        
    def mark_as_read(self):
        """Mark notification as read"""
        from django.utils import timezone
        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=['is_read', 'read_at', 'updated_at'])


class NotificationSetting(models.Model):
    """
    User notification settings
    """
    user = models.OneToOneField(
        User, 
        on_delete=models.CASCADE, 
        related_name='notification_settings'
    )
    
    # Email notification settings
    email_notifications = models.BooleanField(default=True)
    email_messages = models.BooleanField(default=True)
    email_friend_requests = models.BooleanField(default=True)
    email_group_invites = models.BooleanField(default=True)
    email_system = models.BooleanField(default=True)
    
    # Push notification settings
    push_notifications = models.BooleanField(default=True)
    push_messages = models.BooleanField(default=True)
    push_friend_requests = models.BooleanField(default=True)
    push_group_invites = models.BooleanField(default=True)
    push_system = models.BooleanField(default=True)
    
    # Sound settings
    message_sound = models.BooleanField(default=True)
    notification_sound = models.BooleanField(default=True)
    class Meta:
        verbose_name = _('notification setting')
        verbose_name_plural = _('notification settings')
        db_table = 'notification_setting'
        
    def __str__(self):
        return f"Notification settings for {self.user.username}"
