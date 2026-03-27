from rest_framework import serializers


class StudentReportRowSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    class_name = serializers.CharField(allow_blank=True)
    section_name = serializers.CharField(allow_blank=True)
    admission_no = serializers.CharField()
    student_name = serializers.CharField()
    father_name = serializers.CharField(allow_blank=True)
    date_of_birth = serializers.DateField(allow_null=True)
    gender = serializers.CharField(allow_blank=True)
    student_type = serializers.CharField(allow_blank=True)
    phone = serializers.CharField(allow_blank=True)


class ExamReportRowSerializer(serializers.Serializer):
    student_id = serializers.IntegerField()
    admission_no = serializers.CharField()
    student_name = serializers.CharField()
    class_name = serializers.CharField(allow_blank=True)
    section_name = serializers.CharField(allow_blank=True)
    total_marks = serializers.DecimalField(max_digits=10, decimal_places=2)
    average_gpa = serializers.DecimalField(max_digits=6, decimal_places=2)
    result = serializers.CharField()


class StaffReportRowSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    staff_no = serializers.CharField()
    name = serializers.CharField()
    role = serializers.CharField(allow_blank=True)
    department = serializers.CharField(allow_blank=True)
    designation = serializers.CharField(allow_blank=True)
    phone = serializers.CharField(allow_blank=True)
    email = serializers.CharField(allow_blank=True)
    attendance = serializers.CharField()


class FeesReportRowSerializer(serializers.Serializer):
    assignment_id = serializers.IntegerField()
    admission_no = serializers.CharField()
    student_name = serializers.CharField()
    class_name = serializers.CharField(allow_blank=True)
    section_name = serializers.CharField(allow_blank=True)
    fees_type = serializers.CharField()
    due_date = serializers.DateField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    paid = serializers.DecimalField(max_digits=10, decimal_places=2)
    balance = serializers.DecimalField(max_digits=10, decimal_places=2)
    status = serializers.CharField()


class AccountsReportRowSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    date = serializers.DateField()
    name = serializers.CharField()
    account_head = serializers.CharField()
    amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    entry_type = serializers.CharField()
    reference_no = serializers.CharField(allow_blank=True)
    description = serializers.CharField(allow_blank=True)

