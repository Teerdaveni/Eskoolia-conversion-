import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_classperiod"),
    ]

    operations = [
        migrations.CreateModel(
            name="ClassRoom",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("room_no", models.CharField(max_length=50)),
                ("capacity", models.PositiveIntegerField(blank=True, null=True)),
                ("active_status", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "school",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="class_rooms", to="tenancy.school"),
                ),
            ],
            options={
                "db_table": "class_rooms",
                "ordering": ["room_no"],
            },
        ),
        migrations.AddConstraint(
            model_name="classroom",
            constraint=models.UniqueConstraint(fields=("school", "room_no"), name="uq_class_room_school_room_no"),
        ),
    ]
