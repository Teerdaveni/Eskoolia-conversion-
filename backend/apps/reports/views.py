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
    StudentReportSerializer,
    ExamReportSerializer,
    StaffReportSerializer,
    FeesReportSerializer,
    IncomeReportSerializer,
    ExpenseReportSerializer,
)

class StudentReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        students = Student.objects.filter(school=request.user.school)
        serializer = StudentReportSerializer(students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ExamReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        exams = OnlineExam.objects.filter(school=request.user.school)
        serializer = ExamReportSerializer(exams, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class StaffReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        staff = Staff.objects.filter(school=request.user.school)
        serializer = StaffReportSerializer(staff, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class FeesReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        fees = FeesPayment.objects.filter(school=request.user.school)
        serializer = FeesReportSerializer(fees, many=True)
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
