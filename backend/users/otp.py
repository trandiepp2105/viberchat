import random
import string
from datetime import timedelta
from django.core.cache import cache
from django.utils import timezone

# OTP Types
OTP_REGISTRATION = 'registration'
OTP_PASSWORD_RESET = 'password_reset'
OTP_EMAIL_CHANGE = 'email_change'

# Cache key prefixes
OTP_CACHE_PREFIX = 'otp:'
OTP_DATA_CACHE_PREFIX = 'otp_data:'

# OTP expiry time in minutes
DEFAULT_OTP_EXPIRY_MINUTES = 10


def generate_otp(email, otp_type, user_id=None, expiry_minutes=DEFAULT_OTP_EXPIRY_MINUTES):
    """
    Generate a new OTP code and save to Redis cache
    
    Args:
        email (str): Email address
        otp_type (str): Type of OTP (registration, password_reset, email_change)
        user_id (str, optional): User ID if available
        expiry_minutes (int, optional): Expiry time in minutes
        
    Returns:
        dict: OTP information
    """
    # Generate random 6 digit code
    otp_code = ''.join(random.choices(string.digits, k=6))
    
    # Create key for storing the OTP
    cache_key = f"{OTP_CACHE_PREFIX}{email}:{otp_type}"
    
    # Expiry time
    expires_in_seconds = expiry_minutes * 60
    
    # Store the OTP with expiry
    cache.set(cache_key, otp_code, timeout=expires_in_seconds)
    
    # Store additional data if needed
    if user_id:
        data_key = f"{OTP_DATA_CACHE_PREFIX}{email}:{otp_type}"
        data = {
            'user_id': user_id,
            'created_at': timezone.now().isoformat()
        }
        cache.set(data_key, data, timeout=expires_in_seconds)
    
    # Return OTP info
    return {
        'email': email,
        'otp_code': otp_code,
        'otp_type': otp_type,
        'expires_at': timezone.now() + timedelta(minutes=expiry_minutes)
    }


def verify_otp(email, otp_code, otp_type):
    """
    Verify an OTP code from Redis cache
    
    Args:
        email (str): Email address
        otp_code (str): OTP code to verify
        otp_type (str): Type of OTP (registration, password_reset, email_change)
        
    Returns:
        dict: OTP data if valid, None otherwise
    """
    # Create key for retrieving the OTP
    cache_key = f"{OTP_CACHE_PREFIX}{email}:{otp_type}"
    
    # Get stored OTP
    stored_otp = cache.get(cache_key)
    
    if not stored_otp or stored_otp != otp_code:
        return None
    
    # Get additional data if available
    data_key = f"{OTP_DATA_CACHE_PREFIX}{email}:{otp_type}"
    data = cache.get(data_key) or {}
    
    # Delete the OTP after successful verification (one-time use)
    cache.delete(cache_key)
    cache.delete(data_key)
    
    # Return verification data
    return {
        'email': email,
        'otp_type': otp_type,
        'user_id': data.get('user_id'),
        'is_valid': True
    }


def invalidate_otp(email, otp_type):
    """
    Invalidate an OTP by deleting it from cache
    
    Args:
        email (str): Email address
        otp_type (str): Type of OTP
    """
    cache_key = f"{OTP_CACHE_PREFIX}{email}:{otp_type}"
    data_key = f"{OTP_DATA_CACHE_PREFIX}{email}:{otp_type}"
    
    cache.delete(cache_key)
    cache.delete(data_key)
