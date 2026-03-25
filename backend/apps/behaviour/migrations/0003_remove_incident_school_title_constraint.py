from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("behaviour", "0002_remove_incident_active_status"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="incident",
            name="uq_behaviour_incident_school_title",
        ),
    ]
