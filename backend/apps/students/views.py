from django.db import IntegrityError, transaction
from django.db.models.deletion import ProtectedError
from django.db.models import Count
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
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
from .serializers import (
    GuardianSerializer,
    StudentCategorySerializer,
    StudentDocumentSerializer,
    StudentGroupSerializer,
    StudentMultiClassBulkSaveSerializer,
    StudentMultiClassRecordSerializer,
    StudentPromoteRequestSerializer,
    StudentPromotionHistorySerializer,
    StudentSerializer,
    StudentTransferHistorySerializer,
)


class TenantScopedModelViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    model = None
    permission_codes = {}

    def get_required_permission_code(self):
        action = getattr(self, "action", None)
        if action and action in self.permission_codes:
            return self.permission_codes[action]
        return self.permission_codes.get("*")

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        code = self.get_required_permission_code()
        if not code:
            return
        user = request.user
        if user.is_superuser:
            return
        if not hasattr(user, "has_permission_code") or not user.has_permission_code(code):
            raise PermissionDenied("You do not have permission to perform this action.")

    def get_queryset(self):
        user = self.request.user
        qs = self.model.objects.all()
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(school_id=user.school_id)
        return qs.none()

    def perform_create(self, serializer):
        school = self.request.user.school
        if not school and getattr(self.request, "school", None):
            school = self.request.school
        if school:
            serializer.save(school=school)
            return
        # Superuser without school can provide school explicitly in payload
        serializer.save()

    def create(self, request, *args, **kwargs):
        try:
            return super().create(request, *args, **kwargs)
        except IntegrityError:
            raise ValidationError({"detail": "Duplicate value violates a uniqueness constraint."})

    def update(self, request, *args, **kwargs):
        try:
            return super().update(request, *args, **kwargs)
        except IntegrityError:
            raise ValidationError({"detail": "Duplicate value violates a uniqueness constraint."})

    def partial_update(self, request, *args, **kwargs):
        try:
            return super().partial_update(request, *args, **kwargs)
        except IntegrityError:
            raise ValidationError({"detail": "Duplicate value violates a uniqueness constraint."})


class StudentCategoryViewSet(TenantScopedModelViewSet):
    model = StudentCategory
    serializer_class = StudentCategorySerializer
    permission_codes = {"*": "student_info.student_category.view"}


class StudentGroupViewSet(TenantScopedModelViewSet):
    model = StudentGroup
    serializer_class = StudentGroupSerializer
    permission_codes = {"*": "student_info.student_group.view"}

    def get_queryset(self):
        user = self.request.user
        qs = StudentGroup.objects.all()
        if user.is_superuser:
            return qs.annotate(students_count=Count("students", distinct=True)).order_by("name")
        if user.school_id:
            return qs.filter(school_id=user.school_id).annotate(students_count=Count("students", distinct=True)).order_by("name")
        return qs.none()


class GuardianViewSet(TenantScopedModelViewSet):
    model = Guardian
    serializer_class = GuardianSerializer
    permission_codes = {"*": "student_info.add_student.view"}


