from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AssignedIncidentCommentViewSet, AssignedIncidentViewSet, BehaviourRecordSettingAPIView, IncidentViewSet

router = DefaultRouter()
router.register("incidents", IncidentViewSet, basename="behaviour-incident")
router.register("assignments", AssignedIncidentViewSet, basename="behaviour-assignment")
router.register("comments", AssignedIncidentCommentViewSet, basename="behaviour-comment")

urlpatterns = [
    path("settings/", BehaviourRecordSettingAPIView.as_view(), name="behaviour-settings"),
]

urlpatterns += router.urls
