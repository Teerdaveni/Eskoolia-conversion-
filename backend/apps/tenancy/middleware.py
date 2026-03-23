from typing import Optional
from .models import School


class TenantContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.school = self._resolve_school(request)
        return self.get_response(request)

    def _resolve_school(self, request) -> Optional[School]:
        school_id = request.headers.get("X-School-Id")
        if not school_id:
            return None
        try:
            return School.objects.filter(id=school_id, is_active=True).first()
        except (ValueError, TypeError):
            return None
