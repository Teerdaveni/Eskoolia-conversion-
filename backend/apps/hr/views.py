from decimal import Decimal

from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.utils import timezone
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from .models import Department, Designation, LeaveDefine, LeaveRequest, LeaveType, PayrollRecord, Staff, StaffAttendance
from .serializers import (
    DepartmentSerializer,
    DesignationSerializer,
    LeaveDefineSerializer,
    LeaveRequestSerializer,
    LeaveTypeSerializer,
    PayrollRecordSerializer,
    StaffSerializer,
    StaffAttendanceSerializer,
)


class SchoolScopedModelViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_superuser:
            return queryset
        if user.school_id:
            return queryset.filter(school_id=user.school_id)
        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        school = user.school or getattr(self.request, "school", None)
        if not school and not user.is_superuser:
            raise PermissionDenied("School context is required.")
        serializer.save(school=school)


class DepartmentViewSet(SchoolScopedModelViewSet):
    queryset = Department.objects.select_related("school").all()
    serializer_class = DepartmentSerializer
    filterset_fields = ["is_active"]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at"]


class DesignationViewSet(SchoolScopedModelViewSet):
    queryset = Designation.objects.select_related("school", "department").all()
    serializer_class = DesignationSerializer
    filterset_fields = ["department", "is_active"]
    search_fields = ["name", "department__name"]
    ordering_fields = ["name", "created_at"]


class StaffViewSet(SchoolScopedModelViewSet):
    queryset = Staff.objects.select_related("school", "user", "role", "department", "designation").all()
    serializer_class = StaffSerializer
    filterset_fields = ["role", "department", "designation", "status", "join_date", "gender", "marital_status", "contract_type"]
    search_fields = ["staff_no", "first_name", "last_name", "email", "phone", "emergency_mobile", "location", "driving_license"]
    ordering_fields = ["first_name", "join_date", "created_at"]


class LeaveTypeViewSet(SchoolScopedModelViewSet):
    queryset = LeaveType.objects.select_related("school").all()
    serializer_class = LeaveTypeSerializer
    filterset_fields = ["is_paid", "is_active"]
    search_fields = ["name"]
    ordering_fields = ["name", "created_at"]


class LeaveDefineViewSet(SchoolScopedModelViewSet):
    queryset = LeaveDefine.objects.select_related("school", "role", "staff", "leave_type").all()
    serializer_class = LeaveDefineSerializer
    filterset_fields = ["role", "staff", "leave_type"]
    search_fields = ["role__name", "staff__first_name", "staff__last_name", "leave_type__name"]
    ordering_fields = ["created_at", "days"]


class LeaveRequestViewSet(SchoolScopedModelViewSet):
    queryset = LeaveRequest.objects.select_related("school", "staff", "leave_type", "approved_by").all()
    serializer_class = LeaveRequestSerializer
    filterset_fields = ["staff", "leave_type", "status", "from_date", "to_date"]
    search_fields = ["staff__staff_no", "staff__first_name", "staff__last_name", "reason"]
    ordering_fields = ["created_at", "from_date", "to_date"]

    def _current_staff(self):
        return Staff.objects.filter(user_id=self.request.user.id).first()

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.is_superuser:
            return queryset

        current_staff = self._current_staff()
        if current_staff:
            return queryset.filter(staff_id=current_staff.id)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        school = user.school or getattr(self.request, "school", None)
        if not school and not user.is_superuser:
            raise PermissionDenied("School context is required.")

        current_staff = self._current_staff()
        requested_staff = serializer.validated_data.get("staff")
        staff = current_staff or requested_staff

        if not staff:
            raise ValidationError({"staff": "Staff profile is required to apply leave."})

        if not user.is_superuser and user.school_id and staff.school_id != user.school_id:
            raise ValidationError({"staff": "Selected staff member does not belong to your school."})

        serializer.save(school=school, staff=staff)

    def perform_update(self, serializer):
        current_staff = self._current_staff()
        if current_staff and not self.request.user.is_superuser:
            serializer.save(staff=current_staff)
            return
        serializer.save()

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        leave_request = self.get_object()
        if leave_request.status != LeaveRequest.STATUS_PENDING:
            raise ValidationError("Only pending leave requests can be approved.")

        leave_request.status = LeaveRequest.STATUS_APPROVED
        leave_request.approval_note = (request.data.get("approval_note") or "").strip()
        leave_request.approved_by = request.user
        leave_request.approved_at = timezone.now()
        leave_request.save(update_fields=["status", "approval_note", "approved_by", "approved_at", "updated_at"])
        return Response({"id": leave_request.id, "status": leave_request.status})

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        leave_request = self.get_object()
        if leave_request.status != LeaveRequest.STATUS_PENDING:
            raise ValidationError("Only pending leave requests can be rejected.")

        leave_request.status = LeaveRequest.STATUS_REJECTED
        leave_request.approval_note = (request.data.get("approval_note") or "").strip()
        leave_request.approved_by = request.user
        leave_request.approved_at = timezone.now()
        leave_request.save(update_fields=["status", "approval_note", "approved_by", "approved_at", "updated_at"])
        return Response({"id": leave_request.id, "status": leave_request.status})


