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
    class Meta:
        model = StudentCategory
        fields = ["id", "school", "name", "description", "created_at"]
        read_only_fields = ["id", "school", "created_at"]


class StudentGroupSerializer(serializers.ModelSerializer):
    students_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = StudentGroup
        fields = ["id", "school", "name", "description", "students_count", "created_at"]
        read_only_fields = ["id", "school", "students_count", "created_at"]


class GuardianSerializer(serializers.ModelSerializer):
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
            "is_disabled",
            "is_active",
            "documents",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "documents", "created_at", "updated_at"]
