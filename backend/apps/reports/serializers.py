from rest_framework import serializers


class BaseReportFilterSerializer(serializers.Serializer):
    page = serializers.IntegerField(required=False, min_value=1, default=1)
    page_size = serializers.IntegerField(required=False, min_value=1, max_value=200, default=20)
    export = serializers.ChoiceField(required=False, choices=["csv", "excel", "pdf"])
    keyword = serializers.CharField(required=False, allow_blank=True)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    class_id = serializers.IntegerField(required=False, min_value=1)
    section_id = serializers.IntegerField(required=False, min_value=1)
    student_id = serializers.IntegerField(required=False, min_value=1)


class AccountsFeeCollectionFilterSerializer(BaseReportFilterSerializer):
    method = serializers.CharField(required=False, allow_blank=True)
    status = serializers.CharField(required=False, allow_blank=True)


class AccountsExpenseFilterSerializer(BaseReportFilterSerializer):
    account_id = serializers.IntegerField(required=False, min_value=1)


class StudentListFilterSerializer(BaseReportFilterSerializer):
    gender = serializers.CharField(required=False, allow_blank=True)
    is_disabled = serializers.BooleanField(required=False)


class StudentAttendanceFilterSerializer(BaseReportFilterSerializer):
    attendance_type = serializers.CharField(required=False, allow_blank=True)


class ExamMarksFilterSerializer(BaseReportFilterSerializer):
    exam_term_id = serializers.IntegerField(required=False, min_value=1)
    subject_id = serializers.IntegerField(required=False, min_value=1)


class ExamResultSummaryFilterSerializer(BaseReportFilterSerializer):
    exam_term_id = serializers.IntegerField(required=False, min_value=1)


class LibraryIssueReturnFilterSerializer(BaseReportFilterSerializer):
    status = serializers.CharField(required=False, allow_blank=True)
    member_type = serializers.CharField(required=False, allow_blank=True)
    book_id = serializers.IntegerField(required=False, min_value=1)


class AcademicClassPerformanceFilterSerializer(BaseReportFilterSerializer):
    exam_term_id = serializers.IntegerField(required=False, min_value=1)
    subject_id = serializers.IntegerField(required=False, min_value=1)


class HrStaffAttendanceFilterSerializer(BaseReportFilterSerializer):
    department_id = serializers.IntegerField(required=False, min_value=1)
    designation_id = serializers.IntegerField(required=False, min_value=1)
    attendance_type = serializers.CharField(required=False, allow_blank=True)
    staff_id = serializers.IntegerField(required=False, min_value=1)


class TransportStudentFilterSerializer(BaseReportFilterSerializer):
    route_id = serializers.IntegerField(required=False, min_value=1)
    vehicle_id = serializers.IntegerField(required=False, min_value=1)


class InventoryStockFilterSerializer(BaseReportFilterSerializer):
    category_id = serializers.IntegerField(required=False, min_value=1)
    supplier_id = serializers.IntegerField(required=False, min_value=1)
    low_stock_only = serializers.BooleanField(required=False)


class BehaviourIncidentFilterSerializer(BaseReportFilterSerializer):
    incident_id = serializers.IntegerField(required=False, min_value=1)


class AccountsFeeCollectionRowSerializer(serializers.Serializer):
    payment_id = serializers.IntegerField()
    paid_at = serializers.DateTimeField()
    admission_no = serializers.CharField(allow_blank=True)
    student_name = serializers.CharField(allow_blank=True)
    class_name = serializers.CharField(allow_blank=True)
    section_name = serializers.CharField(allow_blank=True)
    fees_type = serializers.CharField(allow_blank=True)
    amount_paid = serializers.DecimalField(max_digits=14, decimal_places=2)
    method = serializers.CharField(allow_blank=True)
    assignment_status = serializers.CharField(allow_blank=True)
    transaction_reference = serializers.CharField(allow_blank=True)


class AccountsExpenseRowSerializer(serializers.Serializer):
    ledger_id = serializers.IntegerField()
    entry_date = serializers.DateField()
    account_code = serializers.CharField(allow_blank=True)
    account_name = serializers.CharField(allow_blank=True)
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    reference_no = serializers.CharField(allow_blank=True)
    description = serializers.CharField(allow_blank=True)
    created_by = serializers.CharField(allow_blank=True)


class StudentListRowSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    admission_no = serializers.CharField(allow_blank=True)
    roll_no = serializers.CharField(allow_blank=True)
    student_name = serializers.CharField(allow_blank=True)
    class_name = serializers.CharField(allow_blank=True)
    section_name = serializers.CharField(allow_blank=True)
    guardian_name = serializers.CharField(allow_blank=True)
    phone = serializers.CharField(allow_blank=True)
    gender = serializers.CharField(allow_blank=True)
    is_disabled = serializers.BooleanField()


