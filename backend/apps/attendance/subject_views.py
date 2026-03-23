from calendar import monthrange

from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.academics.models import ClassSubjectAssignment
from apps.core.models import Class, Section, Subject
from apps.students.models import Student

from .models import SubjectAttendance
from .serializers import (
    SubjectAttendanceHolidayRequestSerializer,
    SubjectAttendanceReportSearchRequestSerializer,
    SubjectAttendanceSearchRequestSerializer,
    SubjectAttendanceSerializer,
    SubjectAttendanceStoreRequestSerializer,
)


class SubjectAttendanceTenantMixin:
    permission_classes = [permissions.IsAuthenticated]

    def school_filter(self, request):
        return {} if request.user.is_superuser else {"school_id": request.user.school_id}


class SubjectAttendanceIndexAPIView(SubjectAttendanceTenantMixin, APIView):
    def get(self, request):
        classes = Class.objects.filter(**self.school_filter(request)).order_by("numeric_order", "name")
        return Response({"classes": [{"id": c.id, "class_name": c.name} for c in classes]})


class SubjectAttendanceSearchAPIView(SubjectAttendanceTenantMixin, APIView):
    """Parity with SmSubjectAttendanceController::search."""

    def get(self, request):
        data = {
            "class_id": request.query_params.get("class_id") or request.query_params.get("class"),
            "section_id": request.query_params.get("section_id") or request.query_params.get("section"),
            "subject_id": request.query_params.get("subject_id") or request.query_params.get("subject"),
            "attendance_date": request.query_params.get("attendance_date"),
        }
        serializer = SubjectAttendanceSearchRequestSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data

        class_id = v.get("class_id") or v.get("class")
        section_id = v.get("section_id") or v.get("section")
        subject_id = v.get("subject_id") or v.get("subject")
        attendance_date = v["attendance_date"]

        classes = Class.objects.filter(**self.school_filter(request)).order_by("numeric_order", "name")
        sections = Section.objects.filter(school_class_id=class_id).order_by("name") if class_id else Section.objects.none()

        assignments = ClassSubjectAssignment.objects.filter(
            school_class_id=class_id,
            section_id=section_id,
            **self.school_filter(request),
        ).select_related("subject") if class_id and section_id else ClassSubjectAssignment.objects.none()
        subjects = [{"id": a.subject_id, "subject_name": a.subject.name} for a in assignments]
        if not subjects and class_id and section_id:
            # parity fallback when assignments are missing
            subjects = [{"id": s.id, "subject_name": s.name} for s in Subject.objects.filter(**self.school_filter(request)).order_by("name")]

        students = Student.objects.filter(
            current_class_id=class_id,
            current_section_id=section_id,
            is_active=True,
            **self.school_filter(request),
        ).order_by("roll_no", "id")

        if not students:
            return Response({"detail": "No Result Found"}, status=status.HTTP_404_NOT_FOUND)

        attendance_rows = {
            row.student_id: row
            for row in SubjectAttendance.objects.filter(
                subject_id=subject_id,
                attendance_date=attendance_date,
                class_id=class_id,
                section_id=section_id,
                **self.school_filter(request),
            )
        }

        attendance_type = ""
        if students:
            first = attendance_rows.get(students[0].id)
            if first:
                attendance_type = first.attendance_type

        class_info = Class.objects.filter(id=class_id).first()
        section_info = Section.objects.filter(id=section_id).first()
        subject_info = Subject.objects.filter(id=subject_id).first()

        student_rows = []
        for student in students:
            attendance = attendance_rows.get(student.id)
            student_rows.append(
                {
                    "record_id": student.id,  # parity placeholder for student_record_id
                    "student": student.id,
                    "class": class_id,
                    "section": section_id,
                    "admission_no": student.admission_no,
                    "first_name": student.first_name,
                    "last_name": student.last_name,
                    "roll_no": student.roll_no,
                    "attendance_type": attendance.attendance_type if attendance else None,
                    "note": attendance.notes if attendance else "",
                }
            )

        return Response(
            {
                "classes": [{"id": c.id, "class_name": c.name} for c in classes],
                "sections": [{"id": s.id, "section_name": s.name} for s in sections],
                "subjects": subjects,
                "students": student_rows,
                "attendance_type": attendance_type,
                "input": {
                    "class": class_id,
                    "section": section_id,
                    "subject": subject_id,
                    "attendance_date": attendance_date,
                },
                "search_info": {
                    "class_name": class_info.name if class_info else "",
                    "section_name": section_info.name if section_info else "",
                    "subject_name": subject_info.name if subject_info else "",
                    "date": attendance_date,
                },
            }
        )


class SubjectAttendanceStoreAPIView(SubjectAttendanceTenantMixin, APIView):
    """Parity with SmSubjectAttendanceController::storeAttendance."""

    def post(self, request):
        serializer = SubjectAttendanceStoreRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data

        class_id = v.get("class_id") or v.get("class")
        section_id = v.get("section_id") or v.get("section")
        subject_id = v.get("subject_id") or v.get("subject")
        attendance_date = v.get("date") or v.get("attendance_date")
        attendance_payload = v["attendance"]

        for record_id, student_data in attendance_payload.items():
            student_id = student_data.get("student")
            s_class = student_data.get("class") or class_id
            s_section = student_data.get("section") or section_id
            attendance_type = student_data.get("attendance_type") or "A"
            note = student_data.get("note") or ""

            existing = SubjectAttendance.objects.filter(
                student_id=student_id,
                subject_id=subject_id,
                attendance_date=attendance_date,
                class_id=s_class,
                section_id=s_section,
                student_record_id=int(record_id),
                **self.school_filter(request),
            ).first()

            if existing:
                existing.delete()

            row = SubjectAttendance()
            row.student_record_id = int(record_id)
            row.subject_id = subject_id
            row.student_id = student_id
            row.class_id = s_class
            row.section_id = s_section
            row.attendance_type = attendance_type
            row.notes = note
            row.school = request.user.school
            row.academic_year_id = request.data.get("academic_year_id")
            row.attendance_date = attendance_date
            row.save()

        return Response({"message": "Operation successful"}, status=status.HTTP_200_OK)


