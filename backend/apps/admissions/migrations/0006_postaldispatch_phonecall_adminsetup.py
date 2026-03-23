from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("admissions", "0005_postalreceiveentry"),
        ("tenancy", "0001_initial"),
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="AdminSetupEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("type", models.CharField(choices=[("1", "Purpose"), ("2", "Complaint Type"), ("3", "Source"), ("4", "Reference")], max_length=1)),
                ("name", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name="admin_setup_entries_created", to="users.user"),
                ),
                (
                    "school",
                    models.ForeignKey(on_delete=models.CASCADE, related_name="admin_setup_entries", to="tenancy.school"),
                ),
            ],
            options={
                "db_table": "admin_setup_entries",
                "ordering": ["type", "name"],
                "unique_together": {("school", "type", "name")},
            },
        ),
        migrations.CreateModel(
            name="PhoneCallLogEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(blank=True, max_length=255)),
                ("phone", models.CharField(max_length=32)),
                ("date", models.DateField(blank=True, null=True)),
                ("next_follow_up_date", models.DateField(blank=True, null=True)),
                ("call_duration", models.CharField(blank=True, max_length=120)),
                ("description", models.TextField(blank=True)),
                ("call_type", models.CharField(choices=[("I", "Incoming"), ("O", "Outgoing")], default="I", max_length=1)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name="phone_call_log_entries_created", to="users.user"),
                ),
                (
                    "school",
                    models.ForeignKey(on_delete=models.CASCADE, related_name="phone_call_log_entries", to="tenancy.school"),
                ),
            ],
            options={
                "db_table": "phone_call_log_entries",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="PostalDispatchEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("from_title", models.CharField(max_length=255)),
                ("reference_no", models.CharField(max_length=120)),
                ("address", models.CharField(max_length=255)),
                ("note", models.TextField(blank=True)),
                ("to_title", models.CharField(max_length=255)),
                ("date", models.DateField(blank=True, null=True)),
                ("file", models.FileField(blank=True, null=True, upload_to="admissions/postal_dispatch/")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name="postal_dispatch_entries_created", to="users.user"),
                ),
                (
                    "school",
                    models.ForeignKey(on_delete=models.CASCADE, related_name="postal_dispatch_entries", to="tenancy.school"),
                ),
            ],
            options={
                "db_table": "postal_dispatch_entries",
                "ordering": ["-created_at"],
            },
        ),
    ]
