from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("admissions", "0006_postaldispatch_phonecall_adminsetup"),
        ("tenancy", "0001_initial"),
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="CertificateTemplate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("type", models.CharField(choices=[("School", "School"), ("Lms", "Lms")], default="School", max_length=16)),
                ("title", models.CharField(max_length=255)),
                ("applicable_role_id", models.IntegerField(blank=True, null=True)),
                ("background_height", models.DecimalField(decimal_places=2, default=144, max_digits=8)),
                ("background_width", models.DecimalField(decimal_places=2, default=165, max_digits=8)),
                ("padding_top", models.DecimalField(decimal_places=2, default=5, max_digits=8)),
                ("padding_right", models.DecimalField(decimal_places=2, default=5, max_digits=8)),
                ("padding_bottom", models.DecimalField(decimal_places=2, default=5, max_digits=8)),
                ("pading_left", models.DecimalField(decimal_places=2, default=5, max_digits=8)),
                ("body", models.TextField()),
                ("background_image", models.FileField(blank=True, null=True, upload_to="admissions/certificates/backgrounds/")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name="certificate_templates_created", to="users.user"),
                ),
                (
                    "school",
                    models.ForeignKey(on_delete=models.CASCADE, related_name="certificate_templates", to="tenancy.school"),
                ),
            ],
            options={
                "db_table": "certificate_templates",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="IdCardTemplate",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=255)),
                ("page_layout_style", models.CharField(choices=[("horizontal", "Horizontal"), ("vertical", "Vertical")], default="horizontal", max_length=16)),
                ("applicable_role_ids", models.JSONField(blank=True, default=list)),
                ("pl_width", models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ("pl_height", models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ("user_photo_style", models.CharField(choices=[("squre", "Square"), ("round", "Round")], default="squre", max_length=16)),
                ("user_photo_width", models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ("user_photo_height", models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ("t_space", models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ("b_space", models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ("l_space", models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ("r_space", models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True)),
                ("background_img", models.FileField(blank=True, null=True, upload_to="admissions/id_cards/backgrounds/")),
                ("profile_image", models.FileField(blank=True, null=True, upload_to="admissions/id_cards/profiles/")),
                ("logo", models.FileField(blank=True, null=True, upload_to="admissions/id_cards/logos/")),
                ("signature", models.FileField(blank=True, null=True, upload_to="admissions/id_cards/signatures/")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(blank=True, null=True, on_delete=models.SET_NULL, related_name="id_card_templates_created", to="users.user"),
                ),
                (
                    "school",
                    models.ForeignKey(on_delete=models.CASCADE, related_name="id_card_templates", to="tenancy.school"),
                ),
            ],
            options={
                "db_table": "id_card_templates",
                "ordering": ["-created_at"],
            },
        ),
    ]
