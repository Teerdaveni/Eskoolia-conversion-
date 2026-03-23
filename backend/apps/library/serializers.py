from rest_framework import serializers

from .models import Book, BookCategory, BookIssue, LibraryMember


class BookCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BookCategory
        fields = ["id", "school", "name", "description", "is_active", "created_at"]
        read_only_fields = ["id", "school", "created_at"]


class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = [
            "id",
            "school",
            "category",
            "title",
            "author",
            "isbn",
            "publisher",
            "quantity",
            "available_quantity",
            "rack",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "created_at", "updated_at"]

    def validate(self, attrs):
        category = attrs.get("category") or getattr(self.instance, "category", None)
        quantity = attrs.get("quantity")
        available = attrs.get("available_quantity")
        request = self.context.get("request")
        school_id = request.user.school_id if request else None

        if school_id and category and category.school_id != school_id:
            raise serializers.ValidationError({"category": "Selected category does not belong to your school."})
        if quantity is not None and available is not None and available > quantity:
            raise serializers.ValidationError({"available_quantity": "Available quantity cannot exceed total quantity."})
        return attrs


class LibraryMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryMember
        fields = ["id", "school", "member_type", "student", "staff", "card_no", "is_active", "created_at"]
        read_only_fields = ["id", "school", "created_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        school_id = request.user.school_id if request else None
        member_type = attrs.get("member_type") or getattr(self.instance, "member_type", None)
        student = attrs.get("student") or getattr(self.instance, "student", None)
        staff = attrs.get("staff") or getattr(self.instance, "staff", None)

        if member_type == LibraryMember.MEMBER_STUDENT and not student:
            raise serializers.ValidationError({"student": "Student is required for student member type."})
        if member_type == LibraryMember.MEMBER_STAFF and not staff:
            raise serializers.ValidationError({"staff": "Staff is required for staff member type."})
        if member_type == LibraryMember.MEMBER_STUDENT and staff:
            raise serializers.ValidationError({"staff": "Staff must be empty for student member type."})
        if member_type == LibraryMember.MEMBER_STAFF and student:
            raise serializers.ValidationError({"student": "Student must be empty for staff member type."})

        if school_id and student and student.school_id != school_id:
            raise serializers.ValidationError({"student": "Selected student does not belong to your school."})
        if school_id and staff and staff.school_id != school_id:
            raise serializers.ValidationError({"staff": "Selected staff does not belong to your school."})

        return attrs


class BookIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookIssue
        fields = [
            "id",
            "school",
            "book",
            "member",
            "issue_date",
            "due_date",
            "return_date",
            "fine_amount",
            "status",
            "issued_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "school", "issued_by", "created_at", "updated_at"]

    def validate(self, attrs):
        request = self.context.get("request")
        school_id = request.user.school_id if request else None
        issue_date = attrs.get("issue_date") or getattr(self.instance, "issue_date", None)
        due_date = attrs.get("due_date") or getattr(self.instance, "due_date", None)
        book = attrs.get("book") or getattr(self.instance, "book", None)
        member = attrs.get("member") or getattr(self.instance, "member", None)
        status = attrs.get("status", getattr(self.instance, "status", BookIssue.STATUS_ISSUED))

        if issue_date and due_date and due_date < issue_date:
            raise serializers.ValidationError({"due_date": "Due date cannot be earlier than issue date."})

        if school_id and book and book.school_id != school_id:
            raise serializers.ValidationError({"book": "Selected book does not belong to your school."})
        if school_id and member and member.school_id != school_id:
            raise serializers.ValidationError({"member": "Selected member does not belong to your school."})

        if book and status == BookIssue.STATUS_ISSUED:
            current_available = book.available_quantity
            if self.instance and self.instance.book_id == book.id and self.instance.status == BookIssue.STATUS_ISSUED:
                current_available += 1
            if current_available <= 0:
                raise serializers.ValidationError({"book": "No available copies for this book."})

        return attrs
