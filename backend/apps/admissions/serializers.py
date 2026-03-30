import json
import re
from datetime import datetime

from rest_framework import serializers

from apps.access_control.models import Role
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


PHONE_PATTERN = re.compile(r"^\+?[0-9\s().-]+$")


def _normalize_phone(value, field_name, required=False):
    phone = str(value or "").strip()
    if not phone:
        if required:
            raise serializers.ValidationError({field_name: "This field is required."})
        return ""

    if not PHONE_PATTERN.match(phone):
        raise serializers.ValidationError({field_name: "Enter a valid phone number."})

    if not any(ch.isdigit() for ch in phone):
        raise serializers.ValidationError({field_name: "Enter a valid phone number."})

    return phone


def _parse_time_value(value):
    time_str = str(value or "").strip()
    if not time_str:
        return None

    for fmt in ("%H:%M", "%H:%M:%S", "%I:%M %p", "%I:%M:%S %p"):
        try:
            return datetime.strptime(time_str, fmt).time()
        except ValueError:
            continue
    return None


class AdmissionFollowUpSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = AdmissionFollowUp
        fields = ["id", "inquiry", "author", "author_name", "response", "note", "status_after", "created_at"]
        read_only_fields = ["id", "author", "author_name", "created_at"]

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name() or obj.author.username
        return None


class AdmissionFollowUpInlineSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = AdmissionFollowUp
        fields = ["id", "author_name", "response", "note", "status_after", "created_at"]

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name() or obj.author.username
        return None


