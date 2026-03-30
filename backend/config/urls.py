from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from apps.users.views import HealthView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", HealthView.as_view(), name="health-check"),
    # Legacy compatibility endpoints expected by older UAT documents.
    path("admissions/", include("apps.admissions.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/v1/auth/", include("apps.users.urls")),
    path("api/v1/access-control/", include("apps.access_control.urls")),
    path("api/v1/admissions/", include("apps.admissions.urls")),
    path("api/v1/core/", include("apps.core.urls")),
    path("api/v1/students/", include("apps.students.urls")),
    path("api/v1/academics/", include("apps.academics.urls")),
    path("api/v1/attendance/", include("apps.attendance.urls")),
    path("api/v1/fees/", include("apps.fees.urls")),
    path("api/v1/exams/", include("apps.exams.urls")),
    path("api/v1/finance/", include("apps.finance.urls")),
    path("api/v1/hr/", include("apps.hr.urls")),
    path("api/v1/library/", include("apps.library.urls")),
    path("api/v1/behaviour/", include("apps.behaviour.urls")),
    path("api/v1/reports/", include("apps.reports.urls")),
]
