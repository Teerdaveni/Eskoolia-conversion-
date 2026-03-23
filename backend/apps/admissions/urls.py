from rest_framework.routers import DefaultRouter
from .views import AdmissionFollowUpViewSet, AdmissionInquiryViewSet

router = DefaultRouter()
router.register("inquiries", AdmissionInquiryViewSet, basename="admission-inquiry")
router.register("follow-ups", AdmissionFollowUpViewSet, basename="admission-followup")

urlpatterns = router.urls