class AdmissionInquirySerializer(serializers.ModelSerializer):
    follow_ups = AdmissionFollowUpInlineSerializer(many=True, read_only=True)
    source_name = serializers.CharField(source="source.name", read_only=True)
    reference_name = serializers.CharField(source="reference.name", read_only=True)
    class_name_resolved = serializers.CharField(source="school_class.name", read_only=True)
    created_by_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = AdmissionInquiry
        fields = [
            "id",
            "school",
            "full_name",
            "phone",
            "email",
            "address",
            "description",
            "query_date",
            "follow_up_date",
            "next_follow_up_date",
            "assigned",
            "reference",
            "reference_name",
            "source",
            "source_name",
            "school_class",
            "class_name_resolved",
            "no_of_child",
            "active_status",
            "created_by",
            "created_by_name",
            "class_name",
            "note",
            "status",
            "follow_ups",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_by_name", "follow_ups", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None


class VisitorBookEntrySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField(read_only=True)
    purpose_name = serializers.SerializerMethodField(read_only=True)
    file_upload = serializers.FileField(write_only=True, required=False, allow_null=True)
    file_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = VisitorBookEntry
        fields = [
            "id",
            "school",
            "purpose",
            "purpose_name",
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
        read_only_fields = ["id", "school", "visitor_id", "created_by", "created_by_name", "created_at", "updated_at"]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def _current_school_id(self):
        request = self.context.get("request")
        if not request or not getattr(request, "user", None):
            return None
        user_school_id = getattr(request.user, "school_id", None)
        if user_school_id:
            return user_school_id
        request_school = getattr(request, "school", None)
        return getattr(request_school, "id", None)

    def _resolve_purpose_name(self, purpose_value):
        if purpose_value is None:
            return ""

        raw = str(purpose_value).strip()
        if not raw:
            return ""

        if raw.isdigit():
            school_id = self._current_school_id()
            lookup = AdminSetupEntry.objects.filter(type="1", id=int(raw))
            if school_id:
                lookup = lookup.filter(school_id=school_id)
            purpose = lookup.only("name").first()
            if not purpose:
                raise serializers.ValidationError({"purpose": "Invalid purpose selected."})
            return purpose.name

        return raw

    def get_purpose_name(self, obj):
        try:
            return self._resolve_purpose_name(obj.purpose)
        except serializers.ValidationError:
            return str(obj.purpose or "")

    def validate(self, attrs):
        if "purpose" in attrs:
            attrs["purpose"] = self._resolve_purpose_name(attrs.get("purpose"))

        phone = _normalize_phone(
            attrs.get("phone", getattr(self.instance, "phone", "")),
            "phone",
            required=False,
        )
        date_value = attrs.get("date", getattr(self.instance, "date", None))
        in_time_value = str(attrs.get("in_time", getattr(self.instance, "in_time", "")) or "").strip()
        out_time_value = str(attrs.get("out_time", getattr(self.instance, "out_time", "")) or "").strip()

        if "phone" in attrs:
            attrs["phone"] = phone

        parsed_in_time = _parse_time_value(in_time_value)
        parsed_out_time = _parse_time_value(out_time_value)
        if parsed_in_time and parsed_out_time and parsed_out_time < parsed_in_time:
            raise serializers.ValidationError({"out_time": "Out time must be later than or equal to in time."})

        # Prevent duplicate visitor entries for the same phone, date, and in-time.
        if phone and date_value and in_time_value:
            school_id = self._current_school_id() or getattr(getattr(self.instance, "school", None), "id", None)
            queryset = VisitorBookEntry.objects.filter(phone=phone, date=date_value, in_time=in_time_value)
            if school_id:
                queryset = queryset.filter(school_id=school_id)
            if self.instance:
                queryset = queryset.exclude(id=self.instance.id)
            if queryset.exists():
                raise serializers.ValidationError("Visitor already exists for the selected date and time")

        return super().validate(attrs)

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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["purpose"] = self.get_purpose_name(instance)
        return data


class ComplaintEntrySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField(read_only=True)
    complaint_type_name = serializers.SerializerMethodField(read_only=True)
    complaint_source_name = serializers.SerializerMethodField(read_only=True)
    file_upload = serializers.FileField(write_only=True, required=False, allow_null=True)
    file_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = ComplaintEntry
        fields = [
            "id",
            "school",
            "complaint_by",
            "complaint_type",
            "complaint_type_name",
            "complaint_source",
            "complaint_source_name",
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

    def _current_school_id(self):
        request = self.context.get("request")
        if not request or not getattr(request, "user", None):
            return None
        user_school_id = getattr(request.user, "school_id", None)
        if user_school_id:
            return user_school_id
        request_school = getattr(request, "school", None)
        return getattr(request_school, "id", None)

    def _resolve_setup_name(self, value, setup_type, field_name):
        raw = str(value or "").strip()
        if not raw:
            return ""

        if raw.isdigit():
            school_id = self._current_school_id() or getattr(getattr(self.instance, "school", None), "id", None)
            queryset = AdminSetupEntry.objects.filter(type=setup_type, id=int(raw))
            if school_id:
                queryset = queryset.filter(school_id=school_id)
            setup = queryset.only("name").first()
            if setup:
                return setup.name
            raise serializers.ValidationError({field_name: f"Invalid {field_name.replace('_', ' ')} selected."})

        return raw

    def get_complaint_type_name(self, obj):
        try:
            return self._resolve_setup_name(obj.complaint_type, "2", "complaint_type")
        except serializers.ValidationError:
            return str(obj.complaint_type or "")

    def get_complaint_source_name(self, obj):
        try:
            return self._resolve_setup_name(obj.complaint_source, "3", "complaint_source")
        except serializers.ValidationError:
            return str(obj.complaint_source or "")

    def validate(self, attrs):
        if "complaint_type" in attrs:
            attrs["complaint_type"] = self._resolve_setup_name(attrs.get("complaint_type"), "2", "complaint_type")
        if "complaint_source" in attrs:
            attrs["complaint_source"] = self._resolve_setup_name(attrs.get("complaint_source"), "3", "complaint_source")
        return super().validate(attrs)

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

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["complaint_type"] = self.get_complaint_type_name(instance)
        data["complaint_source"] = self.get_complaint_source_name(instance)
        return data


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

    def validate(self, attrs):
        phone = _normalize_phone(
            attrs.get("phone", getattr(self.instance, "phone", "")),
            "phone",
            required=True,
        )
        attrs["phone"] = phone
        return super().validate(attrs)


class AdminSetupEntrySerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField(read_only=True)
    type_name = serializers.CharField(source="get_type_display", read_only=True)

    class Meta:
        model = AdminSetupEntry
        fields = [
            "id",
            "school",
            "type",
            "type_name",
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

    def _current_school_id(self):
        request = self.context.get("request")
        if not request or not getattr(request, "user", None):
            return None
        user_school_id = getattr(request.user, "school_id", None)
        if user_school_id:
            return user_school_id
        request_school = getattr(request, "school", None)
        return getattr(request_school, "id", None)

    def validate(self, attrs):
        setup_type = attrs.get("type", getattr(self.instance, "type", None))
        raw_name = str(attrs.get("name", getattr(self.instance, "name", "")) or "").strip()
        school_id = self._current_school_id() or getattr(getattr(self.instance, "school", None), "id", None)

        if raw_name:
            attrs["name"] = raw_name

        if setup_type and raw_name and school_id:
            duplicate_qs = AdminSetupEntry.objects.filter(school_id=school_id, type=setup_type, name__iexact=raw_name)
            if self.instance:
                duplicate_qs = duplicate_qs.exclude(id=self.instance.id)
            if duplicate_qs.exists():
                raise serializers.ValidationError("Admin setup entry already exists for selected type and name")

        return super().validate(attrs)


class IdCardTemplateSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField(read_only=True)
    applicable_role_names = serializers.SerializerMethodField(read_only=True)
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
            "applicable_role_names",
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

    def get_applicable_role_names(self, obj):
        role_ids = obj.applicable_role_ids or []
        if not role_ids:
            return []
        roles = Role.objects.filter(id__in=role_ids).values_list("name", flat=True)
        return list(roles)

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
    applicable_role_name = serializers.SerializerMethodField(read_only=True)
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
            "applicable_role_name",
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

    def get_applicable_role_name(self, obj):
        if not obj.applicable_role_id:
            return None
        return Role.objects.filter(id=obj.applicable_role_id).values_list("name", flat=True).first()

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
