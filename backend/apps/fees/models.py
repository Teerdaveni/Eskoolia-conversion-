from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


class FeesGroup(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="fees_groups")
    academic_year = models.ForeignKey("core.AcademicYear", on_delete=models.CASCADE, related_name="fees_groups")
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "fees_groups"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["school", "academic_year", "name"], name="uq_fees_group_school_year_name"),
        ]

    def __str__(self):
        return self.name


class FeesType(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="fees_types")
    academic_year = models.ForeignKey("core.AcademicYear", on_delete=models.CASCADE, related_name="fees_types")
    fees_group = models.ForeignKey(FeesGroup, on_delete=models.CASCADE, related_name="fees_types")
    name = models.CharField(max_length=120)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "fees_types"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "academic_year", "fees_group", "name"],
                name="uq_fees_type_school_year_group_name",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.amount})"


class FeesAssignment(models.Model):
    STATUS_UNPAID = "unpaid"
    STATUS_PARTIAL = "partial"
    STATUS_PAID = "paid"
    STATUS_CHOICES = [
        (STATUS_UNPAID, "Unpaid"),
        (STATUS_PARTIAL, "Partial"),
        (STATUS_PAID, "Paid"),
    ]

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="fees_assignments")
    academic_year = models.ForeignKey("core.AcademicYear", on_delete=models.CASCADE, related_name="fees_assignments")
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="fees_assignments")
    fees_type = models.ForeignKey(FeesType, on_delete=models.CASCADE, related_name="assignments")
    due_date = models.DateField()
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_UNPAID)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "fees_assignments"
        ordering = ["due_date", "id"]
        indexes = [
            models.Index(fields=["school", "student", "status"], name="idx_fee_asg_sch_stu_st"),
        ]

    @property
    def net_amount(self) -> Decimal:
        return max(self.amount - self.discount_amount, Decimal("0.00"))

    @property
    def paid_amount(self) -> Decimal:
        value = self.payments.aggregate(total=models.Sum("amount_paid")).get("total")
        return value or Decimal("0.00")

    @property
    def due_amount(self) -> Decimal:
        return max(self.net_amount - self.paid_amount, Decimal("0.00"))

    def __str__(self):
        return f"Assignment #{self.id} - {self.student_id}"


class FeesPayment(models.Model):
    METHOD_CASH = "cash"
    METHOD_BANK = "bank"
    METHOD_ONLINE = "online"
    METHOD_WALLET = "wallet"
    METHOD_CHEQUE = "cheque"
    METHOD_CHOICES = [
        (METHOD_CASH, "Cash"),
        (METHOD_BANK, "Bank"),
        (METHOD_ONLINE, "Online"),
        (METHOD_WALLET, "Wallet"),
        (METHOD_CHEQUE, "Cheque"),
    ]

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="fees_payments")
    assignment = models.ForeignKey(FeesAssignment, on_delete=models.CASCADE, related_name="payments")
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="fees_payments")
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    method = models.CharField(max_length=10, choices=METHOD_CHOICES, default=METHOD_CASH)
    transaction_reference = models.CharField(max_length=150, blank=True)
    note = models.TextField(blank=True)
    paid_at = models.DateTimeField()
    recorded_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="fees_payments_recorded",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "fees_payments"
        ordering = ["-paid_at"]
        indexes = [
            models.Index(fields=["school", "student", "paid_at"], name="idx_fee_pay_sch_stu_dt"),
        ]

    def __str__(self):
        return f"Payment #{self.id} - {self.amount_paid}"
