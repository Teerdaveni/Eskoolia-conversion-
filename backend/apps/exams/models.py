from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class ExamType(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="exam_types")
    academic_year = models.ForeignKey(
        "core.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_types",
    )
    title = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    active_status = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    is_average = models.BooleanField(default=False)
    average_mark = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "exam_types"
        ordering = ["title"]
        constraints = [
            models.UniqueConstraint(fields=["school", "academic_year", "title"], name="uq_exam_type_school_year_title"),
        ]

    def __str__(self):
        return self.title


class Exam(models.Model):
    STATUS_DRAFT = "draft"
    STATUS_PUBLISHED = "published"
    STATUS_CLOSED = "closed"
    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_PUBLISHED, "Published"),
        (STATUS_CLOSED, "Closed"),
    ]

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="exams")
    academic_year = models.ForeignKey("core.AcademicYear", on_delete=models.CASCADE, related_name="exams")
    exam_type = models.ForeignKey(ExamType, on_delete=models.CASCADE, related_name="exams")
    name = models.CharField(max_length=150)
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=STATUS_DRAFT)
    is_result_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    published_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="published_exam_results",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "exams"
        ordering = ["-start_date", "name"]
        constraints = [
            models.UniqueConstraint(fields=["school", "academic_year", "name"], name="uq_exam_school_year_name"),
        ]

    def __str__(self):
        return self.name


class ExamGradeScale(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="exam_grade_scales")
    name = models.CharField(max_length=5)
    min_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00")), MaxValueValidator(Decimal("100.00"))],
    )
    max_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00")), MaxValueValidator(Decimal("100.00"))],
    )
    gpa = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("0.00"))
    is_fail = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "exam_grade_scales"
        ordering = ["-min_percent"]
        constraints = [
            models.UniqueConstraint(fields=["school", "name"], name="uq_exam_grade_scale_school_name"),
        ]

    def __str__(self):
        return self.name


class ExamSchedule(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="exam_schedules")
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="schedules")
    school_class = models.ForeignKey("core.Class", on_delete=models.CASCADE, related_name="exam_schedules")
    section = models.ForeignKey(
        "core.Section",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_schedules",
    )
    subject = models.ForeignKey("core.Subject", on_delete=models.CASCADE, related_name="exam_schedules")
    exam_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=80, blank=True)
    full_marks = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("100.00"))
    pass_marks = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("33.00"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "exam_schedules"
        ordering = ["exam_date", "start_time"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "exam", "school_class", "section", "subject"],
                name="uq_exam_schedule_scope",
            ),
        ]


class ExamMark(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="exam_marks")
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name="marks")
    schedule = models.ForeignKey(ExamSchedule, on_delete=models.CASCADE, related_name="marks")
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="exam_marks")
    obtained_marks = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.00")), MaxValueValidator(Decimal("1000.00"))],
    )
    absent = models.BooleanField(default=False)
    note = models.TextField(blank=True)
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_marks_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "exam_marks"
        ordering = ["student_id"]
        constraints = [
            models.UniqueConstraint(fields=["schedule", "student"], name="uq_exam_mark_schedule_student"),
        ]


class ExamSetup(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="exam_setups")
    academic_year = models.ForeignKey(
        "core.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_setups",
    )
    exam_term = models.ForeignKey(ExamType, on_delete=models.CASCADE, related_name="setup_items")
    school_class = models.ForeignKey("core.Class", on_delete=models.CASCADE, related_name="exam_setups")
    section = models.ForeignKey("core.Section", on_delete=models.CASCADE, related_name="exam_setups")
    subject = models.ForeignKey("core.Subject", on_delete=models.CASCADE, related_name="exam_setups")
    exam_title = models.CharField(max_length=120)
    exam_mark = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_setups_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "exam_setups"
        ordering = ["id"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "exam_term", "school_class", "section", "subject", "exam_title"],
                name="uq_exam_setup_scope_title",
            ),
        ]


class ExamRoutine(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="exam_routines")
    academic_year = models.ForeignKey(
        "core.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_routines",
    )
    exam_term = models.ForeignKey(ExamType, on_delete=models.CASCADE, related_name="routines")
    school_class = models.ForeignKey("core.Class", on_delete=models.CASCADE, related_name="exam_routines")
    section = models.ForeignKey(
        "core.Section",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_routines",
    )
    subject = models.ForeignKey("core.Subject", on_delete=models.CASCADE, related_name="exam_routines")
    teacher = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_routines",
    )
    exam_period = models.ForeignKey(
        "core.ClassPeriod",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_routines",
    )
    exam_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=80, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "exam_routines"
        ordering = ["exam_date", "start_time", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "exam_term", "school_class", "section", "subject"],
                name="uq_exam_routine_scope_subject",
            ),
            models.UniqueConstraint(
                fields=["school", "exam_term", "school_class", "section", "exam_date", "exam_period"],
                name="uq_exam_routine_scope_date_period",
            ),
        ]


