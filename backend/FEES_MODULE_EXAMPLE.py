"""
EXAMPLE MODULE: Fees Management API (Django conversion from PHP/Laravel)

This is a complete example showing how to convert PHP/Laravel business logic
to Django REST Framework, following all the requirements:
- Class-based APIViews (using DRF ModelViewSet)
- Proper Django project structure (models, serializers, views, urls)
- Same business logic as PHP code
- JSON responses with proper status codes
- Serializers for validation
- Exception handling
- Production-ready code
"""

# ============================================================================
# MODELS (apps/fees/models.py)
# ============================================================================

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class FeesGroup(models.Model):
    """Fees Group - categorizes different fee types"""
    
    school = models.ForeignKey(
        'tenancy.School',
        on_delete=models.CASCADE,
        related_name='fees_groups'
    )
    academic_year = models.ForeignKey(
        'core.AcademicYear',
        on_delete=models.CASCADE,
        related_name='fees_groups'
    )
    name = models.CharField(max_length=100, unique=False)
    description = models.TextField(blank=True)
    active_status = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'fees_groups'
        ordering = ['-created_at']
        unique_together = [['school', 'academic_year', 'name']]
        constraints = [
            models.CheckConstraint(
                check=models.Q(name__length__gt=0),
                name='fees_group_name_not_empty'
            ),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.school.name}"


class FeesType(models.Model):
    """Fees Type - individual fee items (tuition, transport, etc)"""
    
    school = models.ForeignKey(
        'tenancy.School',
        on_delete=models.CASCADE,
        related_name='fees_types'
    )
    academic_year = models.ForeignKey(
        'core.AcademicYear',
        on_delete=models.CASCADE,
        related_name='fees_types'
    )
    fees_group = models.ForeignKey(
        FeesGroup,
        on_delete=models.CASCADE,
        related_name='fees_types'
    )
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    active_status = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'fees_types'
        ordering = ['-created_at']
        unique_together = [['school', 'academic_year', 'fees_group', 'name']]
    
    def __str__(self):
        return f"{self.name} - {self.amount}"


class FeesAssignment(models.Model):
    """Student Fees Assignment - assigns fees to students/classes"""
    
    school = models.ForeignKey(
        'tenancy.School',
        on_delete=models.CASCADE,
        related_name='fees_assignments'
    )
    academic_year = models.ForeignKey(
        'core.AcademicYear',
        on_delete=models.CASCADE,
        related_name='fees_assignments'
    )
    school_class = models.ForeignKey(
        'core.Class',
        on_delete=models.CASCADE,
        related_name='fees_assignments'
    )
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='fees_assignments',
        null=True,
        blank=True
    )
    fees_group = models.ForeignKey(
        FeesGroup,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    is_due = models.DateField()
    is_fully_paid = models.BooleanField(default=False)
    active_status = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'fees_assignments'
        ordering = ['-is_due']
        indexes = [
            models.Index(fields=['student', 'academic_year']),
            models.Index(fields=['school', 'is_fully_paid']),
        ]
    
    def __str__(self):
        return f"{self.student.user.get_full_name()} - {self.amount}"


class FeesPayment(models.Model):
    """Fees Payment - records student fee payments"""
    
    PAYMENT_METHOD_CHOICES = [
        ('bank_transfer', 'Bank Transfer'),
        ('cash', 'Cash'),
        ('check', 'Check'),
        ('online', 'Online Payment'),
        ('wallet', 'Wallet'),
    ]
    
    school = models.ForeignKey(
        'tenancy.School',
        on_delete=models.CASCADE,
        related_name='fees_payments'
    )
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='fees_payments'
    )
    fees_assignment = models.ForeignKey(
        FeesAssignment,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)]
    )
    payment_date = models.DateField()
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        default='cash'
    )
    transaction_ref = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    paid_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='fees_payments_recorded'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'fees_payments'
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['student', 'payment_date']),
            models.Index(fields=['school', 'payment_date']),
        ]
    
    def __str__(self):
        return f"Payment {self.transaction_ref} - {self.amount}"


