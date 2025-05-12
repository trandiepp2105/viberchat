from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=User)
def update_last_active(sender, instance, created, **kwargs):
    """
    Update last_active timestamp when a user is created or updated
    """
    if created:
        instance.last_active = timezone.now()
        instance.save(update_fields=['last_active'])
