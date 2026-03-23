from rest_framework import permissions, viewsets
from .models import Permission, Role, UserRole
from .permission_classes import CanManageRoles, CanManageUserRoles, CanViewPermissions
from .serializers import PermissionSerializer, RoleSerializer, UserRoleSerializer


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
