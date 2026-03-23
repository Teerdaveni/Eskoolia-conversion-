from django.db import models


class StudentCategory(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="student_categories")
    name = models.CharField(max_length=80)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "student_categories"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["school", "name"], name="uq_student_category_school_name"),
        ]

    def __str__(self):
        return self.name


class StudentGroup(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="student_groups")
    name = models.CharField(max_length=80)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "student_groups"
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["school", "name"], name="uq_student_group_school_name"),
        ]

    def __str__(self):
        return self.name


class Guardian(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="guardians")
    full_name = models.CharField(max_length=120)
    relation = models.CharField(max_length=50, help_text="e.g. Father, Mother, Uncle")
    phone = models.CharField(max_length=32)
    email = models.EmailField(blank=True)
    occupation = models.CharField(max_length=120, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "guardians"
        ordering = ["full_name"]

    def __str__(self):
        return f"{self.full_name} ({self.relation})"


class Student(models.Model):
    GENDER_CHOICES = [
        ("male", "Male"),
        ("female", "Female"),
        ("other", "Other"),
    ]

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="students")
    admission_no = models.CharField(max_length=40)
    roll_no = models.CharField(max_length=40, blank=True)
    first_name = models.CharField(max_length=80)
    last_name = models.CharField(max_length=80, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    blood_group = models.CharField(max_length=5, blank=True)
    category = models.ForeignKey(
        StudentCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )
    student_group = models.ForeignKey(
        StudentGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )
    guardian = models.ForeignKey(
        Guardian,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )
    current_class = models.ForeignKey(
        "core.Class",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )
    current_section = models.ForeignKey(
        "core.Section",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )
    admission_inquiry = models.ForeignKey(
        "admissions.AdmissionInquiry",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )
    is_disabled = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "students"
        ordering = ["first_name", "last_name"]
        constraints = [
            models.UniqueConstraint(fields=["school", "admission_no"], name="uq_student_school_admission_no"),
        ]

    def __str__(self):
        full_name = f"{self.first_name} {self.last_name}".strip()
        return f"{full_name} ({self.admission_no})"


class StudentDocument(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="documents")
    title = models.CharField(max_length=150)
    file_url = models.URLField(max_length=400)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "student_documents"
        ordering = ["-uploaded_at"]


class StudentTransferHistory(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="transfer_history")
    from_school = models.ForeignKey(
        "tenancy.School",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student_transfers_from",
    )
    to_school = models.ForeignKey(
        "tenancy.School",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student_transfers_to",
    )
    note = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "student_transfer_history"
        ordering = ["-created_at"]


class StudentMultiClassRecord(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="multi_class_records")
    school_class = models.ForeignKey("core.Class", on_delete=models.CASCADE, related_name="multi_class_students")
    section = models.ForeignKey(
        "core.Section",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="multi_class_students",
    )
    roll_no = models.CharField(max_length=40, blank=True)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "student_multi_class_records"
        ordering = ["student_id", "-is_default", "school_class_id", "section_id", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["student", "school_class", "section", "roll_no"],
                name="uq_student_multiclass_unique_record",
            ),
        ]

    def __str__(self):
        section = self.section.name if self.section else "-"
        return f"{self.student_id}:{self.school_class_id}:{section}"


class StudentPromotionHistory(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="promotion_history")
    from_class = models.ForeignKey(
        "core.Class",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="promotions_from_class",
    )
    from_section = models.ForeignKey(
        "core.Section",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="promotions_from_section",
    )
    to_class = models.ForeignKey(
        "core.Class",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="promotions_to_class",
    )
    to_section = models.ForeignKey(
        "core.Section",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="promotions_to_section",
    )
    from_academic_year = models.ForeignKey(
        "core.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="promotions_from_year",
    )
    to_academic_year = models.ForeignKey(
        "core.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="promotions_to_year",
    )
    note = models.TextField(blank=True)
    promoted_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="student_promotions_done",
    )
    promoted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "student_promotion_history"
        ordering = ["-promoted_at"]
