from rest_framework import serializers
from .models import AdmissionFollowUp, AdmissionInquiry


class AdmissionFollowUpSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = AdmissionFollowUp
        fields = ["id", "inquiry", "author", "author_name", "note", "status_after", "created_at"]
        read_only_fields = ["id", "author", "author_name", "created_at"]

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name() or obj.author.username
        return None


class AdmissionFollowUpInlineSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = AdmissionFollowUp
        fields = ["id", "author_name", "note", "status_after", "created_at"]

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name() or obj.author.username
        return None


class AdmissionInquirySerializer(serializers.ModelSerializer):
    follow_ups = AdmissionFollowUpInlineSerializer(many=True, read_only=True)

    class Meta:
        model = AdmissionInquiry
        fields = [
            "id",
            "school",
            "full_name",
            "phone",
            "email",
            "class_name",
            "note",
            "status",
            "follow_ups",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "follow_ups", "created_at", "updated_at"]