class StaffAttendanceViewSet(SchoolScopedModelViewSet):
    queryset = StaffAttendance.objects.select_related("school", "staff").all()
    serializer_class = StaffAttendanceSerializer
    filterset_fields = ["staff", "attendance_date", "attendance_type"]
    search_fields = ["staff__staff_no", "staff__first_name", "staff__last_name", "note"]
    ordering_fields = ["attendance_date", "created_at"]

    @action(detail=False, methods=["post"], url_path="bulk-store")
    def bulk_store(self, request):
        rows = request.data.get("rows", [])
        if not isinstance(rows, list) or len(rows) == 0:
            raise ValidationError("rows must be a non-empty list.")

        school = request.user.school or getattr(request, "school", None)
        if not school and not request.user.is_superuser:
            raise PermissionDenied("School context is required.")

        created_or_updated = 0
        for row in rows:
            serializer = self.get_serializer(data=row)
            serializer.is_valid(raise_exception=True)
            validated = serializer.validated_data

            StaffAttendance.objects.update_or_create(
                school=school,
                staff=validated["staff"],
                attendance_date=validated["attendance_date"],
                defaults={
                    "attendance_type": validated.get("attendance_type", StaffAttendance.STATUS_PRESENT),
                    "note": validated.get("note", ""),
                },
            )
            created_or_updated += 1

        return Response({"detail": "Attendance saved.", "count": created_or_updated})

    @action(detail=False, methods=["get"], url_path="report")
    def report(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        total = queryset.count()
        by_type = {}
        for code, _label in StaffAttendance.STATUS_CHOICES:
            by_type[code] = queryset.filter(attendance_type=code).count()

        return Response({"total": total, "by_type": by_type})


class PayrollRecordViewSet(SchoolScopedModelViewSet):
    queryset = PayrollRecord.objects.select_related("school", "staff", "created_by").all()
    serializer_class = PayrollRecordSerializer
    filterset_fields = ["staff", "payroll_month", "payroll_year", "status"]
    search_fields = ["staff__staff_no", "staff__first_name", "staff__last_name"]
    ordering_fields = ["payroll_year", "payroll_month", "created_at", "net_salary"]

    def perform_create(self, serializer):
        user = self.request.user
        school = user.school or getattr(self.request, "school", None)
        if not school and not user.is_superuser:
            raise PermissionDenied("School context is required.")
        serializer.save(school=school, created_by=user)

    @action(detail=False, methods=["get"], url_path="summary")
    def summary(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        total_basic = queryset.aggregate(total=Coalesce(Sum("basic_salary"), Decimal("0.00"))).get("total")
        total_allowance = queryset.aggregate(total=Coalesce(Sum("allowance"), Decimal("0.00"))).get("total")
        total_deduction = queryset.aggregate(total=Coalesce(Sum("deduction"), Decimal("0.00"))).get("total")
        total_net = queryset.aggregate(total=Coalesce(Sum("net_salary"), Decimal("0.00"))).get("total")

        return Response(
            {
                "total_records": queryset.count(),
                "total_basic_salary": str(total_basic),
                "total_allowance": str(total_allowance),
                "total_deduction": str(total_deduction),
                "total_net_salary": str(total_net),
            }
        )

    @action(detail=True, methods=["post"], url_path="mark-paid")
    def mark_paid(self, request, pk=None):
        payroll = self.get_object()
        if payroll.status == PayrollRecord.STATUS_PAID:
            return Response({"id": payroll.id, "status": payroll.status, "paid_at": payroll.paid_at})

        payroll.status = PayrollRecord.STATUS_PAID
        payroll.paid_at = timezone.now()
        payroll.save(update_fields=["status", "paid_at", "updated_at"])
        return Response({"id": payroll.id, "status": payroll.status, "paid_at": payroll.paid_at})
