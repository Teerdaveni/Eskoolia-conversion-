from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("access_control", "0002_initial"),
        ("hr", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="staff",
            name="bank_account_name",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="staff",
            name="bank_account_no",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="staff",
            name="bank_branch",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="staff",
            name="bank_name",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="staff",
            name="casual_leave",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="staff",
            name="current_address",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="staff",
            name="custom_field",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="staff",
            name="date_of_birth",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="staff",
            name="epf_no",
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name="staff",
            name="experience",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="staff",
            name="facebook_url",
            field=models.URLField(blank=True, max_length=400),
        ),
        migrations.AddField(
            model_name="staff",
            name="fathers_name",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="staff",
            name="instagram_url",
            field=models.URLField(blank=True, max_length=400),
        ),
        migrations.AddField(
            model_name="staff",
            name="linkedin_url",
            field=models.URLField(blank=True, max_length=400),
        ),
        migrations.AddField(
            model_name="staff",
            name="maternity_leave",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="staff",
            name="medical_leave",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="staff",
            name="mothers_name",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="staff",
            name="permanent_address",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="staff",
            name="qualification",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="staff",
            name="show_public",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="staff",
            name="twitter_url",
            field=models.URLField(blank=True, max_length=400),
        ),
        migrations.AddField(
            model_name="leaverequest",
            name="approval_note",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="leaverequest",
            name="attachment",
            field=models.CharField(blank=True, max_length=300),
        ),
        migrations.CreateModel(
            name="LeaveDefine",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("days", models.PositiveSmallIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "leave_type",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="leave_defines", to="hr.leavetype"),
                ),
                (
                    "role",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="leave_defines", to="access_control.role"),
                ),
                (
                    "school",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="leave_defines", to="tenancy.school"),
                ),
                (
                    "staff",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="leave_defines", to="hr.staff"),
                ),
            ],
            options={
                "db_table": "hr_leave_defines",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="StaffAttendance",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("attendance_date", models.DateField()),
                ("attendance_type", models.CharField(choices=[("P", "Present"), ("A", "Absent"), ("L", "Leave"), ("F", "Half Day"), ("H", "Holiday")], default="P", max_length=1)),
                ("note", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "school",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="staff_attendance", to="tenancy.school"),
                ),
                (
                    "staff",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="attendance_records", to="hr.staff"),
                ),
            ],
            options={
                "db_table": "hr_staff_attendance",
                "ordering": ["-attendance_date", "staff_id"],
            },
        ),
        migrations.AddIndex(
            model_name="leavedefine",
            index=models.Index(fields=["school", "role"], name="idx_hr_ld_sch_role"),
        ),
        migrations.AddIndex(
            model_name="leavedefine",
            index=models.Index(fields=["school", "staff"], name="idx_hr_ld_sch_staff"),
        ),
        migrations.AddConstraint(
            model_name="staffattendance",
            constraint=models.UniqueConstraint(fields=("school", "staff", "attendance_date"), name="uq_hr_staff_attendance"),
        ),
    ]
