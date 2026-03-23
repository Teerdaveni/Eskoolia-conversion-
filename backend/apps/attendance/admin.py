from django.contrib import admin
from .models import StudentAttendance, StudentAttendanceBulk, SubjectAttendance

admin.site.register(StudentAttendance)
admin.site.register(StudentAttendanceBulk)
admin.site.register(SubjectAttendance)
