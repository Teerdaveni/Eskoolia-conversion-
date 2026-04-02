from rest_framework.routers import DefaultRouter
from .views import (
    ChatViewSet,
    GroupChatViewSet,
    InvitationViewSet,
    UserStatusViewSet,
)

router = DefaultRouter()
router.register("messages", ChatViewSet, basename="chat-message")
router.register("groups", GroupChatViewSet, basename="chat-group")
router.register("invitations", InvitationViewSet, basename="chat-invitation")
router.register("status", UserStatusViewSet, basename="chat-status")

urlpatterns = router.urls
