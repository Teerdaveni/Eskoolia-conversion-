from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("students", "0005_student_transport"),
        ("hr", "0003_staff_extended_profile_tabs"),
    ]

    operations = [
        migrations.AddField(
            model_name="leavedefine",
            name="student",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="leave_defines",
                to="students.student",
            ),
        ),
        migrations.AddIndex(
            model_name="leavedefine",
            index=models.Index(fields=["school", "student"], name="idx_hr_ld_sch_student"),
        ),
    ]
