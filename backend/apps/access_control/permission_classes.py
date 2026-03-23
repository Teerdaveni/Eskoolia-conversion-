from rest_framework.permissions import BasePermission


class HasPermissionCode(BasePermission):
    required_code = ""

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return user.has_permission_code(self.required_code)


class CanViewPermissions(HasPermissionCode):
    required_code = "access_control.permission.read"


class CanManageRoles(HasPermissionCode):
    required_code = "access_control.role.manage"


class CanManageUserRoles(HasPermissionCode):
    required_code = "access_control.user_role.manage"
