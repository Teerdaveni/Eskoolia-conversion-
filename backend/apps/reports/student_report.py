from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.models import StudentRecord
from apps.reports.student_report_serializer import StudentReportSerializer


class StudentReportView(APIView):
    def get(self, request, *args, **kwargs):
        school_id = self.request.user.school_id
        class_id = request.query_params.get('class_id')
        section_id = request.query_params.get('section_id')

        records = StudentRecord.objects.filter(school_id=school_id, is_promote=0)

        if class_id:
            records = records.filter(class_id=class_id)
        if section_id:
            records = records.filter(section_id=section_id)

        serializer = StudentReportSerializer(records, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
