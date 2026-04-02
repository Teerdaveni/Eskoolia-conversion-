from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("communication", "0001_initial"),
        ("core", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="NoticeBoard",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("notice_title", models.CharField(max_length=255)),
                ("notice_message", models.TextField()),
                ("notice_date", models.DateField()),
                ("publish_on", models.DateField()),
                ("inform_to", models.JSONField(blank=True, default=list)),
                ("is_published", models.BooleanField(default=False)),
                (
                    "academic_year",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="communication_notice_boards",
                        to="core.academicyear",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_communication_notice_boards",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "school",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="communication_notice_boards",
                        to="tenancy.school",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_communication_notice_boards",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "communication_notice_boards",
                "ordering": ["-publish_on", "-notice_date", "-created_at"],
            },
        ),
        migrations.CreateModel(
            name="EmailSmsLog",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField()),
                ("send_through", models.CharField(default="E", max_length=1)),
                (
                    "send_to",
                    models.CharField(
                        choices=[("G", "Group"), ("I", "Individual"), ("C", "Class / Section")],
                        default="G",
                        max_length=1,
                    ),
                ),
                ("send_date", models.DateField()),
                ("target_data", models.JSONField(blank=True, default=dict)),
                (
                    "academic_year",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="communication_email_sms_logs",
                        to="core.academicyear",
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_communication_email_sms_logs",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "school",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="communication_email_sms_logs",
                        to="tenancy.school",
                    ),
                ),
            ],
            options={
                "db_table": "communication_email_sms_logs",
                "ordering": ["-send_date", "-created_at"],
            },
        ),
    ]