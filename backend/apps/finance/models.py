from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models


class ChartOfAccount(models.Model):
    TYPE_ASSET = "asset"
    TYPE_LIABILITY = "liability"
    TYPE_EQUITY = "equity"
    TYPE_INCOME = "income"
    TYPE_EXPENSE = "expense"
    ACCOUNT_TYPE_CHOICES = [
        (TYPE_ASSET, "Asset"),
        (TYPE_LIABILITY, "Liability"),
        (TYPE_EQUITY, "Equity"),
        (TYPE_INCOME, "Income"),
        (TYPE_EXPENSE, "Expense"),
    ]

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="chart_accounts")
    code = models.CharField(max_length=30)
    name = models.CharField(max_length=140)
    account_type = models.CharField(max_length=12, choices=ACCOUNT_TYPE_CHOICES)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chart_of_accounts"
        ordering = ["code", "name"]
        constraints = [
            models.UniqueConstraint(fields=["school", "code"], name="uq_fin_acc_school_code"),
            models.UniqueConstraint(fields=["school", "name"], name="uq_fin_acc_school_name"),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"


class BankAccount(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="bank_accounts")
    name = models.CharField(max_length=120)
    bank_name = models.CharField(max_length=120)
    account_number = models.CharField(max_length=60)
    branch = models.CharField(max_length=120, blank=True)
    current_balance = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0.00"))
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bank_accounts"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["school", "account_number"], name="uq_fin_bank_school_account_no"),
        ]

    def __str__(self):
        return f"{self.name} ({self.account_number})"


class LedgerEntry(models.Model):
    ENTRY_DEBIT = "debit"
    ENTRY_CREDIT = "credit"
    ENTRY_TYPE_CHOICES = [
        (ENTRY_DEBIT, "Debit"),
        (ENTRY_CREDIT, "Credit"),
    ]

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="ledger_entries")
    academic_year = models.ForeignKey(
        "core.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_entries",
    )
    account = models.ForeignKey(ChartOfAccount, on_delete=models.CASCADE, related_name="ledger_entries")
    entry_type = models.CharField(max_length=10, choices=ENTRY_TYPE_CHOICES)
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    entry_date = models.DateField()
    reference_no = models.CharField(max_length=60, blank=True)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ledger_entries_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ledger_entries"
        ordering = ["-entry_date", "-id"]
        indexes = [
            models.Index(fields=["school", "entry_date"], name="idx_fin_led_sch_dt"),
            models.Index(fields=["school", "account"], name="idx_fin_led_sch_acc"),
        ]

    def __str__(self):
        return f"{self.entry_type} {self.amount} ({self.account.code})"


class FundTransfer(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="fund_transfers")
    from_bank = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name="outgoing_transfers")
    to_bank = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name="incoming_transfers")
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.01"))])
    transfer_date = models.DateField()
    reference_no = models.CharField(max_length=60, blank=True)
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="fund_transfers_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "fund_transfers"
        ordering = ["-transfer_date", "-id"]
        indexes = [
            models.Index(fields=["school", "transfer_date"], name="idx_fin_trf_sch_dt"),
        ]

    def __str__(self):
        return f"Transfer {self.amount} from {self.from_bank_id} to {self.to_bank_id}"
