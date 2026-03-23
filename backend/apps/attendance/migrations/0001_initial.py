import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("core", "0001_initial"),
        ("students", "0001_initial"),
        ("tenancy", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="StudentAttendance",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("class_id", models.PositiveIntegerField(blank=True, help_text="Legacy class_id parity", null=True)),
                ("section_id", models.PositiveIntegerField(blank=True, help_text="Legacy section_id parity", null=True)),
                ("attendance_date", models.DateField()),
                ("attendance_type", models.CharField(
                    choices=[("P", "Present"), ("A", "Absent"), ("L", "Late"), ("H", "Holiday")],
                    max_length=1,
                )),
                ("notes", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("academic_year", models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name="student_attendances",
                    to="core.academicyear",
                )),
                ("school", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="student_attendances",
                    to="tenancy.school",
                )),
                ("student", models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name="attendances",
                    to="students.student",
                )),
            ],
            options={
                "db_table": "student_attendances",
                "ordering": ["-attendance_date", "student_id"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("school", "academic_year", "student", "attendance_date"),
                        name="uq_student_attendance_date",
                    )
                ],
            },
        ),
    ]
