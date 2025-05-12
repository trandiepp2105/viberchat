from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .otp import OTP_REGISTRATION, OTP_PASSWORD_RESET, OTP_EMAIL_CHANGE


def send_otp_email(email, otp_code, otp_type):
    """
    Send OTP verification email
    """
    subject_map = {
        OTP_REGISTRATION: 'Verify Your ViberChat Account',
        OTP_PASSWORD_RESET: 'Reset Your ViberChat Password',
        OTP_EMAIL_CHANGE: 'Verify Your New Email Address'
    }

    subject = subject_map.get(otp_type, 'ViberChat Verification Code')
    
    # Create HTML content
    html_message = f'''
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }}
            .container {{ padding: 20px; border: 1px solid #ddd; border-radius: 5px; }}
            .header {{ text-align: center; padding: 10px; }}
            .header h1 {{ color: #7c5dfa; }}
            .content {{ padding: 20px 0; }}
            .code {{ background-color: #f7f7f7; padding: 10px; font-size: 24px; font-weight: bold; text-align: center; 
                     letter-spacing: 5px; border-radius: 4px; margin: 20px 0; color: #333; }}
            .footer {{ text-align: center; font-size: 12px; color: #777; padding-top: 20px; border-top: 1px solid #eee; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>ViberChat</h1>
            </div>
            <div class="content">
                <p>Hello,</p>
    '''
    
    if otp_type == OTP_REGISTRATION:
        html_message += '''
                <p>Thank you for signing up for ViberChat. To complete your registration, please verify your email address by entering the verification code below:</p>
        '''
    elif otp_type == OTP_PASSWORD_RESET:
        html_message += '''
                <p>We received a request to reset your password. Please enter the verification code below to proceed with resetting your password:</p>
        '''
    elif otp_type == OTP_EMAIL_CHANGE:
        html_message += '''
                <p>We received a request to change your email address. Please enter the verification code below to confirm your new email address:</p>
        '''
    
    html_message += f'''
                <div class="code">{otp_code}</div>
                <p>This code will expire in 10 minutes for security reasons.</p>
                <p>If you did not request this code, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
                <p>&copy; {settings.SITE_NAME if hasattr(settings, 'SITE_NAME') else 'ViberChat'} Team. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    '''
    
    # Plain text version
    plain_message = strip_tags(html_message)
    
    # Send email
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        html_message=html_message,
        fail_silently=False,
    )
    
    return True
