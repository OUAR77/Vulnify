import logging
from datetime import datetime
from config import settings

logger = logging.getLogger("vulnify.email")

try:
    import sendgrid
    from sendgrid.helpers.mail import Mail, Email, To, Content, TrackingSettings, ClickTracking
    SG = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY) if settings.SENDGRID_API_KEY else None
except ImportError:
    SG = None


def _html_wrapper(body: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px">
<tr><td align="center">
  <table role="presentation" width="100%" style="max-width:560px;background:#111;border-radius:16px;border:1px solid #222;overflow:hidden">
    <tr><td style="padding:40px 32px 32px;text-align:center;border-bottom:1px solid #222">
      <span style="display:inline-block;width:40px;height:40px;border-radius:50%;border:2px solid #333;margin-bottom:12px"></span>
      <h1 style="margin:0;font-size:20px;font-weight:600;color:#fff;letter-spacing:-0.3px">Vulnify</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#666">Ecosistemas Digitales con IA</p>
    </td></tr>
    <tr><td style="padding:32px;color:#ccc;font-size:15px;line-height:1.6">
      {body}
    </td></tr>
    <tr><td style="padding:24px 32px;background:#0d0d0d;text-align:center;border-top:1px solid #222">
      <p style="margin:0;font-size:12px;color:#555">
        Vulnify &mdash; Ecosistemas Digitales con IA<br>
        <a href="{settings.SITE_URL}" style="color:#888;text-decoration:underline">vulnify.es</a>
      </p>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>"""


def _send(mail: Mail) -> bool:
    if not SG:
        return False
    try:
        mail.tracking_settings = TrackingSettings(click_tracking=ClickTracking(enable=False, enable_text=False))
        response = SG.send(mail)
        logger.info("Email sent to %s (status %s)", mail.to.get("email", "unknown"), response.status_code)
        return True
    except Exception as e:
        logger.error("Failed to send email: %s", e)
        return False


def send_password_reset(email: str, token: str) -> bool:
    if not SG:
        logger.warning("SendGrid no configurado, token: %s", token)
        return False
    reset_link = f"{settings.SITE_URL}/reset-password?token={token}"
    body = f"""
    <p style="margin:0 0 16px">Recibimos una solicitud para restablecer tu contraseña.</p>
    <p style="margin:0 0 24px;color:#999">Haz clic en el botón para crear una nueva:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 32px">
      <tr>
        <td align="center" style="background:#fff;border-radius:999px;padding:14px 36px;font-size:15px;font-weight:600">
          <a href="{reset_link}" style="color:#000;text-decoration:none;display:block">Restablecer contraseña</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 4px;font-size:13px;color:#666">O copia este enlace en tu navegador:</p>
    <p style="margin:0;font-size:12px;color:#555;word-break:break-all">{reset_link}</p>
    <p style="margin:24px 0 0;font-size:13px;color:#666;border-top:1px solid #222;padding-top:20px">Si no solicitaste esto, ignora este mensaje.</p>
    """
    return _send(Mail(
        from_email=Email("noreply@vulnify.es"),
        to_emails=To(email),
        subject="Restablece tu contraseña — Vulnify",
        plain_text_content=f"Restablece tu contraseña:\n\n{reset_link}\n\nSi no solicitaste esto, ignora este mensaje.",
        html_content=_html_wrapper(body),
    ))


def send_admin_login_alert(email: str, name: str, ip: str) -> bool:
    if not SG:
        logger.warning("SendGrid no configurado, admin login alert for %s from %s", email, ip)
        return False
    body = f"""
    <p style="margin:0 0 16px">Hola <strong style="color:#fff">{name}</strong>,</p>
    <p style="margin:0 0 24px;color:#999">Se detectó un inicio de sesión en tu cuenta de administrador:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;padding:16px 20px;margin:0 0 24px;width:100%">
      <tr><td style="padding:6px 0"><span style="color:#666;font-size:13px">IP</span></td><td style="padding:6px 0;text-align:right;color:#ccc;font-size:13px">{ip}</td></tr>
      <tr><td style="padding:6px 0"><span style="color:#666;font-size:13px">Fecha</span></td><td style="padding:6px 0;text-align:right;color:#ccc;font-size:13px">{datetime.now().strftime("%d/%m/%Y %H:%M")}</td></tr>
    </table>
    <p style="margin:0 0 4px;color:#f44336;font-size:14px;font-weight:600">¿No fuiste tú?</p>
    <p style="margin:0;color:#999;font-size:14px">
      <a href="{settings.SITE_URL}/login" style="color:#fff;text-decoration:underline">Cambia tu contraseña</a> inmediatamente.
    </p>
    """
    return _send(Mail(
        from_email=Email("noreply@vulnify.es"),
        to_emails=To(email),
        subject="[Vulnify] Inicio de sesión admin detectado",
        plain_text_content=f"Hola {name},\n\nSe detectó un inicio de sesión admin.\n\nIP: {ip}\nFecha: {datetime.now()}\n\nSi no fuiste tú, cambia tu contraseña inmediatamente:\n{settings.SITE_URL}/login",
        html_content=_html_wrapper(body),
    ))


def send_verification_email(email: str, token: str, name: str) -> bool:
    if not SG:
        logger.warning("SendGrid no configurado, verification token: %s", token)
        return False
    verify_link = f"{settings.SITE_URL}/verify-email?token={token}"
    body = f"""
    <p style="margin:0 0 16px">Hola <strong style="color:#fff">{name}</strong>,</p>
    <p style="margin:0 0 24px;color:#999">Confirma tu dirección de correo para activar tu cuenta:</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 32px">
      <tr>
        <td align="center" style="background:#fff;border-radius:999px;padding:14px 36px;font-size:15px;font-weight:600">
          <a href="{verify_link}" style="color:#000;text-decoration:none;display:block">Verificar email</a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 4px;font-size:13px;color:#666">O copia este enlace en tu navegador:</p>
    <p style="margin:0;font-size:12px;color:#555;word-break:break-all">{verify_link}</p>
    <p style="margin:24px 0 0;font-size:13px;color:#666;border-top:1px solid #222;padding-top:20px">Si no creaste una cuenta, ignora este mensaje.</p>
    """
    return _send(Mail(
        from_email=Email("noreply@vulnify.es"),
        to_emails=To(email),
        subject="Verifica tu email — Vulnify",
        plain_text_content=f"Hola {name},\n\nConfirma tu email:\n\n{verify_link}\n\nSi no creaste una cuenta, ignora este mensaje.",
        html_content=_html_wrapper(body),
    ))


def send_breach_alert(email: str, name: str, asset: str, breach_count: int, severity: str) -> bool:
    if not SG:
        logger.warning("SendGrid no configurado, breach alert for %s", asset)
        return False
    severity_labels = {"critical": "Crítica", "high": "Alta", "medium": "Media", "low": "Baja"}
    sev_label = severity_labels.get(severity, severity)
    sev_colors = {"critical": "#f44336", "high": "#ff9800", "medium": "#ffc107", "low": "#4caf50"}
    sev_color = sev_colors.get(severity, "#999")
    body = f"""
    <p style="margin:0 0 16px">Hola <strong style="color:#fff">{name}</strong>,</p>
    <p style="margin:0 0 20px;color:#999">Se detectaron <strong style="color:#fff">{breach_count} brecha(s)</strong> en tu activo:</p>
    <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin:0 0 24px;text-align:center">
      <p style="margin:0 0 8px;font-size:18px;font-weight:600;color:#fff">{asset}</p>
      <span style="display:inline-block;background:{sev_color};color:#000;font-size:12px;font-weight:700;padding:4px 14px;border-radius:999px;text-transform:uppercase">{sev_label}</span>
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px">
      <tr>
        <td align="center" style="background:#fff;border-radius:999px;padding:14px 36px;font-size:15px;font-weight:600">
          <a href="{settings.SITE_URL}/dashboard" style="color:#000;text-decoration:none;display:block">Revisar dashboard</a>
        </td>
      </tr>
    </table>
    """
    return _send(Mail(
        from_email=Email("noreply@vulnify.es"),
        to_emails=To(email),
        subject=f"[Vulnify] Alerta {sev_label} — {asset}",
        plain_text_content=f"Hola {name},\n\n{breach_count} brecha(s) detectadas en {asset} (severidad: {sev_label}).\n\nRevisa tu dashboard:\n{settings.SITE_URL}/dashboard",
        html_content=_html_wrapper(body),
    ))
