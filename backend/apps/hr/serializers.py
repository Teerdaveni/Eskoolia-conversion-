from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers

from .models import Department, Designation, LeaveRequest, LeaveType, PayrollRecord, Staff


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ["id", "school", "name", "description", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = ["id", "school", "department", "name", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        school_id = request.user.school_id if request else None
        department = attrs.get("department") or getattr(self.instance, "department", None)
        if school_id and department and department.school_id != school_id:
            raise serializers.ValidationError({"department": "Selected department does not belong to your school."})
        return attrs


class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = [
            "id",
            "school",
            "user",
            "staff_no",
            "first_name",
            "last_name",
            "email",
            "phone",
            "department",
            "designation",
            "join_date",
            "basic_salary",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        school_id = request.user.school_id if request else None
        department = attrs.get("department") or getattr(self.instance, "department", None)
        designation = attrs.get("designation") or getattr(self.instance, "designation", None)
        user = attrs.get("user") or getattr(self.instance, "user", None)

        if school_id and department and department.school_id != school_id:
            raise serializers.ValidationError({"department": "Selected department does not belong to your school."})
        if school_id and designation and designation.school_id != school_id:
            raise serializers.ValidationError({"designation": "Selected designation does not belong to your school."})
        if department and designation and designation.department_id != department.id:
            raise serializers.ValidationError({"designation": "Selected designation does not belong to selected department."})
        if school_id and user and user.school_id and user.school_id != school_id:
            raise serializers.ValidationError({"user": "Selected user does not belong to your school."})
        return attrs


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ["id", "school", "name", "max_days_per_year", "is_paid", "is_active", "created_at"]
        read_only_fields = ["id", "school", "created_at"]


class LeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = [
            "id",
            "school",
            "staff",
            "leave_type",
            "from_date",
            "to_date",
            "reason",
            "status",
            "approved_by",
            "approved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "approved_by", "approved_at", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        school_id = request.user.school_id if request else None
        staff = attrs.get("staff") or getattr(self.instance, "staff", None)
        leave_type = attrs.get("leave_type") or getattr(self.instance, "leave_type", None)
        from_date = attrs.get("from_date") or getattr(self.instance, "from_date", None)
        to_date = attrs.get("to_date") or getattr(self.instance, "to_date", None)

        if from_date and to_date and to_date < from_date:
            raise serializers.ValidationError({"to_date": "to_date cannot be earlier than from_date."})
        if school_id and staff and staff.school_id != school_id:
            raise serializers.ValidationError({"staff": "Selected staff member does not belong to your school."})
        if school_id and leave_type and leave_type.school_id != school_id:
            raise serializers.ValidationError({"leave_type": "Selected leave type does not belong to your school."})
        return attrs


class PayrollRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = PayrollRecord
        fields = [
            "id",
            "school",
            "staff",
            "payroll_month",
            "payroll_year",
            "basic_salary",
            "allowance",
            "deduction",
            "net_salary",
            "status",
            "paid_at",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "net_salary", "created_by", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        school_id = request.user.school_id if request else None
        staff = attrs.get("staff") or getattr(self.instance, "staff", None)
        if school_id and staff and staff.school_id != school_id:
            raise serializers.ValidationError({"staff": "Selected staff member does not belong to your school."})
        return attrs


class PayrollSummarySerializer(serializers.Serializer):
    total_records = serializers.IntegerField()
    total_basic_salary = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_allowance = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_deduction = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_net_salary = serializers.DecimalField(max_digits=14, decimal_places=2)
