from django.utils.html import strip_tags
import re
from rest_framework import serializers
from .models import (
    Guardian,
    Student,
    StudentCategory,
    StudentDocument,
    StudentGroup,
    StudentMultiClassRecord,
    StudentPromotionHistory,
    StudentTransferHistory,
)


class StudentCategorySerializer(serializers.ModelSerializer):
    def validate_name(self, value):
        request = self.context.get("request")
        school_id = getattr(getattr(request, "user", None), "school_id", None)
        if school_id:
            queryset = StudentCategory.objects.filter(school_id=school_id, name__iexact=value.strip())
            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)
            if queryset.exists():
                raise serializers.ValidationError("A category with this name already exists.")
        return value

    class Meta:
        model = StudentCategory
        fields = ["id", "school", "name", "description", "created_at"]
        read_only_fields = ["id", "school", "created_at"]


class StudentGroupSerializer(serializers.ModelSerializer):
    students_count = serializers.IntegerField(read_only=True)

    def validate_name(self, value):
        request = self.context.get("request")
        school_id = getattr(getattr(request, "user", None), "school_id", None)
        if school_id:
            queryset = StudentGroup.objects.filter(school_id=school_id, name__iexact=value.strip())
            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)
            if queryset.exists():
                raise serializers.ValidationError("A group with this name already exists.")
        return value

    class Meta:
        model = StudentGroup
        fields = ["id", "school", "name", "description", "students_count", "created_at"]
        read_only_fields = ["id", "school", "students_count", "created_at"]


class GuardianSerializer(serializers.ModelSerializer):
    def validate_phone(self, value):
        phone = str(value or "").strip()
        if not phone:
            raise serializers.ValidationError("Phone is required.")
        if not re.fullmatch(r"\d{1,12}", phone):
            raise serializers.ValidationError("Phone number must contain digits only and must not exceed 12 digits.")
        return phone

    class Meta:
        model = Guardian
        fields = [
            "id",
            "school",
            "full_name",
            "relation",
            "phone",
            "email",
            "occupation",
            "address",
            "created_at",
        ]
        read_only_fields = ["id", "school", "created_at"]


class StudentDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentDocument
        fields = ["id", "student", "title", "file_url", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]


class StudentTransferHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentTransferHistory
        fields = ["id", "student", "from_school", "to_school", "note", "created_at"]
        read_only_fields = ["id", "created_at"]


class StudentPromotionHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentPromotionHistory
        fields = [
            "id",
            "student",
            "from_class",
            "from_section",
            "to_class",
            "to_section",
            "from_academic_year",
            "to_academic_year",
            "note",
            "promoted_by",
            "promoted_at",
        ]
        read_only_fields = ["id", "promoted_by", "promoted_at"]


class StudentPromoteRequestSerializer(serializers.Serializer):
    student_ids = serializers.ListField(child=serializers.IntegerField(min_value=1), allow_empty=False)
    to_class = serializers.IntegerField(min_value=1)
    to_section = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    to_academic_year = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    note = serializers.CharField(required=False, allow_blank=True)


class StudentMultiClassRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentMultiClassRecord
        fields = ["id", "student", "school_class", "section", "roll_no", "is_default", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        school_class = attrs.get("school_class") or getattr(self.instance, "school_class", None)
        section = attrs.get("section") if "section" in attrs else getattr(self.instance, "section", None)

        if section and school_class and section.school_class_id != school_class.id:
            raise serializers.ValidationError({"section": "Section must belong to selected class."})

        return attrs


class StudentMultiClassRecordItemSerializer(serializers.Serializer):
    school_class = serializers.IntegerField(min_value=1)
    section = serializers.IntegerField(min_value=1, required=False, allow_null=True)
    roll_no = serializers.CharField(required=False, allow_blank=True, max_length=40)
    is_default = serializers.BooleanField(required=False)


class StudentMultiClassBulkSaveSerializer(serializers.Serializer):
    student_id = serializers.IntegerField(min_value=1)
    records = StudentMultiClassRecordItemSerializer(many=True)


class StudentSerializer(serializers.ModelSerializer):
    documents = StudentDocumentSerializer(many=True, read_only=True)
    transport_route_title = serializers.CharField(source="transport_route.title", read_only=True, allow_null=True)
    vehicle_no = serializers.CharField(source="vehicle.vehicle_no", read_only=True, allow_null=True)

    def _validate_plain_text_name(self, value, field_label):
        cleaned = strip_tags((value or "").strip())
        if cleaned != (value or "").strip():
            raise serializers.ValidationError(f"{field_label} cannot contain HTML tags.")
        return value

    def validate_first_name(self, value):
        return self._validate_plain_text_name(value, "First name")

    def validate_last_name(self, value):
        cleaned = self._validate_plain_text_name(value, "Last name")
        if not (cleaned or "").strip():
            raise serializers.ValidationError("Last name is required.")
        return cleaned

    def validate(self, attrs):
        attrs = super().validate(attrs)
        last_name = attrs.get("last_name")
        if self.instance is None and not (last_name or "").strip():
            raise serializers.ValidationError({"last_name": "Last name is required."})
        return attrs

    def validate_admission_no(self, value):
        request = self.context.get("request")
        school_id = getattr(getattr(request, "user", None), "school_id", None)
        if school_id:
            queryset = Student.objects.filter(school_id=school_id, admission_no__iexact=value.strip())
            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)
            if queryset.exists():
                raise serializers.ValidationError("Admission number already exists.")
        return value

    class Meta:
        model = Student
        fields = [
            "id",
            "school",
            "admission_no",
            "roll_no",
            "first_name",
            "last_name",
            "date_of_birth",
            "gender",
            "blood_group",
            "category",
            "student_group",
            "guardian",
            "current_class",
            "current_section",
            "admission_inquiry",
            "transport_route",
            "transport_route_title",
            "vehicle",
            "vehicle_no",
            "is_disabled",
            "is_active",
            "documents",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "documents", "transport_route_title", "vehicle_no", "created_at", "updated_at"]
