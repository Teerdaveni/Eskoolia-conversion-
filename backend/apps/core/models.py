from django.db import models


class AcademicYear(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="academic_years")
    name = models.CharField(max_length=64, help_text="e.g. 2025-2026")
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "academic_years"
        ordering = ["-start_date"]
        constraints = [
            models.UniqueConstraint(fields=["school", "name"], name="uq_academic_year_school_name"),
        ]

    def save(self, *args, **kwargs):
        if self.is_current:
            AcademicYear.objects.filter(school=self.school, is_current=True).exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Class(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="classes")
    name = models.CharField(max_length=64, help_text="e.g. Grade 1, Class 10")
    numeric_order = models.PositiveSmallIntegerField(default=0, help_text="For sorting")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "school_classes"
        ordering = ["numeric_order", "name"]
        constraints = [
            models.UniqueConstraint(fields=["school", "name"], name="uq_class_school_name"),
        ]

    def __str__(self):
        return self.name


class Section(models.Model):
    school_class = models.ForeignKey(Class, on_delete=models.CASCADE, related_name="sections")
    name = models.CharField(max_length=32, help_text="e.g. A, B, Red")
    capacity = models.PositiveSmallIntegerField(default=40)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "class_sections"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["school_class", "name"], name="uq_section_class_name"),
        ]

    def __str__(self):
        return f"{self.school_class.name} - {self.name}"


class Subject(models.Model):
    SUBJECT_TYPE_CHOICES = [
        ("compulsory", "Compulsory"),
        ("elective", "Elective"),
        ("optional", "Optional"),
    ]
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="subjects")
    name = models.CharField(max_length=128)
    code = models.CharField(max_length=32, blank=True)
    subject_type = models.CharField(max_length=16, choices=SUBJECT_TYPE_CHOICES, default="compulsory")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "subjects"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["school", "name"], name="uq_subject_school_name"),
        ]

    def __str__(self):
        return self.name


class ClassPeriod(models.Model):
    PERIOD_TYPE_CHOICES = [
        ("class", "Class"),
        ("exam", "Exam"),
    ]

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="class_periods")
    period = models.CharField(max_length=100)
    start_time = models.TimeField()
    end_time = models.TimeField()
    period_type = models.CharField(max_length=10, choices=PERIOD_TYPE_CHOICES, default="class")
    is_break = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "class_periods"
        ordering = ["start_time", "period"]
        constraints = [
            models.UniqueConstraint(fields=["school", "period", "period_type"], name="uq_class_period_school_name_type"),
        ]

    def __str__(self):
        return self.period