# ============================================================================
# SERIALIZERS (apps/fees/serializers.py)
# ============================================================================

from rest_framework import serializers
from apps.core.base_serializers import TenantScopedSerializer, AuditedModelSerializer


class FeesGroupSerializer(TenantScopedSerializer):
    """Serializer for Fees Groups"""
    
    fees_types_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FeesGroup
        fields = [
            'id',
            'school_id', 'school_name',
            'academic_year',
            'name',
            'description',
            'active_status',
            'fees_types_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'school',
            'school_id',
            'school_name',
            'created_at',
            'updated_at',
        ]
    
    def get_fees_types_count(self, obj):
        return obj.fees_types.filter(active_status=True).count()
    
    def validate_name(self, value):
        """Ensure unique name for the school and academic year"""
        request = self.context.get('request')
        instance = self.instance
        
        if not request or not request.user.school_id:
            raise serializers.ValidationError("School context required")
        
        queryset = FeesGroup.objects.filter(
            school_id=request.user.school_id,
            name__iexact=value
        )
        
        if instance:
            queryset = queryset.exclude(id=instance.id)
        
        if queryset.exists():
            raise serializers.ValidationError("A fees group with this name already exists")
        
        return value


class FeesTypeSerializer(TenantScopedSerializer):
    """Serializer for Fees Types"""
    
    fees_group_name = serializers.CharField(source='fees_group.name', read_only=True)
    
    class Meta:
        model = FeesType
        fields = [
            'id',
            'school_id', 'school_name',
            'academic_year',
            'fees_group',
            'fees_group_name',
            'name',
            'description',
            'amount',
            'active_status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'school',
            'school_id',
            'school_name',
            'created_at',
            'updated_at',
        ]
    
    def validate_amount(self, value):
        """Ensure amount is positive"""
        if value < 0:
            raise serializers.ValidationError("Amount must be positive")
        return value
    
    def validate(self, data):
        """Ensure fees group belongs to the same school"""
        fees_group = data.get('fees_group')
        if fees_group and fees_group.school_id != self.context['request'].user.school_id:
            raise serializers.ValidationError("Fees group must belong to your school")
        return data


class FeesAssignmentSerializer(TenantScopedSerializer):
    """Serializer for Fees Assignments"""
    
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    class_name = serializers.CharField(source='school_class.name', read_only=True)
    fees_group_name = serializers.CharField(source='fees_group.name', read_only=True)
    amount_paid = serializers.SerializerMethodField()
    amount_remaining = serializers.SerializerMethodField()
    
    class Meta:
        model = FeesAssignment
        fields = [
            'id',
            'school_id', 'school_name',
            'academic_year',
            'school_class',
            'class_name',
            'student',
            'student_name',
            'fees_group',
            'fees_group_name',
            'amount',
            'is_due',
            'is_fully_paid',
            'amount_paid',
            'amount_remaining',
            'active_status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'school',
            'school_id',
            'school_name',
            'amount_paid',
            'amount_remaining',
            'created_at',
            'updated_at',
        ]
    
    def get_amount_paid(self, obj):
        """Get total amount paid for this assignment"""
        return sum(p.amount for p in obj.payments.all())
    
    def get_amount_remaining(self, obj):
        """Get remaining amount to be paid"""
        amount_paid = self.get_amount_paid(obj)
        return obj.amount - amount_paid


