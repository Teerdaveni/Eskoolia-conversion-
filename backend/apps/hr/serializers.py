from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers

from .models import Department, Designation, LeaveDefine, LeaveRequest, LeaveType, PayrollRecord, Staff, StaffAttendance


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
            "role",
            "staff_no",
            "first_name",
            "last_name",
            "fathers_name",
            "mothers_name",
            "date_of_birth",
            "email",
            "phone",
            "emergency_mobile",
            "gender",
            "marital_status",
            "driving_license",
            "staff_photo",
            "current_address",
            "permanent_address",
            "qualification",
            "experience",
            "epf_no",
            "bank_account_name",
            "bank_account_no",
            "bank_name",
            "bank_branch",
            "facebook_url",
            "twitter_url",
            "linkedin_url",
            "instagram_url",
            "casual_leave",
            "medical_leave",
            "maternity_leave",
            "show_public",
            "custom_field",
            "department",
            "designation",
            "contract_type",
            "location",
            "resume",
            "joining_letter",
            "other_document",
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
        role = attrs.get("role") or getattr(self.instance, "role", None)

        if school_id and department and department.school_id != school_id:
            raise serializers.ValidationError({"department": "Selected department does not belong to your school."})
        if school_id and designation and designation.school_id != school_id:
            raise serializers.ValidationError({"designation": "Selected designation does not belong to your school."})
        if school_id and role and role.school_id and role.school_id != school_id:
            raise serializers.ValidationError({"role": "Selected role does not belong to your school."})
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


class LeaveDefineSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source="role.name", read_only=True)
    staff_name = serializers.SerializerMethodField(read_only=True)
    leave_type_name = serializers.CharField(source="leave_type.name", read_only=True)

    class Meta:
        model = LeaveDefine
        fields = [
            "id",
            "school",
            "role",
            "role_name",
            "staff",
            "staff_name",
            "leave_type",
            "leave_type_name",
            "days",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at", "role_name", "staff_name", "leave_type_name"]

    def get_staff_name(self, obj):
        if not obj.staff_id:
            return ""
        return f"{(obj.staff.first_name or '').strip()} {(obj.staff.last_name or '').strip()}".strip()

    def validate(self, attrs):
        request = self.context.get("request")
        school_id = request.user.school_id if request else None
        role = attrs.get("role") or getattr(self.instance, "role", None)
        staff = attrs.get("staff") or getattr(self.instance, "staff", None)
        leave_type = attrs.get("leave_type") or getattr(self.instance, "leave_type", None)

        if not role and not staff:
            raise serializers.ValidationError({"role": "Select role or staff.", "staff": "Select role or staff."})
        if role and staff:
            raise serializers.ValidationError({"role": "Choose either role or staff, not both."})
        if school_id and role and role.school_id and role.school_id != school_id:
            raise serializers.ValidationError({"role": "Selected role does not belong to your school."})
        if school_id and staff and staff.school_id != school_id:
            raise serializers.ValidationError({"staff": "Selected staff does not belong to your school."})
        if school_id and leave_type and leave_type.school_id != school_id:
            raise serializers.ValidationError({"leave_type": "Selected leave type does not belong to your school."})
        return attrs


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
            "attachment",
            "approval_note",
            "status",
            "approved_by",
            "approved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "approved_by", "approved_at", "created_at", "updated_at"]
        extra_kwargs = {
            "staff": {"required": False},
        }

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


class StaffAttendanceSerializer(serializers.ModelSerializer):
    staff_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = StaffAttendance
        fields = [
            "id",
            "school",
            "staff",
            "staff_name",
            "attendance_date",
            "attendance_type",
            "note",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at", "staff_name"]

    def get_staff_name(self, obj):
        return f"{(obj.staff.first_name or '').strip()} {(obj.staff.last_name or '').strip()}".strip()

    def validate(self, attrs):
        request = self.context.get("request")
        school_id = request.user.school_id if request else None
        staff = attrs.get("staff") or getattr(self.instance, "staff", None)

        if school_id and staff and staff.school_id != school_id:
            raise serializers.ValidationError({"staff": "Selected staff does not belong to your school."})
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
