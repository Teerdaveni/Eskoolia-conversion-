from rest_framework.routers import DefaultRouter

from .views import FeesAssignmentViewSet, FeesGroupViewSet, FeesPaymentViewSet, FeesTypeViewSet

router = DefaultRouter()
router.register("groups", FeesGroupViewSet, basename="fees-group")
router.register("types", FeesTypeViewSet, basename="fees-type")
router.register("assignments", FeesAssignmentViewSet, basename="fees-assignment")
router.register("payments", FeesPaymentViewSet, basename="fees-payment")

urlpatterns = router.urls
