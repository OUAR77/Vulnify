import logging
from datetime import datetime
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


def send_admin_login_alert(email: str, name: str, ip: str) -> bool:
    if not SG:
        logger.warning("SendGrid no configurado, admin login alert for %s from %s", email, ip)
        return False
    try:
        mail = Mail(
            from_email=Email("noreply@vulnify.es"),
            to_emails=To(email),
            subject="[Vulnify] Inicio de sesión admin detectado",
            plain_text_content=f"Hola {name},\n\nSe ha detectado un inicio de sesión en tu cuenta de administrador de Vulnify.\n\nIP: {ip}\nFecha: {datetime.now()}\n\nSi no fuiste tú, cambia tu contraseña inmediatamente.",
            html_content=f"<h2>Inicio de sesión admin</h2><p>Hola {name},</p><p>Se ha detectado un inicio de sesión en tu cuenta de administrador.</p><table><tr><td><strong>IP:</strong></td><td>{ip}</td></tr><tr><td><strong>Fecha:</strong></td><td>{datetime.now()}</td></tr></table><p style='color: #dc3545;'>Si no fuiste tú, <strong><a href='{settings.SITE_URL}/login'>cambia tu contraseña</a></strong> inmediatamente.</p><hr><p style='color: #6c757d;'>Vulnify - Monitorización de Reputación Digital</p>",
        )
        response = SG.send(mail)
        logger.info("Admin login alert sent to %s (status %s)", email, response.status_code)
        return True
    except Exception as e:
        logger.error("Failed to send admin login alert to %s: %s", email, e)
        return False


def send_breach_alert(email: str, name: str, asset: str, breach_count: int, severity: str) -> bool:
    if not SG:
        logger.warning("SendGrid no configurado, breach alert for %s", asset)
        return False
    severity_labels = {"critical": "Crítica", "high": "Alta", "medium": "Media", "low": "Baja"}
    sev_label = severity_labels.get(severity, severity)
    try:
        mail = Mail(
            from_email=Email("noreply@vulnify.es"),
            to_emails=To(email),
            subject=f"[Vulnify] Alerta {sev_label} - {asset} comprometido",
            plain_text_content=f"Hola {name},\n\nSe han detectado {breach_count} brecha(s) de datos en {asset} con severidad {sev_label}.\n\nRevisa tu dashboard para más detalles:\n{settings.SITE_URL}/dashboard\n\nVulnify - Monitorización de Reputación Digital",
            html_content=f"<h2>Alerta de seguridad</h2><p>Hola {name},</p><p>Se han detectado <strong>{breach_count}</strong> brecha(s) de datos en <strong>{asset}</strong> con severidad <strong>{sev_label}</strong>.</p><p><a href='{settings.SITE_URL}/dashboard'>Revisa tu dashboard</a> para más detalles.</p><hr><p style='color: #6c757d;'>Vulnify - Monitorización de Reputación Digital</p>",
        )
        response = SG.send(mail)
        logger.info("Breach alert email sent to %s (status %s)", email, response.status_code)
        return True
    except Exception as e:
        logger.error("Failed to send breach alert to %s: %s", email, e)
        return False