class StudentViewSet(TenantScopedModelViewSet):
    model = Student
    serializer_class = StudentSerializer
    permission_codes = {
        "list": "student_info.student_list.view",
        "retrieve": "student_info.student_list.view",
        "create": "student_info.add_student.view",
        "update": "student_info.add_student.view",
        "partial_update": "student_info.add_student.view",
        "destroy": "student_info.delete_student_record.view",
        "promote": "student_info.student_promote.view",
    }

    def get_queryset(self):
        user = self.request.user
        qs = Student.objects.select_related(
            "school",
            "category",
            "student_group",
            "guardian",
            "current_class",
            "current_section",
            "admission_inquiry",
        ).prefetch_related("documents")
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(school_id=user.school_id)
        return qs.none()

    @action(detail=False, methods=["post"], url_path="promote")
    def promote(self, request):
        serializer = StudentPromoteRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        school_id = request.user.school_id
        if not school_id and not request.user.is_superuser:
            raise ValidationError("User school context is required.")

        target_class_id = data["to_class"]
        target_section_id = data.get("to_section")
        target_year_id = data.get("to_academic_year")

        from apps.core.models import AcademicYear, Class, Section

        # Validate target class/section/year belongs to same school for tenant safety
        class_qs = Class.objects.filter(id=target_class_id)
        if not request.user.is_superuser:
            class_qs = class_qs.filter(school_id=school_id)
        if not class_qs.exists():
            raise ValidationError("Target class not found in your school.")

        if target_section_id:
            section_qs = Section.objects.filter(id=target_section_id, school_class_id=target_class_id)
            if not section_qs.exists():
                raise ValidationError("Target section not found under target class.")

        if target_year_id:
            year_qs = AcademicYear.objects.filter(id=target_year_id)
            if not request.user.is_superuser:
                year_qs = year_qs.filter(school_id=school_id)
            if not year_qs.exists():
                raise ValidationError("Target academic year not found in your school.")

        students_qs = Student.objects.filter(id__in=data["student_ids"])
        if not request.user.is_superuser:
            students_qs = students_qs.filter(school_id=school_id)
        students = list(students_qs)

        if not students:
            raise ValidationError("No students found for promotion.")

        promoted_count = 0
        with transaction.atomic():
            for st in students:
                StudentPromotionHistory.objects.create(
                    student=st,
                    from_class=st.current_class,
                    from_section=st.current_section,
                    to_class_id=target_class_id,
                    to_section_id=target_section_id,
                    to_academic_year_id=target_year_id,
                    note=data.get("note", ""),
                    promoted_by=request.user,
                )
                st.current_class_id = target_class_id
                st.current_section_id = target_section_id
                st.save(update_fields=["current_class", "current_section", "updated_at"])
                promoted_count += 1

        return Response({"promoted": promoted_count}, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except (ProtectedError, IntegrityError):
            raise ValidationError(
                {
                    "detail": (
                        "This student cannot be deleted because related records exist "
                        "(attendance, exam, fees, or other dependent data)."
                    )
                }
            )


class StudentDocumentViewSet(TenantScopedModelViewSet):
    serializer_class = StudentDocumentSerializer
    model = StudentDocument
    permission_codes = {"*": "student_info.student_list.view"}

    def get_queryset(self):
        user = self.request.user
        qs = StudentDocument.objects.select_related("student__school")
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(student__school_id=user.school_id)
        return qs.none()


class StudentTransferHistoryViewSet(TenantScopedModelViewSet):
    serializer_class = StudentTransferHistorySerializer
    model = StudentTransferHistory
    permission_codes = {"*": "student_info.delete_student_record.view"}

    def get_queryset(self):
        user = self.request.user
        qs = StudentTransferHistory.objects.select_related("student__school", "from_school", "to_school")
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(student__school_id=user.school_id)
        return qs.none()


class StudentPromotionHistoryViewSet(TenantScopedModelViewSet):
    serializer_class = StudentPromotionHistorySerializer
    model = StudentPromotionHistory
    permission_codes = {"*": "student_info.student_promote.view"}

    def get_queryset(self):
        user = self.request.user
        qs = StudentPromotionHistory.objects.select_related(
            "student__school",
            "from_class",
            "from_section",
            "to_class",
            "to_section",
            "from_academic_year",
            "to_academic_year",
            "promoted_by",
        )
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(student__school_id=user.school_id)
        return qs.none()


class StudentMultiClassRecordViewSet(TenantScopedModelViewSet):
    serializer_class = StudentMultiClassRecordSerializer
    model = StudentMultiClassRecord
    permission_codes = {
        "*": "student_info.multi_class_student.view",
        "bulk_save": "student_info.multi_class_student.view",
    }

    def get_queryset(self):
        user = self.request.user
        qs = StudentMultiClassRecord.objects.select_related("student", "school_class", "section", "student__school")

        student_id = self.request.query_params.get("student")
        if student_id:
            qs = qs.filter(student_id=student_id)

        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(student__school_id=user.school_id)
        return qs.none()

    def perform_create(self, serializer):
        record = serializer.save()
        if record.is_default:
            StudentMultiClassRecord.objects.filter(student_id=record.student_id).exclude(id=record.id).update(is_default=False)
            Student.objects.filter(id=record.student_id).update(
                current_class_id=record.school_class_id,
                current_section_id=record.section_id,
            )

    def perform_update(self, serializer):
        record = serializer.save()
        if record.is_default:
            StudentMultiClassRecord.objects.filter(student_id=record.student_id).exclude(id=record.id).update(is_default=False)
            Student.objects.filter(id=record.student_id).update(
                current_class_id=record.school_class_id,
                current_section_id=record.section_id,
            )

    @action(detail=False, methods=["post"], url_path="bulk-save")
    def bulk_save(self, request):
        serializer = StudentMultiClassBulkSaveSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        student_id = data["student_id"]
        user = request.user
        student_qs = Student.objects.filter(id=student_id)
        if not user.is_superuser:
            student_qs = student_qs.filter(school_id=user.school_id)
        student = student_qs.first()
        if not student:
            raise ValidationError("Student not found in your school.")

        records = data.get("records", [])
        default_seen = False

        with transaction.atomic():
            StudentMultiClassRecord.objects.filter(student=student).delete()
            created = []

            for item in records:
                school_class_id = item["school_class"]
                section_id = item.get("section")
                is_default = bool(item.get("is_default", False))
                if is_default:
                    if default_seen:
                        is_default = False
                    default_seen = True

                from apps.core.models import Class, Section

                class_qs = Class.objects.filter(id=school_class_id)
                if not user.is_superuser:
                    class_qs = class_qs.filter(school_id=student.school_id)
                if not class_qs.exists():
                    raise ValidationError("One or more classes are invalid for this student school.")

                if section_id:
                    section_qs = Section.objects.filter(id=section_id, school_class_id=school_class_id)
                    if not section_qs.exists():
                        raise ValidationError("One or more sections do not belong to selected class.")

                created.append(
                    StudentMultiClassRecord.objects.create(
                        student=student,
                        school_class_id=school_class_id,
                        section_id=section_id,
                        roll_no=item.get("roll_no", ""),
                        is_default=is_default,
                    )
                )

            default_record = next((item for item in created if item.is_default), None)
            if not default_record and created:
                default_record = created[0]
                default_record.is_default = True
                default_record.save(update_fields=["is_default", "updated_at"])

            if default_record:
                student.current_class_id = default_record.school_class_id
                student.current_section_id = default_record.section_id
                student.save(update_fields=["current_class", "current_section", "updated_at"])

        response_data = StudentMultiClassRecordSerializer(
            StudentMultiClassRecord.objects.filter(student=student).order_by("-is_default", "id"),
            many=True,
        ).data
        return Response({"student_id": student.id, "records": response_data}, status=status.HTTP_200_OK)
