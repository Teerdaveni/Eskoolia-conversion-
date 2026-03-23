import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenancy", "0001_initial"),
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ClassPeriod",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("period", models.CharField(max_length=100)),
                ("start_time", models.TimeField()),
                ("end_time", models.TimeField()),
                ("period_type", models.CharField(choices=[("class", "Class"), ("exam", "Exam")], default="class", max_length=10)),
                ("is_break", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("school", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="class_periods", to="tenancy.school")),
            ],
            options={
                "db_table": "class_periods",
                "ordering": ["start_time", "period"],
                "constraints": [models.UniqueConstraint(fields=("school", "period", "period_type"), name="uq_class_period_school_name_type")],
            },
        ),
    ]