from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework import viewsets, generics, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Contact
from .serializers import (
    UserSerializer, 
    UserDetailSerializer,
    UserRegistrationSerializer,
    PasswordChangeSerializer,
    ContactSerializer,
    OTPVerificationSerializer,
    PasswordResetRequestSerializer,
    PasswordResetCompleteSerializer,
    ResendOTPSerializer
)
from users.utils import send_otp_email
from users.otp import generate_otp, verify_otp, OTP_REGISTRATION, OTP_PASSWORD_RESET, OTP_EMAIL_CHANGE

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user operations.
    
    retrieve:
    Get a specific user's profile by ID.
    
    list:
    Get a list of all users (requires authentication).
    
    create:
    Create a new user (admin only).
    
    update:
    Update a user's information (admin or user themselves).
    
    partial_update:
    Partially update a user's information.
    
    delete:
    Delete a user (admin only).
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['status']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            return User.objects.none()
        return super().get_queryset()
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return UserDetailSerializer
        return self.serializer_class
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return super().get_permissions()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile"""
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put'], serializer_class=UserDetailSerializer)
    def update_profile(self, request):
        """Update current user profile"""
        serializer = UserDetailSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    @action(detail=False, methods=['post'], serializer_class=PasswordChangeSerializer)
    def change_password(self, request):
        """Change user password with OTP verification"""
        user = request.user
        
        # First, generate and send OTP
        if 'step' not in request.data or request.data['step'] == 'request_otp':
            # Generate OTP for password change
            otp_data = generate_otp(
                email=user.email,
                otp_type=OTP_PASSWORD_RESET,
                user_id=str(user.id)
            )
            
            # Send OTP email
            send_otp_email(user.email, otp_data['otp_code'], OTP_PASSWORD_RESET)
            
            return Response({
                "message": "Verification code has been sent to your email",
                "step": "verify_otp"
            })
        # Verify OTP
        elif request.data['step'] == 'verify_otp':
            # Verify OTP code
            otp_data = verify_otp(
                email=user.email,
                otp_code=request.data.get('otp_code', ''),
                otp_type=OTP_PASSWORD_RESET
            )
            
            if not otp_data or not otp_data.get('is_valid'):
                return Response(
                    {"otp_code": "Invalid or expired OTP code."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                "message": "OTP verification successful",
                "step": "change_password"
            })
        
        # Change password
        elif request.data['step'] == 'change_password':
            serializer = PasswordChangeSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            
            # Check old password
            if not user.check_password(serializer.validated_data['old_password']):
                return Response(
                    {"old_password": ["Wrong password."]}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"message": "Password changed successfully"})
        
        return Response({"error": "Invalid step"}, status=status.HTTP_400_BAD_REQUEST)


class RegisterView(generics.CreateAPIView):
    """
    API endpoint for user registration.
    
    Creates a new user account and sends an OTP verification code to the user's email.
    
    Requires:
    - username: The username for the new account
    - email: The email address for verification
    - password: The account password
    - first_name, last_name: Optional personal information
    
    Returns:
    - A success message with the email address for OTP verification
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Create user but set as inactive until email verification
        user = serializer.save(is_active=False, is_email_verified=False)
        
        # Generate OTP for email verification
        otp_data = generate_otp(
            email=user.email,
            otp_type=OTP_REGISTRATION,
            user_id=str(user.id)
        )
    
        # Send OTP email
        send_otp_email(user.email, otp_data['otp_code'], OTP_REGISTRATION)
    
        return Response({
            "message": "Registration successful. Please check your email for verification code.",
            "email": user.email
        }, status=status.HTTP_201_CREATED)


