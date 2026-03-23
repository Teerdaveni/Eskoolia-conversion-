from django.contrib import admin
from .models import AdmissionInquiry


@admin.register(AdmissionInquiry)
class AdmissionInquiryAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "phone", "class_name", "status", "school", "created_at")
    search_fields = ("full_name", "phone", "email", "class_name")
    list_filter = ("status", "school")
