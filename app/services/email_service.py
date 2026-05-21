from email.mime.text import MIMEText
import smtplib
from typing import Iterable, List

from app.core.config import get_settings
from app.core.logging import get_logger

logger = get_logger("app.email")


class EmailDeliveryError(RuntimeError):
    pass


def _configured_recipients(raw: str) -> List[str]:
    return [email.strip() for email in raw.split(",") if email.strip()]


def admin_recipients() -> List[str]:
    return _configured_recipients(get_settings().SMTP_ADMIN_RECIPIENTS)


def send_email(
    *,
    recipients: Iterable[str],
    subject: str,
    body: str,
    fail_silently: bool = True,
) -> bool:
    settings = get_settings()
    recipient_list = [email.strip() for email in recipients if email and email.strip()]
    if not recipient_list:
        logger.warning("email.skipped reason=no_recipients subject=%s", subject)
        if not fail_silently:
            raise EmailDeliveryError("No recipients were provided for this email.")
        return False

    if not settings.SMTP_HOST or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.warning("email.skipped reason=smtp_not_configured subject=%s", subject)
        if not fail_silently:
            raise EmailDeliveryError("SMTP is not configured for transactional email delivery.")
        return False

    from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    message = MIMEText(body, "plain", "utf-8")
    message["Subject"] = subject
    message["From"] = f"{settings.SMTP_FROM_NAME} <{from_email}>"
    message["To"] = ", ".join(recipient_list)

    try:
        if settings.SMTP_USE_SSL:
            with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.sendmail(from_email, recipient_list, message.as_string())
        else:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=20) as server:
                server.starttls()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.sendmail(from_email, recipient_list, message.as_string())
        logger.info("email.sent recipients=%s subject=%s", len(recipient_list), subject)
        return True
    except Exception:
        logger.exception("email.failed subject=%s", subject)
        if not fail_silently:
            raise EmailDeliveryError("Email delivery failed. Please try again later.")
        return False
