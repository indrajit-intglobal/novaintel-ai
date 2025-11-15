"""
Email service for sending verification emails using Google SMTP.
"""
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from utils.config import settings

# Email configuration for Google SMTP
# Google SMTP settings: smtp.gmail.com, port 587, STARTTLS
conf = ConnectionConfig(
    MAIL_USERNAME=settings.mail_username,
    MAIL_PASSWORD=settings.mail_password,
    MAIL_FROM=settings.mail_from,
    MAIL_PORT=settings.mail_port,
    MAIL_SERVER=settings.mail_server,
    MAIL_FROM_NAME="NovaIntel",
    MAIL_STARTTLS=settings.MAIL_TLS,  # Use STARTTLS for Google SMTP
    MAIL_SSL_TLS=settings.MAIL_SSL,  # SSL not used for port 587
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_verification_email(email: str, verification_token: str):
    """Send email verification link via Google SMTP."""
    if not settings.mail_username or not settings.mail_password:
        print(f"⚠ Email not configured. Verification link: {settings.FRONTEND_URL}/verify-email/{verification_token}")
        return
    
    verification_url = f"{settings.FRONTEND_URL}/verify-email/{verification_token}"
    
    message = MessageSchema(
        subject="Verify your NovaIntel account",
        recipients=[email],
        body=f"""
        <html>
        <body>
            <h2>Welcome to NovaIntel!</h2>
            <p>Please verify your email address by clicking the link below:</p>
            <p><a href="{verification_url}">Verify Email</a></p>
            <p>Or copy this link: {verification_url}</p>
            <p>This link will expire in 7 days.</p>
        </body>
        </html>
        """,
        subtype="html"
    )
    
    fm = FastMail(conf)
    await fm.send_message(message)

