from decimal import Decimal

from rest_framework import serializers

from .models import FeesAssignment, FeesGroup, FeesPayment, FeesType


class FeesGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeesGroup
        fields = [
            "id",
            "school",
            "academic_year",
            "name",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class FeesTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeesType
        fields = [
            "id",
            "school",
            "academic_year",
            "fees_group",
            "name",
            "amount",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        school_id = request.user.school_id if request else None
        group = attrs.get("fees_group") or getattr(self.instance, "fees_group", None)

        if school_id and group and group.school_id != school_id:
            raise serializers.ValidationError({"fees_group": "Selected fees group does not belong to your school."})

        return attrs


class FeesAssignmentSerializer(serializers.ModelSerializer):
    net_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    paid_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    due_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = FeesAssignment
        fields = [
            "id",
            "school",
            "academic_year",
            "student",
            "fees_type",
            "due_date",
            "amount",
            "discount_amount",
            "status",
            "net_amount",
            "paid_amount",
            "due_amount",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "school",
            "status",
            "net_amount",
            "paid_amount",
            "due_amount",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        school_id = request.user.school_id if request else None
        student = attrs.get("student") or getattr(self.instance, "student", None)
        fees_type = attrs.get("fees_type") or getattr(self.instance, "fees_type", None)
        amount = attrs.get("amount") or getattr(self.instance, "amount", Decimal("0.00"))
        discount = attrs.get("discount_amount") or getattr(self.instance, "discount_amount", Decimal("0.00"))

        if discount > amount:
            raise serializers.ValidationError({"discount_amount": "Discount amount cannot exceed total amount."})

        if school_id and student and student.school_id != school_id:
            raise serializers.ValidationError({"student": "Selected student does not belong to your school."})

        if school_id and fees_type and fees_type.school_id != school_id:
            raise serializers.ValidationError({"fees_type": "Selected fee type does not belong to your school."})

        return attrs


class FeesPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FeesPayment
        fields = [
            "id",
            "school",
            "assignment",
            "student",
            "amount_paid",
            "method",
            "transaction_reference",
            "note",
            "paid_at",
            "recorded_by",
            "created_at",
        ]
        read_only_fields = ["id", "school", "recorded_by", "created_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        school_id = request.user.school_id if request else None
        assignment = attrs.get("assignment")
        student = attrs.get("student")
        amount_paid = attrs.get("amount_paid", Decimal("0.00"))

        if assignment and student and assignment.student_id != student.id:
            raise serializers.ValidationError({"student": "Student does not match the selected assignment."})

        if school_id and assignment and assignment.school_id != school_id:
            raise serializers.ValidationError({"assignment": "Selected assignment does not belong to your school."})

        if school_id and student and student.school_id != school_id:
            raise serializers.ValidationError({"student": "Selected student does not belong to your school."})

        if assignment and amount_paid > assignment.due_amount:
            raise serializers.ValidationError({"amount_paid": "Payment amount cannot exceed due amount."})

        return attrs
