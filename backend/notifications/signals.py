from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from .models import Notification, NotificationSetting
from chats.models import ChatSession
from chats.cassandra_models import ChatMessage
from users.models import Contact

User = get_user_model()


@receiver(post_save, sender=User)
def create_notification_settings(sender, instance, created, **kwargs):
    """
    Create notification settings for new users
    """
    if created:
        NotificationSetting.objects.create(user=instance)


@receiver(post_save, sender=Contact)
def contact_notification(sender, instance, created, **kwargs):
    """
    Create notification when contact is added
    """
    if created:
        # Notification for the added contact
        Notification.objects.create(
            recipient=instance.contact,
            sender=instance.user,
            notification_type='friend_request',
            text=f"{instance.user.username} added you as a contact."
        )


def create_message_notification(chat_session_id, message):
    """
    Create notifications for new messages
    This is called from the ChatConsumer after a message is saved
    """
    try:
        # Get the chat session
        chat_session = ChatSession.objects.get(id=chat_session_id)
        
        # Get the sender
        sender = User.objects.get(id=message.sender_id)
        
        # Get content type
        content_type = ContentType.objects.get_for_model(ChatSession)
        
        # Create notification for all participants except sender
        for recipient in chat_session.participants.exclude(id=sender.id):
            # Skip if user has disabled message notifications
            try:
                settings = NotificationSetting.objects.get(user=recipient)
                if not settings.push_messages:
                    continue
            except NotificationSetting.DoesNotExist:
                pass
                
            # Create the notification
            notification_text = f"New message from {sender.username}"
            if chat_session.is_group_chat and chat_session.name:
                notification_text += f" in {chat_session.name}"
                
            Notification.objects.create(
                recipient=recipient,
                sender=sender,
                notification_type='message',
                text=notification_text,
                content_type=content_type,
                object_id=str(chat_session.id)
            )
    except Exception as e:
        print(f"Error creating message notification: {str(e)}")
