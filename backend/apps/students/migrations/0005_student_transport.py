import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("students", "0004_studentgroup_and_student_student_group"),
        ("core", "0004_transport_models"),
    ]

    operations = [
        migrations.AddField(
            model_name="student",
            name="transport_route",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="students",
                to="core.transportroute",
            ),
        ),
        migrations.AddField(
            model_name="student",
            name="vehicle",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="students",
                to="core.vehicle",
            ),
        ),
    ]