class SubjectAttendanceHolidayStoreAPIView(SubjectAttendanceTenantMixin, APIView):
    """Parity with SmSubjectAttendanceController::subjectHolidayStore."""

    def post(self, request):
        serializer = SubjectAttendanceHolidayRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data

        students = Student.objects.filter(
            current_class_id=v["class_id"],
            current_section_id=v["section_id"],
            is_active=True,
            **self.school_filter(request),
        )

        if not students:
            return Response({"detail": "No Result Found"}, status=status.HTTP_404_NOT_FOUND)

        if v["purpose"] == "mark":
            for student in students:
                existing = SubjectAttendance.objects.filter(
                    student_id=student.id,
                    subject_id=v["subject_id"],
                    attendance_date=v["attendance_date"],
                    class_id=v["class_id"],
                    section_id=v["section_id"],
                    student_record_id=student.id,
                    **self.school_filter(request),
                ).first()
                if existing:
                    existing.delete()

                row = SubjectAttendance()
                row.attendance_type = "H"
                row.notes = "Holiday"
                row.attendance_date = v["attendance_date"]
                row.student_id = student.id
                row.subject_id = v["subject_id"]
                row.student_record_id = student.id
                row.class_id = v["class_id"]
                row.section_id = v["section_id"]
                row.school = request.user.school
                row.academic_year_id = request.data.get("academic_year_id")
                row.save()

        else:
            for student in students:
                existing = SubjectAttendance.objects.filter(
                    student_id=student.id,
                    subject_id=v["subject_id"],
                    attendance_date=v["attendance_date"],
                    class_id=v["class_id"],
                    section_id=v["section_id"],
                    student_record_id=student.id,
                    **self.school_filter(request),
                ).first()
                if existing:
                    existing.delete()

        return Response({"message": "Operation successful"}, status=status.HTTP_200_OK)


class SubjectAttendanceReportAPIView(SubjectAttendanceTenantMixin, APIView):
    """Parity with subjectAttendanceReport criteria screen payload."""

    def get(self, request):
        classes = Class.objects.filter(**self.school_filter(request)).order_by("numeric_order", "name")
        return Response({"classes": [{"id": c.id, "class_name": c.name} for c in classes]})


class SubjectAttendanceReportSearchAPIView(SubjectAttendanceTenantMixin, APIView):
    """Parity with subjectAttendanceReportSearch()."""

    def post(self, request):
        serializer = SubjectAttendanceReportSearchRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        v = serializer.validated_data

        class_id = v.get("class_id") or v.get("class")
        section_id = v.get("section_id") or v.get("section")
        month = str(v["month"]).zfill(2)
        year = v["year"]

        assign_subject = ClassSubjectAssignment.objects.filter(
            school_class_id=class_id,
            section_id=section_id,
            **self.school_filter(request),
        ).first()

        if not assign_subject:
            return Response({"detail": "Subject Not Assign"}, status=status.HTTP_400_BAD_REQUEST)

        subject_id = assign_subject.subject_id
        days = monthrange(int(year), int(month))[1]

        students = Student.objects.filter(
            current_class_id=class_id,
            current_section_id=section_id,
            is_active=True,
            **self.school_filter(request),
        ).order_by("roll_no", "id")

        attendances = []
        for student in students:
            rows = SubjectAttendance.objects.filter(
                student_id=student.id,
                student_record_id=student.id,
                attendance_date__year=year,
                attendance_date__month=int(month),
                **self.school_filter(request),
            ).order_by("attendance_date")

            if rows:
                day_map = {r.attendance_date.day: r.attendance_type for r in rows}
                counts = {"P": 0, "L": 0, "A": 0, "F": 0, "H": 0}
                for r in rows:
                    counts[r.attendance_type] = counts.get(r.attendance_type, 0) + 1

                attendances.append(
                    {
                        "student_id": student.id,
                        "name": f"{student.first_name} {student.last_name}".strip(),
                        "admission_no": student.admission_no,
                        "present": counts["P"],
                        "late": counts["L"],
                        "absent": counts["A"],
                        "half_day": counts["F"],
                        "holiday": counts["H"],
                        "days": day_map,
                    }
                )

        return Response(
            {
                "attendances": attendances,
                "days": days,
                "year": year,
                "month": month,
                "class_id": class_id,
                "section_id": section_id,
                "subject_id": subject_id,
                "print_url": f"/api/v1/attendance/subject-attendance/report/print/?class_id={class_id}&section_id={section_id}&month={month}&year={year}",
            }
        )


class SubjectAttendanceReportPrintAPIView(SubjectAttendanceTenantMixin, APIView):
    """API parity substitute for legacy print route."""

    def get(self, request):
        payload = {
            "class": request.query_params.get("class_id") or request.query_params.get("class"),
            "section": request.query_params.get("section_id") or request.query_params.get("section"),
            "month": request.query_params.get("month"),
            "year": request.query_params.get("year"),
        }
        serializer = SubjectAttendanceReportSearchRequestSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        # Return same dataset used by print screen in JSON for Next.js print page.
        return SubjectAttendanceReportSearchAPIView().post(request)
