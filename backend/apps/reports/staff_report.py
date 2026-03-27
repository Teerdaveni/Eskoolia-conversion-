
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.models import SmStaff
from apps.reports.serializers import StaffReportSerializer


class StaffReportView(APIView):
    def get(self, request, *args, **kwargs):
        school_id = self.request.user.school_id
        staff = SmStaff.objects.filter(school_id=school_id, active_status=1)
        serializer = StaffReportSerializer(staff, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
