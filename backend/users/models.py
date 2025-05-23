from django.db import models
from django.contrib.auth.models import BaseUserManager, AbstractUser
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
import random
import string

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get('is_superuser') is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)
class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser
    """
    email = models.EmailField(_('email address'), unique=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    is_email_verified = models.BooleanField(default=False)
    
    STATUS_CHOICES = (
        ('online', 'Online'),
        ('away', 'Away'),
        ('busy', 'Busy'),
        ('offline', 'Offline'),
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='offline')
    last_active = models.DateTimeField(null=True, blank=True)
      # Additional fields for user settings
    dark_mode = models.BooleanField(default=False)
    notifications_enabled = models.BooleanField(default=True)
    sound_effects_enabled = models.BooleanField(default=True)
    
    # Use username field for authentication (default in AbstractUser)
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']
    
    def __str__(self):
        return self.username
        
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        db_table = 'user'


class Contact(models.Model):
    """
    Model to represent contacts between users
    """
    user = models.ForeignKey(User, related_name='contacts', on_delete=models.CASCADE)
    contact = models.ForeignKey(User, related_name='contact_of', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'contact'
        unique_together = ('user', 'contact')
        verbose_name = _('contact')
        verbose_name_plural = _('contacts')
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.user.username}'s contact: {self.contact.username}"


# OTPVerification model is no longer used - OTPs are now stored in Redis cache
"""
class OTPVerification(models.Model):
    OTP_TYPES = (
        ('registration', 'Registration'),
        ('password_reset', 'Password Reset'),
        ('email_change', 'Email Change'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='otp_codes')
    email = models.EmailField(_('email address'))
    otp_code = models.CharField(max_length=6)
    otp_type = models.CharField(max_length=20, choices=OTP_TYPES)
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
      class Meta:
        verbose_name = _('OTP verification')
        verbose_name_plural = _('OTP verifications')
        db_table = 'otp_verification'
        
    def __str__(self):
        return f"OTP for {self.email}: {self.otp_code}"
        
    def is_valid(self):
        return not self.is_used and timezone.now() <= self.expires_at
    
    @classmethod
    def generate_otp(cls, email, otp_type, user=None, expiry_minutes=10):
        otp_code = ''.join(random.choices(string.digits, k=6))
        expires_at = timezone.now() + timezone.timedelta(minutes=expiry_minutes)
        otp_verification = cls.objects.create(
            user=user,
            email=email,
            otp_code=otp_code,
            otp_type=otp_type,
            expires_at=expires_at
        )
        return otp_verification
"""
