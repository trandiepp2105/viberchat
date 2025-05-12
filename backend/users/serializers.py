from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from .models import Contact
from .utils import send_otp_email
from .otp import generate_otp, verify_otp, OTP_REGISTRATION, OTP_PASSWORD_RESET, OTP_EMAIL_CHANGE

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model"""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'avatar', 'bio', 'phone_number', 
                  'status', 'last_active', 'date_joined', 'dark_mode', 
                  'notifications_enabled', 'sound_effects_enabled', 'is_email_verified']
        read_only_fields = ['id', 'date_joined', 'last_active', 'is_email_verified']


class UserDetailSerializer(UserSerializer):
    """Extended User serializer with more details"""
    
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['first_name', 'last_name']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']
        
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        
        # Check if username is already in use
        username = attrs['username']
        if User.objects.filter(username=username).exists():
            raise serializers.ValidationError({"username": "User with this username already exists."})
            
        # Check if email is already in use
        email = attrs['email']
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "User with this email already exists."})
            
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
          # Create inactive user first (will be activated after OTP verification)
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_active=False,
            is_email_verified=False
        )
        
        # Generate OTP for registration
        otp_data = generate_otp(
            email=user.email,
            otp_type=OTP_REGISTRATION,
            user_id=str(user.id)
        )
        
        # Send OTP email
        send_otp_email(user.email, otp_data['otp_code'], OTP_REGISTRATION)
        
        return user


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change"""
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        return attrs


class OTPVerificationSerializer(serializers.Serializer):
    """Serializer for OTP verification"""
    
    email = serializers.EmailField(required=True)
    otp_code = serializers.CharField(required=True, min_length=6, max_length=6)
    
    def validate(self, attrs):
        email = attrs['email']
        otp_code = attrs['otp_code']
        
        # Verify OTP from Redis
        otp_data = verify_otp(email, otp_code, OTP_REGISTRATION)
        
        if not otp_data or not otp_data.get('is_valid'):
            raise serializers.ValidationError({"otp_code": "Invalid or expired OTP code."})
        
        # Store the OTP data for the view
        attrs['otp_data'] = otp_data
        return attrs


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for requesting password reset"""
    
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        if not User.objects.filter(email=value).exists():
            raise serializers.ValidationError("No user found with this email address.")
        return value


class PasswordResetCompleteSerializer(serializers.Serializer):
    """Serializer for completing password reset"""
    
    email = serializers.EmailField(required=True)
    otp_code = serializers.CharField(required=True, min_length=6, max_length=6)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    new_password2 = serializers.CharField(required=True)
    
    def validate(self, attrs):
        # Validate passwords match
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError({"new_password": "Password fields didn't match."})
        
        # Validate OTP
        email = attrs['email']
        otp_code = attrs['otp_code']
        
        # Verify OTP from Redis
        otp_data = verify_otp(email, otp_code, OTP_PASSWORD_RESET)
        
        if not otp_data or not otp_data.get('is_valid'):
            raise serializers.ValidationError({"otp_code": "Invalid or expired OTP code."})
        
        # Store the OTP data for the view
        attrs['otp_data'] = otp_data
        return attrs


class ContactSerializer(serializers.ModelSerializer):
    """Serializer for the Contact model"""
    
    contact_details = UserSerializer(source='contact', read_only=True)
    
    class Meta:
        model = Contact
        fields = ['id', 'contact', 'contact_details', 'created_at']
        read_only_fields = ['id', 'created_at']


class ResendOTPSerializer(serializers.Serializer):
    """Serializer for resending OTP"""
    
    email = serializers.EmailField(required=True)
    otp_type = serializers.CharField(required=False, default=OTP_REGISTRATION)
    
    def validate_otp_type(self, value):
        valid_types = [OTP_REGISTRATION, OTP_PASSWORD_RESET, OTP_EMAIL_CHANGE]
        if value not in valid_types:
            raise serializers.ValidationError(f"OTP type must be one of: {', '.join(valid_types)}")
        return value
