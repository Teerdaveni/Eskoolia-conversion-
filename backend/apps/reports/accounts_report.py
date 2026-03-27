
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum

from apps.core.models import SmAddIncome, SmFeesPayment, SmItemSell, SmAddExpense, SmItemReceive, SmHrPayrollGenerate


class AccountsReportView(APIView):
    def get(self, request, *args, **kwargs):
        school_id = self.request.user.school_id

        total_income = SmAddIncome.objects.filter(school_id=school_id, active_status=1).aggregate(Sum('amount'))['amount__sum'] or 0
        total_income += SmFeesPayment.objects.filter(school_id=school_id, active_status=1).aggregate(Sum('amount'))['amount__sum'] or 0
        total_income += SmItemSell.objects.filter(school_id=school_id, active_status=1).aggregate(Sum('total_paid'))['total_paid__sum'] or 0

        total_expense = SmAddExpense.objects.filter(school_id=school_id, active_status=1).aggregate(Sum('amount'))['amount__sum'] or 0
        total_expense += SmItemReceive.objects.filter(school_id=school_id, active_status=1).aggregate(Sum('total_paid'))['total_paid__sum'] or 0
        total_expense += SmHrPayrollGenerate.objects.filter(school_id=school_id, active_status=1, payroll_status='P').aggregate(Sum('net_salary'))['net_salary__sum'] or 0

        data = {
            'total_income': total_income,
            'total_expense': total_expense,
            'profit': total_income - total_expense
        }

        return Response(data, status=status.HTTP_200_OK)
