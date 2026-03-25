from rest_framework import serializers
from .models import AcademicYear, Class, ClassPeriod, ClassRoom, Section, Subject


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ["id", "school", "name", "start_date", "end_date", "is_current", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ["id", "school_class", "name", "capacity", "created_at"]
        read_only_fields = ["id", "created_at"]


class ClassSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)

    class Meta:
        model = Class
        fields = ["id", "school", "name", "numeric_order", "sections", "created_at"]
        read_only_fields = ["id", "school", "sections", "created_at"]


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "school", "name", "code", "subject_type", "created_at"]
        read_only_fields = ["id", "school", "created_at"]


class ClassPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassPeriod
        fields = ["id", "school", "period", "start_time", "end_time", "period_type", "is_break", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class ClassRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassRoom
        fields = ["id", "school", "room_no", "capacity", "active_status", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_at", "updated_at"]