class FeesPaymentSerializer(TenantScopedSerializer):
    """Serializer for Fees Payments"""
    
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    paid_by_name = serializers.CharField(source='paid_by.get_full_name', read_only=True)
    
    class Meta:
        model = FeesPayment
        fields = [
            'id',
            'school_id', 'school_name',
            'student',
            'student_name',
            'fees_assignment',
            'amount',
            'payment_date',
            'payment_method',
            'transaction_ref',
            'notes',
            'paid_by',
            'paid_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'school',
            'school_id',
            'school_name',
            'paid_by',
            'paid_by_name',
            'created_at',
            'updated_at',
        ]
    
    def validate_payment_date(self, value):
        """Ensure payment date is not in the future"""
        from datetime import date
        if value > date.today():
            raise serializers.ValidationError("Payment date cannot be in the future")
        return value
    
    def validate_amount(self, value):
        """Ensure amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Payment amount must be positive")
        return value


# ============================================================================
# VIEWS (apps/fees/views.py)
# ============================================================================

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, NotFound
from django.db.models import Sum, Q
from datetime import date, timedelta

from apps.core.viewsets import PaginatedModelViewSet
from apps.core.exceptions import SchoolNotFound


class FeesGroupViewSet(PaginatedModelViewSet):
    """ViewSet for managing Fees Groups"""
    
    model = FeesGroup
    serializer_class = FeesGroupSerializer
    filterset_fields = ['active_status', 'academic_year']
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']
    default_ordering = ['-created_at']
    
    def get_queryset(self):
        """Get fees groups for the user's school"""
        user = self.request.user
        queryset = FeesGroup.objects.select_related('school', 'academic_year')
        
        if not user.is_superuser:
            if not user.school_id:
                return queryset.none()
            queryset = queryset.filter(school_id=user.school_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create fees group with school context"""
        user = self.request.user
        if not user.school_id:
            raise SchoolNotFound()
        serializer.save(school_id=user.school_id)
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Bulk create fees groups"""
        if not isinstance(request.data, list):
            return Response(
                {"detail": "Array of fees groups expected"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = FeesGroupSerializer(
            data=request.data,
            many=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(
            {
                "success": True,
                "message": f"{len(serializer.data)} fees groups created",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED
        )


class FeesTypeViewSet(PaginatedModelViewSet):
    """ViewSet for managing Fees Types"""
    
    model = FeesType
    serializer_class = FeesTypeSerializer
    filterset_fields = ['active_status', 'academic_year', 'fees_group']
    search_fields = ['name']
    ordering_fields = ['name', 'amount', 'created_at']
    default_ordering = ['-created_at']
    
    def get_queryset(self):
        """Get fees types for the user's school"""
        user = self.request.user
        queryset = FeesType.objects.select_related('school', 'academic_year', 'fees_group')
        
        if not user.is_superuser:
            if not user.school_id:
                return queryset.none()
            queryset = queryset.filter(school_id=user.school_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create fees type with school context"""
        user = self.request.user
        if not user.school_id:
            raise SchoolNotFound()
        serializer.save(school_id=user.school_id)


class FeesAssignmentViewSet(PaginatedModelViewSet):
    """ViewSet for managing Student Fees Assignments"""
    
    model = FeesAssignment
    serializer_class = FeesAssignmentSerializer
    filterset_fields = ['active_status', 'academic_year', 'is_fully_paid', 'school_class']
    search_fields = ['student__user__first_name', 'student__user__last_name']
    ordering_fields = ['is_due', 'amount', 'created_at']
    default_ordering = ['-created_at']
    
    def get_queryset(self):
        """Get fees assignments for the user's school"""
        user = self.request.user
        queryset = FeesAssignment.objects.select_related(
            'school',
            'academic_year',
            'school_class',
            'student',
            'fees_group'
        ).prefetch_related('payments')
        
        if not user.is_superuser:
            if not user.school_id:
                return queryset.none()
            queryset = queryset.filter(school_id=user.school_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create fees assignment with school context"""
        user = self.request.user
        if not user.school_id:
            raise SchoolNotFound()
        serializer.save(school_id=user.school_id)
    
    @action(detail=False, methods=['get'])
    def due_fees(self, request):
        """Get all due fees for a student"""
        student_id = request.query_params.get('student_id')
        if not student_id:
            return Response(
                {"detail": "student_id parameter required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        today = date.today()
        assignments = self.get_queryset().filter(
            student_id=student_id,
            is_due__lte=today,
            is_fully_paid=False
        )
        
        serializer = self.get_serializer(assignments, many=True)
        total_due = sum(a.amount - sum(p.amount for p in a.payments.all()) for a in assignments)
        
        return Response(
            {
                "success": True,
                "data": serializer.data,
                "total_due": total_due
            }
        )
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get fees summary statistics"""
        queryset = self.get_queryset()
        
        return Response(
            {
                "success": True,
                "data": {
                    "total_assignments": queryset.count(),
                    "total_amount": queryset.aggregate(Sum('amount'))['amount__sum'] or 0,
                    "fully_paid": queryset.filter(is_fully_paid=True).count(),
                    "pending": queryset.filter(is_fully_paid=False).count(),
                    "overdue": queryset.filter(is_due__lt=date.today(), is_fully_paid=False).count(),
                }
            }
        )


class FeesPaymentViewSet(PaginatedModelViewSet):
    """ViewSet for managing Fees Payments"""
    
    model = FeesPayment
    serializer_class = FeesPaymentSerializer
    filterset_fields = ['payment_method', 'student']
    search_fields = ['student__user__first_name', 'transaction_ref']
    ordering_fields = ['payment_date', 'amount', 'created_at']
    default_ordering = ['-payment_date']
    
    def get_queryset(self):
        """Get fees payments for the user's school"""
        user = self.request.user
        queryset = FeesPayment.objects.select_related(
            'school',
            'student',
            'fees_assignment',
            'paid_by'
        )
        
        if not user.is_superuser:
            if not user.school_id:
                return queryset.none()
            queryset = queryset.filter(school_id=user.school_id)
        
        return queryset
    
    def perform_create(self, serializer):
        """Create fees payment with school and user context"""
        user = self.request.user
        if not user.school_id:
            raise SchoolNotFound()
        
        serializer.save(
            school_id=user.school_id,
            paid_by=user
        )
        
        # Update fees assignment paid status
        assignment = serializer.instance.fees_assignment
        total_paid = sum(p.amount for p in assignment.payments.all())
        if total_paid >= assignment.amount:
            assignment.is_fully_paid = True
            assignment.save()
    
    @action(detail=False, methods=['get'])
    def student_payment_history(self, request):
        """Get payment history for a student"""
        student_id = request.query_params.get('student_id')
        if not student_id:
            return Response(
                {"detail": "student_id parameter required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payments = self.get_queryset().filter(student_id=student_id)
        serializer = self.get_serializer(payments, many=True)
        total_paid = payments.aggregate(Sum('amount'))['amount__sum'] or 0
        
        return Response(
            {
                "success": True,
                "data": serializer.data,
                "total_paid": total_paid
            }
        )
    
    @action(detail=False, methods=['get'])
    def collection_report(self, request):
        """Get fees collection report for date range"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {"detail": "start_date and end_date parameters required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payments = self.get_queryset().filter(
            payment_date__gte=start_date,
            payment_date__lte=end_date
        )
        
        by_method = {}
        for method, label in FeesPayment.PAYMENT_METHOD_CHOICES:
            amount = payments.filter(payment_method=method).aggregate(Sum('amount'))['amount__sum'] or 0
            by_method[method] = amount
        
        return Response(
            {
                "success": True,
                "data": {
                    "total_collected": payments.aggregate(Sum('amount'))['amount__sum'] or 0,
                    "by_method": by_method,
                    "transaction_count": payments.count(),
                }
            }
        )


# ============================================================================
# URLS (apps/fees/urls.py)
# ============================================================================

from rest_framework.routers import DefaultRouter
from django.urls import path, include

router = DefaultRouter()
router.register('groups', FeesGroupViewSet, basename='fees-group')
router.register('types', FeesTypeViewSet, basename='fees-type')
router.register('assignments', FeesAssignmentViewSet, basename='fees-assignment')
router.register('payments', FeesPaymentViewSet, basename='fees-payment')

urlpatterns = [
    path('', include(router.urls)),
]
