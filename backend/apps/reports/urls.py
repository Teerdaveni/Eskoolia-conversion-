from django.urls import path
from .views import (
    StudentReportView,
    ExamReportView,
    StaffReportView,
    FeesReportView,
    AccountsReportView,
)

app_name = 'reports'

urlpatterns = [
    path('student/', StudentReportView.as_view(), name='student_report'),
    path('exam/', ExamReportView.as_view(), name='exam_report'),
    path('staff/', StaffReportView.as_view(), name='staff_report'),
    path('fees/', FeesReportView.as_view(), name='fees_report'),
    path('accounts/', AccountsReportView.as_view(), name='accounts_report'),
]
