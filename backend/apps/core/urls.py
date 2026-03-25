from rest_framework.routers import DefaultRouter
from .views import AcademicYearViewSet, ClassPeriodViewSet, ClassRoomViewSet, ClassViewSet, SectionViewSet, SubjectViewSet

router = DefaultRouter()
router.register("academic-years", AcademicYearViewSet, basename="academic-year")
router.register("classes", ClassViewSet, basename="class")
router.register("sections", SectionViewSet, basename="section")
router.register("subjects", SubjectViewSet, basename="subject")
router.register("class-periods", ClassPeriodViewSet, basename="class-period")
router.register("class-rooms", ClassRoomViewSet, basename="class-room")

urlpatterns = router.urls