class StudentAttendanceRowSerializer(serializers.Serializer):
    attendance_id = serializers.IntegerField()
    attendance_date = serializers.DateField()
    attendance_type = serializers.CharField(allow_blank=True)
    admission_no = serializers.CharField(allow_blank=True)
    student_name = serializers.CharField(allow_blank=True)
    class_name = serializers.CharField(allow_blank=True)
    section_name = serializers.CharField(allow_blank=True)
    notes = serializers.CharField(allow_blank=True)


class ExamMarksRowSerializer(serializers.Serializer):
    register_id = serializers.IntegerField()
    exam_term = serializers.CharField(allow_blank=True)
    class_name = serializers.CharField(allow_blank=True)
    section_name = serializers.CharField(allow_blank=True)
    subject_name = serializers.CharField(allow_blank=True)
    admission_no = serializers.CharField(allow_blank=True)
    student_name = serializers.CharField(allow_blank=True)
    total_marks = serializers.DecimalField(max_digits=14, decimal_places=2)
    gpa = serializers.DecimalField(max_digits=8, decimal_places=2)
    grade = serializers.CharField(allow_blank=True)
    is_absent = serializers.BooleanField()


class ExamResultSummaryRowSerializer(serializers.Serializer):
    exam_term = serializers.CharField(allow_blank=True)
    class_name = serializers.CharField(allow_blank=True)
    section_name = serializers.CharField(allow_blank=True)
    total_students = serializers.IntegerField()
    present_students = serializers.IntegerField()
    absent_students = serializers.IntegerField()
    pass_students = serializers.IntegerField()
    fail_students = serializers.IntegerField()
    avg_marks = serializers.DecimalField(max_digits=14, decimal_places=2)
    avg_gpa = serializers.DecimalField(max_digits=8, decimal_places=2)


class LibraryIssueReturnRowSerializer(serializers.Serializer):
    issue_id = serializers.IntegerField()
    issue_date = serializers.DateField()
    due_date = serializers.DateField()
    return_date = serializers.DateField(allow_null=True)
    status = serializers.CharField(allow_blank=True)
    book_title = serializers.CharField(allow_blank=True)
    member_type = serializers.CharField(allow_blank=True)
    member_name = serializers.CharField(allow_blank=True)
    fine_amount = serializers.DecimalField(max_digits=10, decimal_places=2)


class AcademicClassPerformanceRowSerializer(serializers.Serializer):
    class_name = serializers.CharField(allow_blank=True)
    section_name = serializers.CharField(allow_blank=True)
    subject_name = serializers.CharField(allow_blank=True)
    students_count = serializers.IntegerField()
    avg_marks = serializers.DecimalField(max_digits=14, decimal_places=2)
    avg_gpa = serializers.DecimalField(max_digits=8, decimal_places=2)


class HrStaffAttendanceRowSerializer(serializers.Serializer):
    attendance_id = serializers.IntegerField()
    attendance_date = serializers.DateField()
    attendance_type = serializers.CharField(allow_blank=True)
    staff_no = serializers.CharField(allow_blank=True)
    staff_name = serializers.CharField(allow_blank=True)
    department = serializers.CharField(allow_blank=True)
    designation = serializers.CharField(allow_blank=True)
    note = serializers.CharField(allow_blank=True)


class TransportStudentRowSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    admission_no = serializers.CharField(allow_blank=True)
    student_name = serializers.CharField(allow_blank=True)
    class_name = serializers.CharField(allow_blank=True)
    section_name = serializers.CharField(allow_blank=True)
    route_name = serializers.CharField(allow_blank=True)
    fare = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    vehicle_no = serializers.CharField(allow_blank=True)
    vehicle_model = serializers.CharField(allow_blank=True)


class InventoryStockRowSerializer(serializers.Serializer):
    item_id = serializers.IntegerField()
    item_code = serializers.CharField(allow_blank=True)
    item_name = serializers.CharField(allow_blank=True)
    category = serializers.CharField(allow_blank=True)
    supplier = serializers.CharField(allow_blank=True)
    quantity = serializers.DecimalField(max_digits=12, decimal_places=2)
    reorder_level = serializers.DecimalField(max_digits=12, decimal_places=2)
    stock_status = serializers.CharField(allow_blank=True)
    unit_cost = serializers.DecimalField(max_digits=10, decimal_places=2)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2)


class BehaviourIncidentRowSerializer(serializers.Serializer):
    assignment_id = serializers.IntegerField()
    assigned_at = serializers.DateTimeField()
    incident = serializers.CharField(allow_blank=True)
    point = serializers.IntegerField()
    admission_no = serializers.CharField(allow_blank=True)
    student_name = serializers.CharField(allow_blank=True)
    class_name = serializers.CharField(allow_blank=True)
    section_name = serializers.CharField(allow_blank=True)
    assigned_by = serializers.CharField(allow_blank=True)

