from django.db import models


class Incident(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="behaviour_incidents")
    title = models.CharField(max_length=255)
    point = models.IntegerField(default=0)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "behaviour_incidents"
        ordering = ["title"]

    def __str__(self):
        return f"{self.title} ({self.point})"


class AssignedIncident(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="assigned_incidents")
    academic_year = models.ForeignKey(
        "core.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_incidents",
    )
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name="assignments")
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="assigned_incidents")
    record = models.ForeignKey(
        "students.StudentMultiClassRecord",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_incidents",
    )
    point = models.IntegerField(default=0)
    assigned_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="behaviour_assignments_done",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "behaviour_assigned_incidents"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "academic_year", "incident", "student", "record"],
                name="uq_behaviour_assignment_scope",
            ),
        ]


class AssignedIncidentComment(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="assigned_incident_comments")
    assigned_incident = models.ForeignKey(
        AssignedIncident,
        on_delete=models.CASCADE,
        related_name="comments",
    )
    user = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="behaviour_comments")
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "behaviour_assigned_incident_comments"
        ordering = ["-created_at"]


class BehaviourRecordSetting(models.Model):
    school = models.OneToOneField("tenancy.School", on_delete=models.CASCADE, related_name="behaviour_setting")
    student_comment = models.BooleanField(default=False)
    parent_comment = models.BooleanField(default=False)
    student_view = models.BooleanField(default=False)
    parent_view = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "behaviour_record_settings"
