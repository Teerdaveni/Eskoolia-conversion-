from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
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
from .serializers import (
    AdmissionFollowUpSerializer,
    AdmissionInquirySerializer,
    AdminSetupEntrySerializer,
    CertificateTemplateSerializer,
    ComplaintEntrySerializer,
    IdCardTemplateSerializer,
    PhoneCallLogEntrySerializer,
    PostalDispatchEntrySerializer,
    PostalReceiveEntrySerializer,
    VisitorBookEntrySerializer,
)


class AdmissionInquiryViewSet(viewsets.ModelViewSet):
    serializer_class = AdmissionInquirySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = AdmissionInquiry.objects.select_related("school").prefetch_related("follow_ups__author")
        if user.is_superuser:
            return queryset
        if user.school_id:
            return queryset.filter(school_id=user.school_id)
        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        school = user.school
        if not school and getattr(self.request, "school", None):
            school = self.request.school
        serializer.save(school=school)


class AdmissionFollowUpViewSet(viewsets.ModelViewSet):
    serializer_class = AdmissionFollowUpSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        qs = AdmissionFollowUp.objects.select_related("inquiry__school", "author")
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(inquiry__school_id=user.school_id)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        inquiry_id = self.request.data.get("inquiry")
        # Ensure the inquiry belongs to the user's school
        if inquiry_id and not user.is_superuser:
            if not AdmissionInquiry.objects.filter(id=inquiry_id, school_id=user.school_id).exists():
                raise PermissionDenied("Inquiry not found in your school.")

        instance = serializer.save(author=user)

        # Optionally update inquiry status when status_after is provided
        if instance.status_after:
            AdmissionInquiry.objects.filter(pk=instance.inquiry_id).update(status=instance.status_after)


class VisitorBookEntryViewSet(viewsets.ModelViewSet):
    serializer_class = VisitorBookEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        qs = VisitorBookEntry.objects.select_related("school", "created_by")
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(school_id=user.school_id)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        school = user.school
        if not school and getattr(self.request, "school", None):
            school = self.request.school
        serializer.save(school=school, created_by=user)


class ComplaintEntryViewSet(viewsets.ModelViewSet):
    serializer_class = ComplaintEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        qs = ComplaintEntry.objects.select_related("school", "created_by")
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(school_id=user.school_id)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        school = user.school
        if not school and getattr(self.request, "school", None):
            school = self.request.school
        serializer.save(school=school, created_by=user)


class PostalReceiveEntryViewSet(viewsets.ModelViewSet):
    serializer_class = PostalReceiveEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        qs = PostalReceiveEntry.objects.select_related("school", "created_by")
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(school_id=user.school_id)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        school = user.school
        if not school and getattr(self.request, "school", None):
            school = self.request.school
        serializer.save(school=school, created_by=user)


class PostalDispatchEntryViewSet(viewsets.ModelViewSet):
    serializer_class = PostalDispatchEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        qs = PostalDispatchEntry.objects.select_related("school", "created_by")
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(school_id=user.school_id)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        school = user.school
        if not school and getattr(self.request, "school", None):
            school = self.request.school
        serializer.save(school=school, created_by=user)


class PhoneCallLogEntryViewSet(viewsets.ModelViewSet):
    serializer_class = PhoneCallLogEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = PhoneCallLogEntry.objects.select_related("school", "created_by")
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(school_id=user.school_id)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        school = user.school
        if not school and getattr(self.request, "school", None):
            school = self.request.school
        serializer.save(school=school, created_by=user)


class AdminSetupEntryViewSet(viewsets.ModelViewSet):
    serializer_class = AdminSetupEntrySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = AdminSetupEntry.objects.select_related("school", "created_by")
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(school_id=user.school_id)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        school = user.school
        if not school and getattr(self.request, "school", None):
            school = self.request.school
        serializer.save(school=school, created_by=user)


class IdCardTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = IdCardTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        qs = IdCardTemplate.objects.select_related("school", "created_by")
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(school_id=user.school_id)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        school = user.school
        if not school and getattr(self.request, "school", None):
            school = self.request.school
        serializer.save(school=school, created_by=user)


class CertificateTemplateViewSet(viewsets.ModelViewSet):
    serializer_class = CertificateTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        qs = CertificateTemplate.objects.select_related("school", "created_by")
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(school_id=user.school_id)
        return qs.none()

    def perform_create(self, serializer):
        user = self.request.user
        school = user.school
        if not school and getattr(self.request, "school", None):
            school = self.request.school
        serializer.save(school=school, created_by=user)
