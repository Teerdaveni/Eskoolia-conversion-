from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("hr", "0002_hr_leave_define_staff_attendance_and_profile"),
        ("access_control", "0002_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="staff",
            name="contract_type",
            field=models.CharField(blank=True, choices=[("permanent", "Permanent"), ("contract", "Contract")], max_length=20),
        ),
        migrations.AddField(
            model_name="staff",
            name="driving_license",
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name="staff",
            name="emergency_mobile",
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name="staff",
            name="gender",
            field=models.CharField(blank=True, choices=[("male", "Male"), ("female", "Female"), ("other", "Other")], max_length=10),
        ),
        migrations.AddField(
            model_name="staff",
            name="joining_letter",
            field=models.CharField(blank=True, max_length=300),
        ),
        migrations.AddField(
            model_name="staff",
            name="location",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="staff",
            name="marital_status",
            field=models.CharField(blank=True, choices=[("single", "Single"), ("married", "Married")], max_length=12),
        ),
        migrations.AddField(
            model_name="staff",
            name="other_document",
            field=models.CharField(blank=True, max_length=300),
        ),
        migrations.AddField(
            model_name="staff",
            name="resume",
            field=models.CharField(blank=True, max_length=300),
        ),
        migrations.AddField(
            model_name="staff",
            name="role",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="staff_members", to="access_control.role"),
        ),
        migrations.AddField(
            model_name="staff",
            name="staff_photo",
            field=models.CharField(blank=True, max_length=300),
        ),
    ]
