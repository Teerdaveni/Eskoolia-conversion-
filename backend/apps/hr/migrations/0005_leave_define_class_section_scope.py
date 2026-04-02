from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0008_smsgateway_provider_config"),
        ("hr", "0004_leave_define_student_scope"),
    ]

    operations = [
        migrations.AddField(
            model_name="leavedefine",
            name="school_class",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="leave_defines",
                to="core.class",
            ),
        ),
        migrations.AddField(
            model_name="leavedefine",
            name="section",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="leave_defines",
                to="core.section",
            ),
        ),
        migrations.AddIndex(
            model_name="leavedefine",
            index=models.Index(fields=["school", "school_class"], name="idx_hr_ld_sch_class"),
        ),
        migrations.AddIndex(
            model_name="leavedefine",
            index=models.Index(fields=["school", "section"], name="idx_hr_ld_sch_section"),
        ),
    ]
