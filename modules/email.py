import logging
import os
from config import settings

logger = logging.getLogger("vulnify.email")

try:
    import sendgrid
    from sendgrid.helpers.mail import Mail, Email, To, Content
    SG = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY) if settings.SENDGRID_API_KEY else None
except ImportError:
    SG = None


def send_password_reset(email: str, token: str) -> bool:
    if not SG:
        logger.warning("SendGrid no configurado, token: %s", token)
        return False
    reset_link = f"{settings.SITE_URL}/reset-password?token={token}"
    try:
        mail = Mail(
            from_email=Email("noreply@vulnify.es"),
            to_emails=To(email),
            subject="Restablece tu contraseña en Vulnify",
            plain_text_content=f"Haz clic en este enlace para restablecer tu contraseña:\n\n{reset_link}\n\nSi no solicitaste esto, ignora este mensaje.",
            html_content=f"<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p><p><a href='{reset_link}'>{reset_link}</a></p><p>Si no solicitaste esto, ignora este mensaje.</p>",
        )
        response = SG.send(mail)
        logger.info("Password reset email sent to %s (status %s)", email, response.status_code)
        return True
    except Exception as e:
        logger.error("Failed to send email to %s: %s", email, e)
        return False
