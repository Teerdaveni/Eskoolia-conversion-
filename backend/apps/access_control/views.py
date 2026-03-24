from django.contrib.auth import get_user_model
from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.models import Class, Section
from apps.fees.models import FeesAssignment
from apps.hr.models import Staff
from apps.students.models import Student

from .models import Permission, Role, UserRole
from .permission_classes import CanManageRoles, CanManageUserRoles, CanViewPermissions
from .serializers import PermissionSerializer, RoleSerializer, UserRoleSerializer

User = get_user_model()


def _coerce_bool(value):
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    return str(value).lower() in {"1", "true", "yes", "on"}


def _is_student_role(role: Role) -> bool:
    if not role:
        return False
    name = (role.name or "").lower()
    return "student" in name or str(role.id) == "2"


def _is_parent_role(role: Role) -> bool:
    if not role:
        return False
    name = (role.name or "").lower()
    return "parent" in name or str(role.id) == "3"


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewPermissions]


class RoleViewSet(viewsets.ModelViewSet):
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageRoles]

    def get_queryset(self):
        user = self.request.user
        queryset = Role.objects.prefetch_related("permissions")
        if user.is_superuser:
            return queryset
        if user.school_id:
            return queryset.filter(school_id=user.school_id)
        return queryset.none()

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(school=user.school)

    @action(detail=False, methods=["get"], url_path="permission-tree")
    def permission_tree(self, request):
        role_id = request.query_params.get("role")
        role = None
        selected_ids = set()
        if role_id:
            role = self.get_queryset().filter(id=role_id).first()
            if role:
                selected_ids = set(role.permissions.values_list("id", flat=True))

        grouped = {}
        for perm in Permission.objects.order_by("module", "name"):
            grouped.setdefault(perm.module, []).append(
                {
                    "id": perm.id,
                    "code": perm.code,
                    "name": perm.name,
                    "selected": perm.id in selected_ids,
                }
            )

        rows = [{"module": module, "permissions": perms} for module, perms in grouped.items()]
        return Response(
            {
                "role": {"id": role.id, "name": role.name} if role else None,
                "modules": rows,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="assign-permissions")
    def assign_permissions(self, request, pk=None):
        role = self.get_object()
        permission_ids = request.data.get("permission_ids", [])
        if not isinstance(permission_ids, list):
            return Response({"detail": "permission_ids must be a list."}, status=status.HTTP_400_BAD_REQUEST)

        permissions_qs = Permission.objects.filter(id__in=permission_ids)
        role.permissions.set(permissions_qs)
        return Response(
            {
                "detail": "Permissions assigned successfully.",
                "role_id": role.id,
                "permission_ids": list(permissions_qs.values_list("id", flat=True)),
            },
            status=status.HTTP_200_OK,
        )


class UserRoleViewSet(viewsets.ModelViewSet):
    serializer_class = UserRoleSerializer
    permission_classes = [permissions.IsAuthenticated, CanManageUserRoles]

    def get_queryset(self):
        user = self.request.user
        queryset = UserRole.objects.select_related("user", "role")

        role_id = self.request.query_params.get("role")
        if role_id:
            queryset = queryset.filter(role_id=role_id)

        if user.is_superuser:
            return queryset
        if user.school_id:
            return queryset.filter(role__school_id=user.school_id)
        return queryset.none()


class LoginAccessControlViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, CanManageUserRoles]

    def _roles_queryset(self, request):
        qs = Role.objects.order_by("name")
        if request.user.is_superuser:
            return qs
        if request.user.school_id:
            return qs.filter(Q(school_id=request.user.school_id) | Q(school__isnull=True))
        return Role.objects.none()

    def list(self, request):
        classes_qs = Class.objects.order_by("numeric_order", "name")
        sections_qs = Section.objects.select_related("school_class").order_by("name")
        if not request.user.is_superuser and request.user.school_id:
            classes_qs = classes_qs.filter(school_id=request.user.school_id)
            sections_qs = sections_qs.filter(school_class__school_id=request.user.school_id)

        roles = [{"id": row.id, "name": row.name} for row in self._roles_queryset(request)]
        classes = [{"id": row.id, "name": row.name} for row in classes_qs]
        sections = [{"id": row.id, "name": row.name, "class_id": row.school_class_id} for row in sections_qs]
        return Response({"roles": roles, "classes": classes, "sections": sections}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="users")
    def users(self, request):
        role_id = request.query_params.get("role")
        class_id = request.query_params.get("class") or request.query_params.get("class_id")
        section_id = request.query_params.get("section") or request.query_params.get("section_id")
        search = (request.query_params.get("search") or "").strip()

        if not role_id:
            return Response({"detail": "role query param is required."}, status=status.HTTP_400_BAD_REQUEST)

        role = self._roles_queryset(request).filter(id=role_id).first()
        if not role:
            return Response({"detail": "Role not found."}, status=status.HTTP_404_NOT_FOUND)

        user_role_qs = UserRole.objects.select_related("user", "role").filter(role_id=role.id)
        if not request.user.is_superuser and request.user.school_id:
            user_role_qs = user_role_qs.filter(Q(role__school_id=request.user.school_id) | Q(role__school__isnull=True))

        linked_student_by_username = {}
        if _is_student_role(role):
            students_qs = Student.objects.select_related("current_class", "current_section")
            if not request.user.is_superuser and request.user.school_id:
                students_qs = students_qs.filter(school_id=request.user.school_id)
            if class_id:
                students_qs = students_qs.filter(current_class_id=class_id)
            if section_id:
                students_qs = students_qs.filter(current_section_id=section_id)
            if search:
                students_qs = students_qs.filter(
                    Q(first_name__icontains=search)
                    | Q(last_name__icontains=search)
                    | Q(admission_no__icontains=search)
                    | Q(roll_no__icontains=search)
                )

            for student in students_qs:
                if student.admission_no:
                    linked_student_by_username[str(student.admission_no)] = student

            if linked_student_by_username:
                user_role_qs = user_role_qs.filter(user__username__in=list(linked_student_by_username.keys()))
            else:
                user_role_qs = user_role_qs.none()
        elif search:
            user_role_qs = user_role_qs.filter(
                Q(user__username__icontains=search)
                | Q(user__first_name__icontains=search)
                | Q(user__last_name__icontains=search)
                | Q(user__email__icontains=search)
            )

        rows = []
        seen = set()
        staff_map = {
            row.user_id: row
            for row in Staff.objects.filter(user_id__in=user_role_qs.values_list("user_id", flat=True)).only(
                "user_id", "staff_no"
            )
        }

        for row in user_role_qs.order_by("user_id"):
            if row.user_id in seen:
                continue
            seen.add(row.user_id)

            user = row.user
            full_name = f"{(user.first_name or '').strip()} {(user.last_name or '').strip()}".strip() or user.username
            linked_student = linked_student_by_username.get(user.username)
            staff = staff_map.get(user.id)

            rows.append(
                {
                    "user_id": user.id,
                    "username": user.username,
                    "name": full_name,
                    "email": user.email,
                    "role_id": row.role_id,
                    "role_name": row.role.name,
                    "access_status": bool(getattr(user, "access_status", True)),
                    "staff_no": staff.staff_no if staff else "",
                    "admission_no": linked_student.admission_no if linked_student else "",
                    "roll_no": linked_student.roll_no if linked_student else "",
                    "class_name": linked_student.current_class.name if linked_student and linked_student.current_class else "",
                    "section_name": linked_student.current_section.name if linked_student and linked_student.current_section else "",
                }
            )

        return Response({"role": {"id": role.id, "name": role.name}, "users": rows}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="toggle")
    def toggle(self, request):
        user_id = request.data.get("user_id") or request.data.get("id")
        if not user_id:
            return Response({"detail": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        status_value = request.data.get("status")
        enabled = _coerce_bool(status_value)
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_superuser and request.user.school_id and user.school_id != request.user.school_id:
            return Response({"detail": "User does not belong to your school."}, status=status.HTTP_403_FORBIDDEN)

        user.access_status = enabled
        user.save(update_fields=["access_status"])
        return Response({"user_id": user.id, "access_status": user.access_status}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="reset-password")
    def reset_password(self, request):
        user_id = request.data.get("user_id") or request.data.get("id")
        new_password = request.data.get("password") or "123456"
        if not user_id:
            return Response({"detail": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_superuser and request.user.school_id and user.school_id != request.user.school_id:
            return Response({"detail": "User does not belong to your school."}, status=status.HTTP_403_FORBIDDEN)

        user.set_password(str(new_password))
        user.save(update_fields=["password"])
        return Response({"detail": "Password updated.", "user_id": user.id}, status=status.HTTP_200_OK)


class DueFeesLoginPermissionViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, CanManageUserRoles]

    def _role_queryset(self, request):
        qs = Role.objects.order_by("name")
        if request.user.is_superuser:
            return qs
        if request.user.school_id:
            return qs.filter(Q(school_id=request.user.school_id) | Q(school__isnull=True))
        return Role.objects.none()

    def list(self, request):
        roles = []
        for row in self._role_queryset(request):
            if _is_student_role(row) or _is_parent_role(row):
                roles.append({"id": row.id, "name": row.name})

        classes_qs = Class.objects.order_by("numeric_order", "name")
        sections_qs = Section.objects.select_related("school_class").order_by("name")
        if not request.user.is_superuser and request.user.school_id:
            classes_qs = classes_qs.filter(school_id=request.user.school_id)
            sections_qs = sections_qs.filter(school_class__school_id=request.user.school_id)

        classes = [{"id": row.id, "name": row.name} for row in classes_qs]
        sections = [{"id": row.id, "name": row.name, "class_id": row.school_class_id} for row in sections_qs]

        return Response({"roles": roles, "classes": classes, "sections": sections}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["get"], url_path="users")
    def users(self, request):
        role_id = request.query_params.get("role")
        class_id = request.query_params.get("class") or request.query_params.get("class_id")
        section_id = request.query_params.get("section") or request.query_params.get("section_id")
        admission_no = (request.query_params.get("admission_no") or "").strip()
        name = (request.query_params.get("name") or "").strip()

        if not role_id:
            return Response({"detail": "role query param is required."}, status=status.HTTP_400_BAD_REQUEST)

        role = self._role_queryset(request).filter(id=role_id).first()
        if not role:
            return Response({"detail": "Role not found."}, status=status.HTTP_404_NOT_FOUND)

        users_qs = UserRole.objects.select_related("user", "role").filter(role_id=role.id)
        if not request.user.is_superuser and request.user.school_id:
            users_qs = users_qs.filter(Q(role__school_id=request.user.school_id) | Q(role__school__isnull=True))

        linked_student_by_username = {}
        due_amount_by_username = {}

        if _is_student_role(role):
            students_qs = Student.objects.select_related("current_class", "current_section")
            if not request.user.is_superuser and request.user.school_id:
                students_qs = students_qs.filter(school_id=request.user.school_id)
            if class_id:
                students_qs = students_qs.filter(current_class_id=class_id)
            if section_id:
                students_qs = students_qs.filter(current_section_id=section_id)
            if admission_no:
                students_qs = students_qs.filter(admission_no__icontains=admission_no)
            if name:
                students_qs = students_qs.filter(Q(first_name__icontains=name) | Q(last_name__icontains=name))

            overdue_qs = FeesAssignment.objects.filter(
                student_id__in=students_qs.values_list("id", flat=True),
                due_date__lt=timezone.localdate(),
            ).exclude(status=FeesAssignment.STATUS_PAID)
            due_rows = overdue_qs.values("student_id").annotate(total_due=Sum("amount") - Sum("discount_amount"))
            due_map = {row["student_id"]: row["total_due"] for row in due_rows}

            for student in students_qs:
                if student.admission_no and student.id in due_map:
                    key = str(student.admission_no)
                    linked_student_by_username[key] = student
                    due_amount_by_username[key] = str(due_map[student.id] or "0")

            if linked_student_by_username:
                users_qs = users_qs.filter(user__username__in=list(linked_student_by_username.keys()))
            else:
                users_qs = users_qs.none()
        elif admission_no:
            users_qs = users_qs.filter(user__username__icontains=admission_no)

        if name and not _is_student_role(role):
            users_qs = users_qs.filter(
                Q(user__first_name__icontains=name)
                | Q(user__last_name__icontains=name)
                | Q(user__username__icontains=name)
            )

        rows = []
        seen = set()
        for row in users_qs.order_by("user_id"):
            if row.user_id in seen:
                continue
            seen.add(row.user_id)

            user = row.user
            full_name = f"{(user.first_name or '').strip()} {(user.last_name or '').strip()}".strip() or user.username
            linked_student = linked_student_by_username.get(user.username)

            rows.append(
                {
                    "user_id": user.id,
                    "username": user.username,
                    "name": full_name,
                    "role_id": row.role_id,
                    "role_name": row.role.name,
                    "due_fees_login_blocked": bool(getattr(user, "due_fees_login_blocked", False)),
                    "admission_no": linked_student.admission_no if linked_student else "",
                    "roll_no": linked_student.roll_no if linked_student else "",
                    "class_name": linked_student.current_class.name if linked_student and linked_student.current_class else "",
                    "section_name": linked_student.current_section.name if linked_student and linked_student.current_section else "",
                    "due_amount": due_amount_by_username.get(user.username, ""),
                }
            )

        return Response({"role": {"id": role.id, "name": role.name}, "users": rows}, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="toggle")
    def toggle(self, request):
        user_id = request.data.get("user_id") or request.data.get("id")
        if not user_id:
            return Response({"detail": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        blocked = _coerce_bool(request.data.get("status"))
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if not request.user.is_superuser and request.user.school_id and user.school_id != request.user.school_id:
            return Response({"detail": "User does not belong to your school."}, status=status.HTTP_403_FORBIDDEN)

        user.due_fees_login_blocked = blocked
        user.save(update_fields=["due_fees_login_blocked"])
        return Response(
            {"user_id": user.id, "due_fees_login_blocked": user.due_fees_login_blocked},
            status=status.HTTP_200_OK,
        )
