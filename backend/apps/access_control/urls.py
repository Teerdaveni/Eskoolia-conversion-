from rest_framework.routers import DefaultRouter
from .views import PermissionViewSet, RoleViewSet, UserRoleViewSet

router = DefaultRouter()
router.register("permissions", PermissionViewSet, basename="permission")
router.register("roles", RoleViewSet, basename="role")
router.register("user-roles", UserRoleViewSet, basename="user-role")

urlpatterns = router.urls
