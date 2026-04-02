from django.contrib import admin

from .models import CommunicationNotification, CommunicationPreference, EmailMessageLog, EmailSmsLog, HolidayCalendar, InAppMessage, NoticeBoard


@admin.register(CommunicationPreference)
class CommunicationPreferenceAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "allow_email", "allow_in_app", "allow_notifications", "mute_all", "digest_frequency"]
    search_fields = ["user__username", "user__first_name", "user__last_name", "user__email"]
    list_filter = ["allow_email", "allow_in_app", "allow_notifications", "mute_all", "digest_frequency"]


@admin.register(CommunicationNotification)
class CommunicationNotificationAdmin(admin.ModelAdmin):
    list_display = ["id", "recipient", "notification_type", "is_read", "created_at"]
    search_fields = ["title", "body", "recipient__username", "recipient__email"]
    list_filter = ["notification_type", "is_read", "created_at"]


@admin.register(InAppMessage)
class InAppMessageAdmin(admin.ModelAdmin):
    list_display = ["id", "sender", "recipient", "category", "is_read", "created_at"]
    search_fields = ["subject", "body", "sender__username", "recipient__username"]
    list_filter = ["category", "is_read", "created_at"]


@admin.register(EmailMessageLog)
class EmailMessageLogAdmin(admin.ModelAdmin):
    list_display = ["id", "to_email", "status", "created_by", "sent_at", "created_at"]
    search_fields = ["to_email", "subject", "body"]
    list_filter = ["status", "created_at", "sent_at"]


@admin.register(NoticeBoard)
class NoticeBoardAdmin(admin.ModelAdmin):
    list_display = ["id", "notice_title", "is_published", "publish_on", "created_by", "created_at"]
    search_fields = ["notice_title", "notice_message"]
    list_filter = ["is_published", "publish_on", "notice_date", "created_at"]


@admin.register(EmailSmsLog)
class EmailSmsLogAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "send_to", "send_through", "created_by", "send_date"]
    search_fields = ["title", "description"]
    list_filter = ["send_to", "send_through", "send_date", "created_at"]


@admin.register(HolidayCalendar)
class HolidayCalendarAdmin(admin.ModelAdmin):
    list_display = ["id", "holiday_title", "holiday_date", "end_date", "is_active", "created_by"]
    search_fields = ["holiday_title", "description"]
    list_filter = ["is_active", "holiday_date", "end_date", "created_at"]
