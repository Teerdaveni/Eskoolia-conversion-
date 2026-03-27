from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from .models import AcademicYear, Class, ClassPeriod, ClassRoom, Section, Subject, Vehicle, TransportRoute, AssignVehicle
from .models import ItemCategory, ItemStore, Supplier, Item, ItemReceive, ItemIssue, ItemSell
from .serializers import (
    AcademicYearSerializer,
    ClassPeriodSerializer,
    ClassRoomSerializer,
    ClassSerializer,
    SectionSerializer,
    SubjectSerializer,
    VehicleSerializer,
    TransportRouteSerializer,
    AssignVehicleSerializer,
    ItemCategorySerializer,
    ItemStoreSerializer,
    SupplierSerializer,
    ItemSerializer,
    ItemReceiveSerializer,
    ItemIssueSerializer,
    ItemSellSerializer,
)


class TenantQueryMixin:
    """Filter queryset to the authenticated user's school."""
    model = None

    def get_queryset(self):
        user = self.request.user
        qs = self.model.objects.all()
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(school_id=user.school_id)
        return qs.none()

    def perform_create(self, serializer):
        serializer.save(school=self.request.user.school)


class AcademicYearViewSet(TenantQueryMixin, viewsets.ModelViewSet):
    model = AcademicYear
    serializer_class = AcademicYearSerializer
    permission_classes = [permissions.IsAuthenticated]


class ClassViewSet(TenantQueryMixin, viewsets.ModelViewSet):
    model = Class
    serializer_class = ClassSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Class.objects.prefetch_related("sections")
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(school_id=user.school_id)
        return qs.none()


class SectionViewSet(viewsets.ModelViewSet):
    serializer_class = SectionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Section.objects.select_related("school_class__school")
        if user.is_superuser:
            return qs
        if user.school_id:
            return qs.filter(school_class__school_id=user.school_id)
        return qs.none()


class SubjectViewSet(TenantQueryMixin, viewsets.ModelViewSet):
    model = Subject
    serializer_class = SubjectSerializer
    permission_classes = [permissions.IsAuthenticated]


class ClassPeriodViewSet(TenantQueryMixin, viewsets.ModelViewSet):
    model = ClassPeriod
    serializer_class = ClassPeriodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        period_type = self.request.query_params.get("period_type") or self.request.query_params.get("type")
        if period_type:
            queryset = queryset.filter(period_type=period_type)
        return queryset.order_by("start_time", "period")


class ClassRoomViewSet(TenantQueryMixin, viewsets.ModelViewSet):
    model = ClassRoom
    serializer_class = ClassRoomSerializer
    permission_classes = [permissions.IsAuthenticated]


# ===== TRANSPORT MODULE VIEWSETS =====
class VehicleViewSet(TenantQueryMixin, viewsets.ModelViewSet):
    model = Vehicle
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related("driver", "academic_year", "school")

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        
        school = self.request.user.school
        if not school:
            raise ValidationError({"school": "User does not have a school assigned."})
        
        # Try to get current academic year, fallback to latest one
        academic_year = AcademicYear.objects.filter(school=school, is_current=True).first()
        if not academic_year:
            academic_year = AcademicYear.objects.filter(school=school).order_by("-start_date").first()
        
        if not academic_year:
            raise ValidationError({"academic_year": "No academic year found for your school. Please create one first."})
        
        serializer.save(school=school, academic_year=academic_year)


class TransportRouteViewSet(TenantQueryMixin, viewsets.ModelViewSet):
    model = TransportRoute
    serializer_class = TransportRouteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related("academic_year", "school")

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        
        school = self.request.user.school
        if not school:
            raise ValidationError({"school": "User does not have a school assigned."})
        
        # Try to get current academic year, fallback to latest one
        academic_year = AcademicYear.objects.filter(school=school, is_current=True).first()
        if not academic_year:
            academic_year = AcademicYear.objects.filter(school=school).order_by("-start_date").first()
        
        if not academic_year:
            raise ValidationError({"academic_year": "No academic year found for your school. Please create one first."})
        
        serializer.save(school=school, academic_year=academic_year)


class AssignVehicleViewSet(TenantQueryMixin, viewsets.ModelViewSet):
    model = AssignVehicle
    serializer_class = AssignVehicleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related("vehicle", "route", "academic_year", "school")

    def perform_create(self, serializer):
        from rest_framework.exceptions import ValidationError
        
        school = self.request.user.school
        if not school:
            raise ValidationError({"school": "User does not have a school assigned."})
        
        # Try to get current academic year, fallback to latest one
        academic_year = AcademicYear.objects.filter(school=school, is_current=True).first()
        if not academic_year:
            academic_year = AcademicYear.objects.filter(school=school).order_by("-start_date").first()
        
        if not academic_year:
            raise ValidationError({"academic_year": "No academic year found for your school. Please create one first."})
        
        serializer.save(school=school, academic_year=academic_year)


# ===== INVENTORY MODULE VIEWSETS =====
class ItemCategoryViewSet(TenantQueryMixin, viewsets.ModelViewSet):
    model = ItemCategory
    serializer_class = ItemCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.order_by("title")


class ItemStoreViewSet(TenantQueryMixin, viewsets.ModelViewSet):
    model = ItemStore
    serializer_class = ItemStoreSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.order_by("title")


class SupplierViewSet(TenantQueryMixin, viewsets.ModelViewSet):
    model = Supplier
    serializer_class = SupplierSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.order_by("name")


class ItemViewSet(TenantQueryMixin, viewsets.ModelViewSet):
    model = Item
    serializer_class = ItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related("category", "supplier").order_by("item_code")

    def perform_create(self, serializer):
        school = self.request.user.school
        if not school:
            raise PermissionDenied("School context is required.")
        serializer.save(school=school)


class ItemReceiveViewSet(TenantQueryMixin, viewsets.ModelViewSet):
    model = ItemReceive
    serializer_class = ItemReceiveSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related("supplier", "created_by").order_by("-receive_date")

    def perform_create(self, serializer):
        school = self.request.user.school
        if not school:
            raise PermissionDenied("School context is required.")
        serializer.save(school=school, created_by=self.request.user)


class ItemIssueViewSet(TenantQueryMixin, viewsets.ModelViewSet):
    model = ItemIssue
    serializer_class = ItemIssueSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related("store", "issued_by").order_by("-issue_date")

    def perform_create(self, serializer):
        school = self.request.user.school
        if not school:
            raise PermissionDenied("School context is required.")
        serializer.save(school=school, issued_by=self.request.user)


class ItemSellViewSet(TenantQueryMixin, viewsets.ModelViewSet):
    model = ItemSell
    serializer_class = ItemSellSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.select_related("created_by").order_by("-sell_date")

    def perform_create(self, serializer):
        school = self.request.user.school
        if not school:
            raise PermissionDenied("School context is required.")
        serializer.save(school=school, created_by=self.request.user)
