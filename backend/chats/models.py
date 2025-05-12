from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
import uuid

User = get_user_model()


class Conversation(models.Model):
    """
    Model for conversations between users, replacing the old ChatSession model.
    Supports both direct (1-to-1) and group conversations.
    The actual messages are stored in Cassandra.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, blank=True)  # Required for group chats
    participants = models.ManyToManyField(User, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_group = models.BooleanField(default=False)
    is_direct = models.BooleanField(default=False)
    # For direct conversations, store sorted participant IDs for uniqueness constraint
    direct_participants = models.CharField(max_length=255, blank=True)
    
    class Meta:
        verbose_name = _('conversation')
        verbose_name_plural = _('conversations')
        ordering = ['-updated_at']
        db_table = 'conversation'
        constraints = [
            models.UniqueConstraint(
                fields=['direct_participants'],
                condition=models.Q(is_direct=True),
                name='unique_direct_conversation'
            )
        ]
    
    def __str__(self):
        if self.is_group and self.name:
            return f"Group: {self.name}"
        participants_str = ", ".join([user.username for user in self.participants.all()[:3]])
        if self.participants.count() > 3:
            participants_str += f" and {self.participants.count() - 3} more"
        return f"Conversation: {participants_str}"


class ChatMessage:
    """
    This is just a placeholder class for the Cassandra-stored messages.
    Actual implementation is in cassandra_models_conversation.py
    """
    pass


class Attachment(models.Model):
    """
    Model for message attachments (files, images, etc.)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='attachments')
    message_id = models.UUIDField()  # Reference to the message in Cassandra
    file = models.FileField(upload_to='attachments/')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=50)
    file_size = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    
    class Meta:
        verbose_name = _('attachment')
        verbose_name_plural = _('attachments')
        ordering = ['-created_at']
        db_table = 'attachment'
    
    def __str__(self):
        return f"{self.file_name} - {self.uploaded_by.username}"


# Legacy model - will be removed after migration
class ChatSession(models.Model):
    """
    Legacy chat session model. 
    Being replaced by the Conversation model.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    participants = models.ManyToManyField(User, related_name='chat_sessions')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_group_chat = models.BooleanField(default=False)
    name = models.CharField(max_length=255, blank=True, null=True)  # For group chats
    
    class Meta:
        verbose_name = _('chat session')
        verbose_name_plural = _('chat sessions')
        ordering = ['-updated_at']
        db_table = 'chat_session'
    
    def __str__(self):
        if self.is_group_chat and self.name:
            return f"Group: {self.name}"
        participants_str = ", ".join([user.username for user in self.participants.all()[:3]])
        if self.participants.count() > 3:
            participants_str += f" and {self.participants.count() - 3} more"
        return f"Chat: {participants_str}"
    
    def __str__(self):
        if self.is_group_chat and self.name:
            return f"Group: {self.name}"
        participants_str = ", ".join([user.username for user in self.participants.all()[:3]])
        if self.participants.count() > 3:
            participants_str += f" and {self.participants.count() - 3} more"
        return f"Chat: {participants_str}"
