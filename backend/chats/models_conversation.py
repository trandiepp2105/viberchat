import uuid
from django.db import models
from django.conf import settings

class Conversation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, blank=True)
    is_group = models.BooleanField(default=False)
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='conversations')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Thêm trường để đánh dấu đây là conversation 1-1
    is_direct = models.BooleanField(default=True)
    
    # Thêm trường để lưu danh sách người dùng (dùng cho direct conversations)
    direct_participants = models.CharField(max_length=100, blank=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['direct_participants'],
                condition=models.Q(is_direct=True),
                name='unique_direct_conversation'
            )
        ]
        
    def __str__(self):
        if self.is_group:
            return f"Group: {self.name} ({self.id})"
        return f"Direct conversation: {self.direct_participants} ({self.id})"