class ExamAttendance(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="exam_attendances")
    academic_year = models.ForeignKey(
        "core.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_attendances",
    )
    exam_term = models.ForeignKey(ExamType, on_delete=models.CASCADE, related_name="attendances")
    school_class = models.ForeignKey("core.Class", on_delete=models.CASCADE, related_name="exam_attendances")
    section = models.ForeignKey(
        "core.Section",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_attendances",
    )
    subject = models.ForeignKey("core.Subject", on_delete=models.CASCADE, related_name="exam_attendances")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "exam_attendances"
        ordering = ["-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "exam_term", "school_class", "section", "subject"],
                name="uq_exam_attendance_scope",
            ),
        ]


class ExamAttendanceChild(models.Model):
    ATTENDANCE_CHOICES = [
        ("P", "Present"),
        ("A", "Absent"),
    ]

    attendance = models.ForeignKey(ExamAttendance, on_delete=models.CASCADE, related_name="children")
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="exam_attendance_children")
    student_record_id = models.BigIntegerField(null=True, blank=True)
    school_class = models.ForeignKey("core.Class", on_delete=models.CASCADE, related_name="exam_attendance_children")
    section = models.ForeignKey(
        "core.Section",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_attendance_children",
    )
    attendance_type = models.CharField(max_length=1, choices=ATTENDANCE_CHOICES, default="P")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "exam_attendance_children"
        ordering = ["student_id"]
        constraints = [
            models.UniqueConstraint(
                fields=["attendance", "student"],
                name="uq_exam_attendance_child_attendance_student",
            ),
        ]


class ExamMarkRegister(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="exam_mark_registers")
    academic_year = models.ForeignKey(
        "core.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_mark_registers",
    )
    exam_term = models.ForeignKey(ExamType, on_delete=models.CASCADE, related_name="mark_registers")
    school_class = models.ForeignKey("core.Class", on_delete=models.CASCADE, related_name="exam_mark_registers")
    section = models.ForeignKey(
        "core.Section",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_mark_registers",
    )
    subject = models.ForeignKey("core.Subject", on_delete=models.CASCADE, related_name="exam_mark_registers")
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="exam_mark_registers")
    student_record_id = models.BigIntegerField(null=True, blank=True)
    is_absent = models.BooleanField(default=False)
    total_marks = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    total_gpa_point = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("0.00"))
    total_gpa_grade = models.CharField(max_length=10, blank=True)
    teacher_remarks = models.CharField(max_length=255, blank=True)
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_mark_registers_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "exam_mark_registers"
        ordering = ["student_id", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "exam_term", "school_class", "section", "subject", "student"],
                name="uq_exam_mark_register_scope_student",
            ),
        ]


class ExamMarkRegisterPart(models.Model):
    register = models.ForeignKey(ExamMarkRegister, on_delete=models.CASCADE, related_name="parts")
    exam_setup = models.ForeignKey(ExamSetup, on_delete=models.CASCADE, related_name="mark_register_parts")
    marks = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "exam_mark_register_parts"
        ordering = ["exam_setup_id", "id"]
        constraints = [
            models.UniqueConstraint(
                fields=["register", "exam_setup"],
                name="uq_exam_mark_register_part_register_setup",
            ),
        ]


class ExamResultPublish(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="exam_result_publishes")
    academic_year = models.ForeignKey(
        "core.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_result_publishes",
    )
    exam_term = models.ForeignKey(ExamType, on_delete=models.CASCADE, related_name="result_publishes")
    school_class = models.ForeignKey("core.Class", on_delete=models.CASCADE, related_name="exam_result_publishes")
    section = models.ForeignKey(
        "core.Section",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_result_publishes",
    )
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    published_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="exam_result_publishes",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "exam_result_publishes"
        ordering = ["-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "exam_term", "school_class", "section"],
                name="uq_exam_result_publish_scope",
            ),
        ]


