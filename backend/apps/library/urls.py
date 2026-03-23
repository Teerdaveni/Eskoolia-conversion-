from rest_framework.routers import DefaultRouter

from .views import BookCategoryViewSet, BookIssueViewSet, BookViewSet, LibraryMemberViewSet

router = DefaultRouter()
router.register("categories", BookCategoryViewSet, basename="library-category")
router.register("books", BookViewSet, basename="library-book")
router.register("members", LibraryMemberViewSet, basename="library-member")
router.register("issues", BookIssueViewSet, basename="library-issue")

urlpatterns = router.urls
