from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Notification, NotificationSetting

User = get_user_model()


class UserMiniSerializer(serializers.ModelSerializer):
    """Minimal user serializer for notifications"""
    class Meta:
        model = User
        fields = ['id', 'username', 'avatar']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for the Notification model"""
    sender_details = UserMiniSerializer(source='sender', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'sender', 'sender_details', 'notification_type', 
            'text', 'content_type', 'object_id', 'is_read', 'read_at', 
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'recipient', 'sender', 'sender_details', 'notification_type',
            'text', 'content_type', 'object_id', 'created_at', 'updated_at'
        ]


class NotificationSettingSerializer(serializers.ModelSerializer):
    """Serializer for the NotificationSetting model"""
    class Meta:
        model = NotificationSetting
        fields = [
            'id', 'user', 'email_notifications', 'email_messages', 
            'email_friend_requests', 'email_group_invites', 'email_system',
            'push_notifications', 'push_messages', 'push_friend_requests',
            'push_group_invites', 'push_system', 'message_sound', 'notification_sound'
        ]
        read_only_fields = ['id', 'user']
