from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from django.utils import timezone
from apps.tenancy.models import School
from apps.access_control.models import Role, UserRole
from apps.core.models import Class, Section
from apps.students.models import Student
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
        queryset = AdmissionInquiry.objects.select_related(
            "school",
            "created_by",
            "source",
            "reference",
            "school_class",
        ).prefetch_related("follow_ups__author")
        if user.is_superuser:
            scoped = queryset
        elif user.school_id:
            scoped = queryset.filter(school_id=user.school_id)
        else:
            return queryset.none()

        query = self.request.query_params
        date_from = query.get("date_from")
        date_to = query.get("date_to")
        source = query.get("source")
        active_status = query.get("active_status") or query.get("status")

        if date_from:
            scoped = scoped.filter(query_date__gte=date_from)
        if date_to:
            scoped = scoped.filter(query_date__lte=date_to)
        if source:
            scoped = scoped.filter(source_id=source)
        if active_status:
            scoped = scoped.filter(active_status=active_status)

        return scoped

    def perform_create(self, serializer):
        user = self.request.user
        school = getattr(user, "school", None) or getattr(self.request, "school", None)

        # Fallback for users where only school_id is present.
        if not school and getattr(user, "school_id", None):
            school = School.objects.filter(id=user.school_id, is_active=True).first()

        if not school:
            raise PermissionDenied("School context is required.")

        instance = serializer.save(school=school, created_by=user)
        if not instance.query_date:
            instance.query_date = timezone.localdate()
        if instance.school_class_id and not instance.class_name:
            instance.class_name = instance.school_class.name
        instance.save(update_fields=["query_date", "class_name", "updated_at"])

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.school_class_id and not instance.class_name:
            instance.class_name = instance.school_class.name
            instance.save(update_fields=["class_name", "updated_at"])


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

        inquiry_updates = {
            "follow_up_date": timezone.localdate(),
        }

        next_follow_up_date = self.request.data.get("next_follow_up_date")
        active_status = self.request.data.get("active_status") or self.request.data.get("status")

        if next_follow_up_date:
            inquiry_updates["next_follow_up_date"] = next_follow_up_date
        if active_status:
            inquiry_updates["active_status"] = active_status

        # Keep lifecycle status update support for existing screens.
        if instance.status_after:
            inquiry_updates["status"] = instance.status_after

        AdmissionInquiry.objects.filter(pk=instance.inquiry_id).update(**inquiry_updates)


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

    @action(detail=False, methods=["get"], url_path="generate-setup")
    def generate_setup(self, request):
        user = request.user

        templates = self.get_queryset()

        roles_qs = Role.objects.order_by("name")
        classes_qs = Class.objects.order_by("numeric_order", "name")
        sections_qs = Section.objects.select_related("school_class").order_by("name")

        if not user.is_superuser:
            roles_qs = roles_qs.filter(school_id=user.school_id) | roles_qs.filter(school__isnull=True)
            classes_qs = classes_qs.filter(school_id=user.school_id)
            sections_qs = sections_qs.filter(school_class__school_id=user.school_id)

        role_rows = []
        for role in roles_qs.distinct():
            role_rows.append({"id": role.id, "name": role.name})

        class_rows = []
        for row in classes_qs:
            class_rows.append({"id": row.id, "name": row.name})

        section_rows = []
        for row in sections_qs:
            section_rows.append({"id": row.id, "school_class": row.school_class_id, "name": row.name})

        serialized_templates = self.get_serializer(templates, many=True).data

        return Response(
            {
                "roles": role_rows,
                "classes": class_rows,
                "sections": section_rows,
                "templates": serialized_templates,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=False, methods=["get"], url_path="recipients")
    def recipients(self, request):
        user = request.user
        role_id = request.query_params.get("role")
        class_id = request.query_params.get("class")
        section_id = request.query_params.get("section")

        if not role_id:
            return Response({"detail": "role query param is required."}, status=status.HTTP_400_BAD_REQUEST)

        role = Role.objects.filter(id=role_id).first()
        if not role:
            return Response({"detail": "Role not found."}, status=status.HTTP_404_NOT_FOUND)

        is_student_role = role.name.lower().find("student") >= 0 or str(role.id) == "2"

        if is_student_role:
            students_qs = Student.objects.select_related("current_class", "current_section")
            if not user.is_superuser:
                students_qs = students_qs.filter(school_id=user.school_id)
            if class_id:
                students_qs = students_qs.filter(current_class_id=class_id)
            if section_id:
                students_qs = students_qs.filter(current_section_id=section_id)

            rows = []
            for student in students_qs.order_by("first_name", "last_name"):
                label = f"{(student.first_name or '').strip()} {(student.last_name or '').strip()}".strip() or f"Student #{student.id}"
                rows.append(
                    {
                        "id": student.id,
                        "label": label,
                        "admission_no": student.admission_no or "",
                        "roll_no": student.roll_no or "",
                        "className": student.current_class.name if student.current_class else "",
                        "sectionName": student.current_section.name if student.current_section else "",
                        "gender": student.gender or "",
                        "dateOfBirth": student.date_of_birth,
                    }
                )

            return Response({"is_student_role": True, "recipients": rows}, status=status.HTTP_200_OK)

        user_role_qs = UserRole.objects.select_related("user", "role").filter(role_id=role.id)
        if not user.is_superuser:
            user_role_qs = user_role_qs.filter(role__school_id=user.school_id)

        seen = set()
        rows = []
        for row in user_role_qs.order_by("user_id"):
            if row.user_id in seen:
                continue
            seen.add(row.user_id)
            full_name = f"{(row.user.first_name or '').strip()} {(row.user.last_name or '').strip()}".strip()
            rows.append({"id": row.user_id, "label": full_name or row.user.username})

        return Response({"is_student_role": False, "recipients": rows}, status=status.HTTP_200_OK)
