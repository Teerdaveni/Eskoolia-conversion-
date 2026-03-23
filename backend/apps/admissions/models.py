from django.db import models

INQUIRY_STATUS_CHOICES = [
    ("new", "New"),
    ("contacted", "Contacted"),
    ("visited", "Visited"),
    ("enrolled", "Enrolled"),
    ("declined", "Declined"),
]


class AdmissionInquiry(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="admission_inquiries")
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=32)
    email = models.EmailField(blank=True)
    class_name = models.CharField(max_length=120)
    note = models.TextField(blank=True)
    status = models.CharField(max_length=32, choices=INQUIRY_STATUS_CHOICES, default="new")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "admission_inquiries"
        ordering = ["-created_at"]


class AdmissionFollowUp(models.Model):
    inquiry = models.ForeignKey(AdmissionInquiry, on_delete=models.CASCADE, related_name="follow_ups")
    author = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admission_follow_ups",
    )
    note = models.TextField()
    status_after = models.CharField(
        max_length=32,
        choices=INQUIRY_STATUS_CHOICES,
        blank=True,
        help_text="Inquiry status set at the time of this follow-up (optional)",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "admission_follow_ups"
        ordering = ["created_at"]
