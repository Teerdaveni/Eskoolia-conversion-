import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0003_classroom"),
        ("hr", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Vehicle",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("vehicle_no", models.CharField(max_length=255)),
                ("vehicle_model", models.CharField(max_length=255)),
                ("made_year", models.IntegerField(blank=True, null=True)),
                ("note", models.TextField(blank=True)),
                ("active_status", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "academic_year",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vehicles", to="core.academicyear"),
                ),
                (
                    "driver",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="vehicles", to="hr.staff"),
                ),
                (
                    "school",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vehicles", to="tenancy.school"),
                ),
            ],
            options={
                "db_table": "vehicles",
                "ordering": ["vehicle_no"],
            },
        ),
        migrations.CreateModel(
            name="TransportRoute",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("fare", models.DecimalField(decimal_places=2, max_digits=10)),
                ("active_status", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "academic_year",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="transport_routes", to="core.academicyear"),
                ),
                (
                    "school",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="transport_routes", to="tenancy.school"),
                ),
            ],
            options={
                "db_table": "transport_routes",
                "ordering": ["title"],
            },
        ),
        migrations.CreateModel(
            name="AssignVehicle",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("active_status", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "academic_year",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="assign_vehicles", to="core.academicyear"),
                ),
                (
                    "route",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="assignments", to="core.transportroute"),
                ),
                (
                    "school",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="assign_vehicles", to="tenancy.school"),
                ),
                (
                    "vehicle",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="assignments", to="core.vehicle"),
                ),
            ],
            options={
                "db_table": "assign_vehicles",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddConstraint(
            model_name="vehicle",
            constraint=models.UniqueConstraint(fields=("school", "vehicle_no"), name="uq_vehicle_school_no"),
        ),
        migrations.AddConstraint(
            model_name="transportroute",
            constraint=models.UniqueConstraint(fields=("school", "title"), name="uq_transport_route_school_title"),
        ),
        migrations.AddConstraint(
            model_name="assignvehicle",
            constraint=models.UniqueConstraint(fields=("school", "vehicle", "route"), name="uq_assign_vehicle_school_vehicle_route"),
        ),
    ]
