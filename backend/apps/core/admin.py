from django.contrib import admin
from .models import AcademicYear, Class, ClassPeriod, Section, Subject, ClassRoom, Vehicle, TransportRoute, AssignVehicle

admin.site.register(AcademicYear)
admin.site.register(Class)
admin.site.register(Section)
admin.site.register(Subject)
admin.site.register(ClassPeriod)
admin.site.register(ClassRoom)

# Transport Module Admin
admin.site.register(Vehicle)
admin.site.register(TransportRoute)
admin.site.register(AssignVehicle)
