from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers

from .models import BankAccount, ChartOfAccount, FundTransfer, LedgerEntry


class ChartOfAccountSerializer(serializers.ModelSerializer):
    balance = serializers.SerializerMethodField()

    class Meta:
        model = ChartOfAccount
        fields = [
            "id",
            "school",
            "code",
            "name",
            "account_type",
            "description",
            "is_active",
            "balance",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "balance", "created_at", "updated_at"]

    def get_balance(self, obj):
        debit = obj.ledger_entries.filter(entry_type=LedgerEntry.ENTRY_DEBIT).aggregate(total=Sum("amount")).get("total")
        credit = obj.ledger_entries.filter(entry_type=LedgerEntry.ENTRY_CREDIT).aggregate(total=Sum("amount")).get("total")
        return str((debit or Decimal("0.00")) - (credit or Decimal("0.00")))


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = [
            "id",
            "school",
            "name",
            "bank_name",
            "account_number",
            "branch",
            "current_balance",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = [
            "id",
            "school",
            "academic_year",
            "account",
            "entry_type",
            "amount",
            "entry_date",
            "reference_no",
            "description",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        school_id = request.user.school_id if request else None
        account = attrs.get("account") or getattr(self.instance, "account", None)
        academic_year = attrs.get("academic_year") or getattr(self.instance, "academic_year", None)

        if school_id and account and account.school_id != school_id:
            raise serializers.ValidationError({"account": "Selected account does not belong to your school."})
        if school_id and academic_year and academic_year.school_id != school_id:
            raise serializers.ValidationError({"academic_year": "Selected academic year does not belong to your school."})

        return attrs


class FundTransferSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundTransfer
        fields = [
            "id",
            "school",
            "from_bank",
            "to_bank",
            "amount",
            "transfer_date",
            "reference_no",
            "note",
            "created_by",
            "created_at",
        ]
        read_only_fields = ["id", "school", "created_by", "created_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        school_id = request.user.school_id if request else None
        from_bank = attrs.get("from_bank")
        to_bank = attrs.get("to_bank")
        amount = attrs.get("amount", Decimal("0.00"))

        if from_bank and to_bank and from_bank.id == to_bank.id:
            raise serializers.ValidationError({"to_bank": "From and to bank accounts must be different."})
        if school_id and from_bank and from_bank.school_id != school_id:
            raise serializers.ValidationError({"from_bank": "Source bank account does not belong to your school."})
        if school_id and to_bank and to_bank.school_id != school_id:
            raise serializers.ValidationError({"to_bank": "Destination bank account does not belong to your school."})
        if from_bank and amount > from_bank.current_balance:
            raise serializers.ValidationError({"amount": "Insufficient balance in source bank account."})

        return attrs