class OnlineExam(models.Model):
    STATUS_DRAFT = 0
    STATUS_PUBLISHED = 1
    STATUS_ARCHIVED = 2

    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="online_exams")
    academic_year = models.ForeignKey(
        "core.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="online_exams",
    )
    title = models.CharField(max_length=150)
    school_class = models.ForeignKey("core.Class", on_delete=models.CASCADE, related_name="online_exams")
    section = models.ForeignKey("core.Section", on_delete=models.CASCADE, related_name="online_exams")
    subject = models.ForeignKey("core.Subject", on_delete=models.CASCADE, related_name="online_exams")
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    end_date_time = models.DateTimeField()
    percentage = models.DecimalField(max_digits=6, decimal_places=2, default=Decimal("0.00"))
    instruction = models.TextField(blank=True)
    status = models.PositiveSmallIntegerField(default=STATUS_DRAFT)
    auto_mark = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "online_exams"
        ordering = ["-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["school", "school_class", "section", "subject", "title"],
                name="uq_online_exam_scope_title",
            ),
        ]


class OnlineExamTake(models.Model):
    online_exam = models.ForeignKey(OnlineExam, on_delete=models.CASCADE, related_name="takes")
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="online_exam_takes")
    total_marks = models.DecimalField(max_digits=8, decimal_places=2, default=Decimal("0.00"))
    status = models.PositiveSmallIntegerField(default=0)
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "online_exam_takes"
        ordering = ["student_id"]
        constraints = [
            models.UniqueConstraint(
                fields=["online_exam", "student"],
                name="uq_online_exam_take_exam_student",
            ),
        ]


class AdmitCardSetting(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="admit_card_settings")
    academic_year = models.ForeignKey(
        "core.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admit_card_settings",
    )
    admit_layout = models.PositiveSmallIntegerField(default=1)
    student_photo = models.BooleanField(default=True)
    student_name = models.BooleanField(default=True)
    admission_no = models.BooleanField(default=True)
    class_section = models.BooleanField(default=True)
    exam_name = models.BooleanField(default=True)
    academic_year_label = models.BooleanField(default=True)
    principal_signature = models.BooleanField(default=False)
    guardian_name = models.BooleanField(default=False)
    class_teacher_signature = models.BooleanField(default=False)
    school_address = models.BooleanField(default=False)
    student_download = models.BooleanField(default=True)
    parent_download = models.BooleanField(default=True)
    student_notification = models.BooleanField(default=False)
    parent_notification = models.BooleanField(default=False)
    admit_sub_title = models.CharField(max_length=190, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "admit_card_settings"
        ordering = ["-id"]
        constraints = [
            models.UniqueConstraint(fields=["school", "academic_year"], name="uq_admit_card_setting_scope"),
        ]


class AdmitCard(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="admit_cards")
    academic_year = models.ForeignKey(
        "core.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admit_cards",
    )
    exam_term = models.ForeignKey(ExamType, on_delete=models.CASCADE, related_name="admit_cards")
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="admit_cards")
    student_record_id = models.BigIntegerField(null=True, blank=True)
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="admit_cards_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "admit_cards"
        ordering = ["-id"]
        constraints = [
            models.UniqueConstraint(fields=["school", "academic_year", "exam_term", "student"], name="uq_admit_card_scope"),
        ]


class SeatPlanSetting(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="seat_plan_settings")
    academic_year = models.ForeignKey(
        "core.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="seat_plan_settings",
    )
    school_name = models.BooleanField(default=True)
    student_photo = models.BooleanField(default=True)
    student_name = models.BooleanField(default=True)
    roll_no = models.BooleanField(default=True)
    admission_no = models.BooleanField(default=True)
    class_section = models.BooleanField(default=True)
    exam_name = models.BooleanField(default=True)
    academic_year_label = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "seat_plan_settings"
        ordering = ["-id"]
        constraints = [
            models.UniqueConstraint(fields=["school", "academic_year"], name="uq_seat_plan_setting_scope"),
        ]


class SeatPlan(models.Model):
    school = models.ForeignKey("tenancy.School", on_delete=models.CASCADE, related_name="seat_plans")
    academic_year = models.ForeignKey(
        "core.AcademicYear",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="seat_plans",
    )
    exam_term = models.ForeignKey(ExamType, on_delete=models.CASCADE, related_name="seat_plans")
    student = models.ForeignKey("students.Student", on_delete=models.CASCADE, related_name="seat_plans")
    student_record_id = models.BigIntegerField(null=True, blank=True)
    created_by = models.ForeignKey(
        "users.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="seat_plans_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "seat_plans"
        ordering = ["-id"]
        constraints = [
            models.UniqueConstraint(fields=["school", "academic_year", "exam_term", "student"], name="uq_seat_plan_scope"),
        ]
