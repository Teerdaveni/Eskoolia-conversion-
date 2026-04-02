import re
from rest_framework import serializers
from .models import (
    AcademicYear, Class, ClassPeriod, ClassRoom, Section, Subject, 
    Vehicle, TransportRoute, AssignVehicle,
    ItemCategory, ItemStore, Supplier, Item, ItemReceive, ItemReceiveChild,
    ItemIssue, ItemSell, ItemSellChild
)


class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ["id", "school", "name", "start_date", "end_date", "is_current", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ["id", "school_class", "name", "capacity", "created_at"]
        read_only_fields = ["id", "created_at"]


class ClassSerializer(serializers.ModelSerializer):
    sections = SectionSerializer(many=True, read_only=True)

    class Meta:
        model = Class
        fields = ["id", "school", "name", "numeric_order", "sections", "created_at"]
        read_only_fields = ["id", "school", "sections", "created_at"]


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "school", "name", "code", "subject_type", "created_at"]
        read_only_fields = ["id", "school", "created_at"]


class ClassPeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassPeriod
        fields = ["id", "school", "period", "start_time", "end_time", "period_type", "is_break", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class ClassRoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassRoom
        fields = ["id", "school", "room_no", "capacity", "active_status", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


# ===== TRANSPORT MODULE SERIALIZERS =====
class VehicleSerializer(serializers.ModelSerializer):
    driver_name = serializers.SerializerMethodField()

    def get_driver_name(self, obj):
        if obj.driver:
            return f"{obj.driver.first_name} {obj.driver.last_name}".strip()
        return None

    class Meta:
        model = Vehicle
        fields = ["id", "school", "academic_year", "vehicle_no", "vehicle_model", "made_year", "note", "driver", "driver_name", "active_status", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "academic_year", "created_at", "updated_at"]


class TransportRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportRoute
        fields = ["id", "school", "academic_year", "title", "fare", "active_status", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "academic_year", "created_at", "updated_at"]


class AssignVehicleSerializer(serializers.ModelSerializer):
    vehicle_no = serializers.CharField(source="vehicle.vehicle_no", read_only=True)
    route_title = serializers.CharField(source="route.title", read_only=True)

    class Meta:
        model = AssignVehicle
        fields = ["id", "school", "academic_year", "vehicle", "vehicle_no", "route", "route_title", "active_status", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "academic_year", "created_at", "updated_at"]


# ===== INVENTORY MODULE SERIALIZERS =====
class ItemCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemCategory
        fields = ["id", "school", "title", "description", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class ItemStoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemStore
        fields = ["id", "school", "title", "description", "location", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class SupplierSerializer(serializers.ModelSerializer):
    def validate_phone(self, value):
        phone = str(value or "").strip()
        if not phone:
            return ""
        if not re.fullmatch(r"\d{1,12}", phone):
            raise serializers.ValidationError("Phone number must contain digits only and must not exceed 12 digits.")
        return phone

    class Meta:
        model = Supplier
        fields = ["id", "school", "name", "contact_person", "email", "phone", "address", "city", "country", "tax_id", "payment_terms", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class ItemSerializer(serializers.ModelSerializer):
    category_title = serializers.CharField(source="category.title", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)

    class Meta:
        model = Item
        fields = ["id", "school", "category", "category_title", "item_code", "name", "description", "unit", "quantity", "reorder_level", "unit_cost", "unit_price", "supplier", "supplier_name", "item_photo", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class ItemReceiveChildSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_code = serializers.CharField(source="item.item_code", read_only=True)

    class Meta:
        model = ItemReceiveChild
        fields = ["id", "receive", "item", "item_name", "item_code", "quantity", "unit_cost", "total_cost"]
        read_only_fields = ["id", "total_cost"]


class ItemReceiveSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    line_items = ItemReceiveChildSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source="created_by.first_name", read_only=True)

    class Meta:
        model = ItemReceive
        fields = ["id", "school", "supplier", "supplier_name", "receive_date", "total_amount", "discount", "tax", "payment_status", "paid_amount", "reference_no", "notes", "line_items", "created_by", "created_by_name", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class ItemIssueSerializer(serializers.ModelSerializer):
    store_title = serializers.CharField(source="store.title", read_only=True)
    issued_by_name = serializers.CharField(source="issued_by.first_name", read_only=True)

    class Meta:
        model = ItemIssue
        fields = ["id", "school", "issue_date", "store", "store_title", "subject", "notes", "issued_by", "issued_by_name", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_at", "updated_at"]


class ItemSellChildSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    item_code = serializers.CharField(source="item.item_code", read_only=True)

    class Meta:
        model = ItemSellChild
        fields = ["id", "sell", "item", "item_name", "item_code", "quantity", "unit_price", "total_price"]
        read_only_fields = ["id", "total_price"]


class ItemSellSerializer(serializers.ModelSerializer):
    line_items = ItemSellChildSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source="created_by.first_name", read_only=True)

    class Meta:
        model = ItemSell
        fields = ["id", "school", "sell_date", "total_amount", "discount", "tax", "payment_status", "paid_amount", "reference_no", "notes", "sold_to", "line_items", "created_by", "created_by_name", "created_at", "updated_at"]
        read_only_fields = ["id", "school", "created_at", "updated_at"]
