from rest_framework import serializers
import json
from .models import (
    AdmissionFollowUp,
    AdmissionInquiry,
    AdminSetupEntry,
    CertificateTemplate,
    ComplaintEntry,
    IdCardTemplate,
    PhoneCallLogEntry,
    PostalDispatchEntry,
    PostalReceiveEntry,
    VisitorBookEntry,
)


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


class VisitorBookEntrySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField(read_only=True)
    file_upload = serializers.FileField(write_only=True, required=False, allow_null=True)
    file_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = VisitorBookEntry
        fields = [
            "id",
            "school",
            "purpose",
            "name",
            "phone",
            "visitor_id",
            "no_of_person",
            "date",
            "in_time",
            "out_time",
            "file_url",
            "file_upload",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_by_name", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def get_file_url(self, obj):
        if not obj.file_url:
            return ""
        request = self.context.get("request")
        url = obj.file_url.url
        return request.build_absolute_uri(url) if request else url

    def create(self, validated_data):
        upload = validated_data.pop("file_upload", None)
        if upload is not None:
            validated_data["file_url"] = upload
        return super().create(validated_data)

    def update(self, instance, validated_data):
        upload = validated_data.pop("file_upload", None)
        if upload is not None:
            validated_data["file_url"] = upload
        return super().update(instance, validated_data)


class ComplaintEntrySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField(read_only=True)
    file_upload = serializers.FileField(write_only=True, required=False, allow_null=True)
    file_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ComplaintEntry
        fields = [
            "id",
            "school",
            "complaint_by",
            "complaint_type",
            "complaint_source",
            "phone",
            "date",
            "action_taken",
            "assigned",
            "description",
            "file",
            "file_upload",
            "file_url",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "file", "file_url", "created_by", "created_by_name", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def get_file_url(self, obj):
        if not obj.file:
            return ""
        request = self.context.get("request")
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url

    def create(self, validated_data):
        upload = validated_data.pop("file_upload", None)
        if upload is not None:
            validated_data["file"] = upload
        return super().create(validated_data)

    def update(self, instance, validated_data):
        upload = validated_data.pop("file_upload", None)
        if upload is not None:
            validated_data["file"] = upload
        return super().update(instance, validated_data)


class PostalReceiveEntrySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField(read_only=True)
    file_upload = serializers.FileField(write_only=True, required=False, allow_null=True)
    file_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PostalReceiveEntry
        fields = [
            "id",
            "school",
            "from_title",
            "reference_no",
            "address",
            "note",
            "to_title",
            "date",
            "file",
            "file_upload",
            "file_url",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "file", "file_url", "created_by", "created_by_name", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def get_file_url(self, obj):
        if not obj.file:
            return ""
        request = self.context.get("request")
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url

    def create(self, validated_data):
        upload = validated_data.pop("file_upload", None)
        if upload is not None:
            validated_data["file"] = upload
        return super().create(validated_data)

    def update(self, instance, validated_data):
        upload = validated_data.pop("file_upload", None)
        if upload is not None:
            validated_data["file"] = upload
        return super().update(instance, validated_data)


class PostalDispatchEntrySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField(read_only=True)
    file_upload = serializers.FileField(write_only=True, required=False, allow_null=True)
    file_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PostalDispatchEntry
        fields = [
            "id",
            "school",
            "from_title",
            "reference_no",
            "address",
            "note",
            "to_title",
            "date",
            "file",
            "file_upload",
            "file_url",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "file", "file_url", "created_by", "created_by_name", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def get_file_url(self, obj):
        if not obj.file:
            return ""
        request = self.context.get("request")
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url

    def create(self, validated_data):
        upload = validated_data.pop("file_upload", None)
        if upload is not None:
            validated_data["file"] = upload
        return super().create(validated_data)

    def update(self, instance, validated_data):
        upload = validated_data.pop("file_upload", None)
        if upload is not None:
            validated_data["file"] = upload
        return super().update(instance, validated_data)


class PhoneCallLogEntrySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PhoneCallLogEntry
        fields = [
            "id",
            "school",
            "name",
            "phone",
            "date",
            "next_follow_up_date",
            "call_duration",
            "description",
            "call_type",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_by_name", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None


class AdminSetupEntrySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = AdminSetupEntry
        fields = [
            "id",
            "school",
            "type",
            "name",
            "description",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_by_name", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None


class IdCardTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField(read_only=True)
    background_upload = serializers.FileField(write_only=True, required=False, allow_null=True)
    profile_upload = serializers.FileField(write_only=True, required=False, allow_null=True)
    logo_upload = serializers.FileField(write_only=True, required=False, allow_null=True)
    signature_upload = serializers.FileField(write_only=True, required=False, allow_null=True)
    background_url = serializers.SerializerMethodField(read_only=True)
    profile_url = serializers.SerializerMethodField(read_only=True)
    logo_url = serializers.SerializerMethodField(read_only=True)
    signature_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = IdCardTemplate
        fields = [
            "id",
            "school",
            "title",
            "page_layout_style",
            "applicable_role_ids",
            "pl_width",
            "pl_height",
            "user_photo_style",
            "user_photo_width",
            "user_photo_height",
            "t_space",
            "b_space",
            "l_space",
            "r_space",
            "background_img",
            "profile_image",
            "logo",
            "signature",
            "background_upload",
            "profile_upload",
            "logo_upload",
            "signature_upload",
            "background_url",
            "profile_url",
            "logo_url",
            "signature_url",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "background_img",
            "profile_image",
            "logo",
            "signature",
            "background_url",
            "profile_url",
            "logo_url",
            "signature_url",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def _file_url(self, file_field):
        if not file_field:
            return ""
        request = self.context.get("request")
        url = file_field.url
        return request.build_absolute_uri(url) if request else url

    def get_background_url(self, obj):
        return self._file_url(obj.background_img)

    def get_profile_url(self, obj):
        return self._file_url(obj.profile_image)

    def get_logo_url(self, obj):
        return self._file_url(obj.logo)

    def get_signature_url(self, obj):
        return self._file_url(obj.signature)

    def create(self, validated_data):
        raw_roles = validated_data.get("applicable_role_ids")
        if isinstance(raw_roles, str):
            try:
                validated_data["applicable_role_ids"] = json.loads(raw_roles)
            except json.JSONDecodeError:
                validated_data["applicable_role_ids"] = []
        bg = validated_data.pop("background_upload", None)
        profile = validated_data.pop("profile_upload", None)
        logo = validated_data.pop("logo_upload", None)
        sign = validated_data.pop("signature_upload", None)
        if bg is not None:
            validated_data["background_img"] = bg
        if profile is not None:
            validated_data["profile_image"] = profile
        if logo is not None:
            validated_data["logo"] = logo
        if sign is not None:
            validated_data["signature"] = sign
        return super().create(validated_data)

    def update(self, instance, validated_data):
        raw_roles = validated_data.get("applicable_role_ids")
        if isinstance(raw_roles, str):
            try:
                validated_data["applicable_role_ids"] = json.loads(raw_roles)
            except json.JSONDecodeError:
                validated_data["applicable_role_ids"] = instance.applicable_role_ids
        bg = validated_data.pop("background_upload", None)
        profile = validated_data.pop("profile_upload", None)
        logo = validated_data.pop("logo_upload", None)
        sign = validated_data.pop("signature_upload", None)
        if bg is not None:
            validated_data["background_img"] = bg
        if profile is not None:
            validated_data["profile_image"] = profile
        if logo is not None:
            validated_data["logo"] = logo
        if sign is not None:
            validated_data["signature"] = sign
        return super().update(instance, validated_data)


class CertificateTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField(read_only=True)
    background_upload = serializers.FileField(write_only=True, required=False, allow_null=True)
    background_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CertificateTemplate
        fields = [
            "id",
            "school",
            "type",
            "title",
            "applicable_role_id",
            "background_height",
            "background_width",
            "padding_top",
            "padding_right",
            "padding_bottom",
            "pading_left",
            "body",
            "background_image",
            "background_upload",
            "background_url",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "background_image",
            "background_url",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def get_background_url(self, obj):
        if not obj.background_image:
            return ""
        request = self.context.get("request")
        url = obj.background_image.url
        return request.build_absolute_uri(url) if request else url

    def create(self, validated_data):
        bg = validated_data.pop("background_upload", None)
        if bg is not None:
            validated_data["background_image"] = bg
        return super().create(validated_data)

    def update(self, instance, validated_data):
        bg = validated_data.pop("background_upload", None)
        if bg is not None:
            validated_data["background_image"] = bg
        return super().update(instance, validated_data)
