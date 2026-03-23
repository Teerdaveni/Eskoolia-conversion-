from django.contrib import admin
from .models import School


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "subdomain", "is_active")
    search_fields = ("name", "code", "subdomain")
    list_filter = ("is_active",)