class VerifyOTPView(generics.GenericAPIView):
    """
    API endpoint for OTP verification after registration
    
    Verifies the OTP code sent to the user's email and activates the user account.
    
    Requires:
    - email: The email address the OTP was sent to
    - otp_code: The 6-digit verification code
    - otp_type: The type of OTP (registration, password reset, etc.)
    
    Returns:
    - A success message with a JWT token upon successful verification
    - Error details if verification fails
    """
    serializer_class = OTPVerificationSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get the OTP data
        otp_data = serializer.validated_data['otp_data']
        
        # Check if it's a registration OTP
        if otp_data['otp_type'] != OTP_REGISTRATION:
            return Response(
                {"error": "Invalid OTP type"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user and activate account
        try:
            user = User.objects.get(id=otp_data['user_id'])
            user.is_active = True
            user.is_email_verified = True
            user.save()
            
            return Response({
                "message": "Email verification successful. You can now login."
            })
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class ResendOTPView(generics.GenericAPIView):
    """
    API endpoint to resend OTP verification code
    
    Resends the OTP verification code to a user's email address.
    
    Requires:
    - email: The email address to send the OTP to
    - otp_type: The type of OTP (registration, password reset, etc.)
    
    Returns:
    - A success message confirming the OTP has been sent
    - Error details if the request fails
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = ResendOTPSerializer
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        otp_type = serializer.validated_data.get('otp_type', OTP_REGISTRATION)
        
        # Get user if exists
        try:
            user = User.objects.get(email=email)
            user_id = str(user.id)
        except User.DoesNotExist:
            if otp_type == OTP_REGISTRATION:
                return Response(
                    {"error": "No pending registration found for this email"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            user_id = None
        
        # Generate new OTP
        otp_data = generate_otp(
            email=email,
            otp_type=otp_type,
            user_id=user_id
        )
        
        # Send OTP email
        send_otp_email(email, otp_data['otp_code'], otp_type)
        
        return Response({
            "message": f"Verification code has been sent to {email}"
        })


class PasswordResetRequestView(generics.GenericAPIView):
    """
    API endpoint to request password reset
    
    Initiates the password reset process by sending an OTP to the user's email.
    
    Requires:
    - email: The email address associated with the user account
    
    Returns:
    - A success message confirming the OTP has been sent
    - Error details if the email is not found
    """
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        
        # Get user
        try:
            user = User.objects.get(email=email)
            user_id = str(user.id)
        except User.DoesNotExist:
            # We'll still return success to prevent email enumeration attacks
            return Response({
                "message": "If your email is registered, you will receive a password reset code"
            })
        
        # Generate OTP for password reset
        otp_data = generate_otp(
            email=email,
            otp_type=OTP_PASSWORD_RESET,
            user_id=user_id
        )
        
        # Send OTP email
        send_otp_email(email, otp_data['otp_code'], OTP_PASSWORD_RESET)
        
        return Response({
            "message": "Password reset code has been sent to your email"
        })


class PasswordResetCompleteView(generics.GenericAPIView):
    """
    API endpoint to complete password reset with OTP
    
    Completes the password reset process by verifying the OTP and setting a new password.
    
    Requires:
    - email: The email address associated with the user account
    - otp_code: The verification code received by email
    - password: The new password to set
    
    Returns:
    - A success message upon successful password reset
    - Error details if the OTP verification fails
    """
    serializer_class = PasswordResetCompleteSerializer
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Get the OTP data
        otp_data = serializer.validated_data['otp_data']
        
        # Get user and reset password
        try:
            user = User.objects.get(email=otp_data['email'])
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({
                "message": "Password has been reset successfully. You can now login with your new password."
            })
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class ContactViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user contacts.
    
    retrieve:
    Get a specific contact by ID.
    
    list:
    Get all contacts for the authenticated user.
    
    create:
    Add a new contact to the authenticated user's contact list.
    
    update:
    Update an existing contact's information.
    
    partial_update:
    Partially update a contact's information.
    
    delete:
    Remove a contact from the user's contact list.
    """
    serializer_class = ContactSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # Check if this is a schema generation request
        if getattr(self, 'swagger_fake_view', False):
            # Return an empty queryset
            return Contact.objects.none()
            
        return Contact.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Search for users to add as contacts"""
        query = request.query_params.get('q', '')
        if not query:
            return Response([], status=status.HTTP_200_OK)
            
        # Get all users matching query, excluding current user and existing contacts
        existing_contacts = Contact.objects.filter(user=request.user).values_list('contact_id', flat=True)
        users = User.objects.filter(
            username__icontains=query
        ).exclude(
            id=request.user.id
        ).exclude(
            id__in=existing_contacts
        )[:10]
        
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
