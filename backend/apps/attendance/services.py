from importlib import import_module
from typing import Any, Dict

from django.conf import settings


def _resolve_callable(path: str):
    module_name, func_name = path.rsplit(".", 1)
    module = import_module(module_name)
    return getattr(module, func_name)


def send_sms_compat(phone: str | None, template: str, context: Dict[str, Any]) -> None:
    """
    Compatibility hook for legacy send_sms usage.
    If ATTENDANCE_SMS_SENDER is configured (import path), invoke it.
    Otherwise no-op to keep flow parity without breaking runtime.
    """
    if not phone:
        return

    sender_path = getattr(settings, "ATTENDANCE_SMS_SENDER", "")
    if not sender_path:
        return

    sender = _resolve_callable(sender_path)
    sender(phone=phone, template=template, context=context)


def send_present_attendance_notifications(student, attendance_date) -> None:
    context = {
        "attendance_date": str(attendance_date),
        "student_id": student.id,
        "student_name": f"{student.first_name} {student.last_name}".strip(),
    }

    student_phone = getattr(student, "mobile", None) or getattr(student, "phone", None)
    send_sms_compat(student_phone, "student_attendance", context)

    guardian_phone = None
    guardian = getattr(student, "guardian", None)
    if guardian is not None:
        guardian_phone = getattr(guardian, "phone", None)
    send_sms_compat(guardian_phone, "student_attendance_for_parent", context)
