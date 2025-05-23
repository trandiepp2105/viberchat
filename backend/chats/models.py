from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
import uuid

User = get_user_model()


class Conversation(models.Model):
    """
    Model for conversations between users.
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
    direct_participants = models.CharField(max_length=255, blank=True, db_index=True)
    
    class Meta:
        verbose_name = _('conversation')
        verbose_name_plural = _('conversations')
        ordering = ['-updated_at']
        db_table = 'conversation'
        # Sử dụng index thay vì ràng buộc duy nhất có điều kiện
        indexes = [
            models.Index(fields=['direct_participants'], name='direct_participants_idx')
        ]
    
    def save(self, *args, **kwargs):
        # Thực hiện kiểm tra tính duy nhất theo cách thủ công cho direct_participants
        if self.is_direct and self.direct_participants:
            # Kiểm tra xem đã tồn tại cuộc trò chuyện trực tiếp với cùng participants chưa
            existing = Conversation.objects.filter(
                is_direct=True, 
                direct_participants=self.direct_participants
            ).exclude(pk=self.pk).exists()
            
            if existing:
                raise ValueError(f"Đã tồn tại một cuộc trò chuyện trực tiếp với direct_participants={self.direct_participants}")
        
        super().save(*args, **kwargs)
    
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
    Actual implementation is in cassandra_models.py
    
    Note: Do not use this class directly. Import ChatMessage from cassandra_models instead.
    """
    @classmethod
    def get_meta(cls):
        try:
            import logging
            logging.warning("ChatMessage.get_meta() called from models.py - this is not recommended")
            from chats.cassandra_models import ChatMessage as CassandraMessage
            return CassandraMessage._meta
        except (ImportError, AttributeError) as e:
            import logging
            logging.error(f"Error accessing ChatMessage from cassandra_models: {e}")
            logging.error(f"This error typically happens when importing ChatMessage from models.py instead of cassandra_models.py")
            raise


class Attachment(models.Model):
    """
    Model for message attachments (files, images, etc.)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='attachments', null=True)
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
