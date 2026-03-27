from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.students.models import Student
from apps.exams.models import OnlineExam
from apps.hr.models import Staff
from apps.fees.models import FeesPayment
from apps.finance.models import LedgerEntry
from .serializers import (
    StudentReportRowSerializer,
    ExamReportRowSerializer,
    StaffReportRowSerializer,
    FeesReportRowSerializer,
)

class StudentReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        students = Student.objects.filter(school=request.user.school)
        # Map students to dicts matching StudentReportRowSerializer fields
        data = [
            {
                'id': s.id,
                'class_name': getattr(s, 'class_name', ''),
                'section_name': getattr(s, 'section_name', ''),
                'admission_no': getattr(s, 'admission_no', ''),
                'student_name': getattr(s, 'student_name', ''),
                'father_name': getattr(s, 'father_name', ''),
                'date_of_birth': getattr(s, 'date_of_birth', None),
                'gender': getattr(s, 'gender', ''),
                'student_type': getattr(s, 'student_type', ''),
                'phone': getattr(s, 'phone', ''),
            }
            for s in students
        ]
        serializer = StudentReportRowSerializer(data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ExamReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        exams = OnlineExam.objects.filter(school=request.user.school)
        # Map exams to dicts matching ExamReportRowSerializer fields
        data = [
            {
                'student_id': getattr(e, 'student_id', None),
                'admission_no': getattr(e, 'admission_no', ''),
                'student_name': getattr(e, 'student_name', ''),
                'class_name': getattr(e, 'class_name', ''),
                'section_name': getattr(e, 'section_name', ''),
                'total_marks': getattr(e, 'total_marks', 0),
                'average_gpa': getattr(e, 'average_gpa', 0),
                'result': getattr(e, 'result', ''),
            }
            for e in exams
        ]
        serializer = ExamReportRowSerializer(data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class StaffReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        staff = Staff.objects.filter(school=request.user.school)
        data = [
            {
                'id': s.id,
                'staff_no': getattr(s, 'staff_no', ''),
                'name': getattr(s, 'name', ''),
                'role': getattr(s, 'role', ''),
                'department': getattr(s, 'department', ''),
                'designation': getattr(s, 'designation', ''),
                'phone': getattr(s, 'phone', ''),
                'email': getattr(s, 'email', ''),
                'attendance': getattr(s, 'attendance', ''),
            }
            for s in staff
        ]
        serializer = StaffReportRowSerializer(data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class FeesReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        fees = FeesPayment.objects.filter(school=request.user.school)
        data = [
            {
                'assignment_id': f.id,
                'admission_no': getattr(f, 'admission_no', ''),
                'student_name': getattr(f, 'student_name', ''),
                'class_name': getattr(f, 'class_name', ''),
                'section_name': getattr(f, 'section_name', ''),
                'fees_type': getattr(f, 'fees_type', ''),
                'due_date': getattr(f, 'due_date', None),
                'amount': getattr(f, 'amount', 0),
                'paid': getattr(f, 'paid', 0),
                'balance': getattr(f, 'balance', 0),
                'status': getattr(f, 'status', ''),
            }
            for f in fees
        ]
        serializer = FeesReportRowSerializer(data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class AccountsReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        income = LedgerEntry.objects.filter(school=request.user.school, account__account_type='income')
        expense = LedgerEntry.objects.filter(school=request.user.school, account__account_type='expense')
        
        income_serializer = IncomeReportSerializer(income, many=True)
        expense_serializer = ExpenseReportSerializer(expense, many=True)
        
        return Response({
            'income': income_serializer.data,
            'expense': expense_serializer.data
        }, status=status.HTTP_200_OK)
