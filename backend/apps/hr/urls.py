from rest_framework.routers import DefaultRouter

from .views import (
    DepartmentViewSet,
    DesignationViewSet,
    LeaveRequestViewSet,
    LeaveTypeViewSet,
    PayrollRecordViewSet,
    StaffViewSet,
)

router = DefaultRouter()
router.register("departments", DepartmentViewSet, basename="hr-department")
router.register("designations", DesignationViewSet, basename="hr-designation")
router.register("staff", StaffViewSet, basename="hr-staff")
router.register("leave-types", LeaveTypeViewSet, basename="hr-leave-type")
router.register("leave-requests", LeaveRequestViewSet, basename="hr-leave-request")
router.register("payroll", PayrollRecordViewSet, basename="hr-payroll")

urlpatterns = router.urls
