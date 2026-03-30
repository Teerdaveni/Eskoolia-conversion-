from django.db import migrations


PERMISSIONS = [
    ("behaviour.incident.view", "Behaviour Incident", "behaviour"),
    ("behaviour.assigned_incident.view", "Behaviour Assigned Incident", "behaviour"),
    ("behaviour.assigned_incident_comment.view", "Behaviour Assigned Incident Comment", "behaviour"),
    ("behaviour.record_setting.view", "Behaviour Record Setting", "behaviour"),
]


def seed_permissions(apps, schema_editor):
    Permission = apps.get_model("access_control", "Permission")
    for code, name, module in PERMISSIONS:
        Permission.objects.update_or_create(
            code=code,
            defaults={"name": name, "module": module},
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("access_control", "0003_seed_expanded_permissions"),
    ]

    operations = [
        migrations.RunPython(seed_permissions, noop_reverse),
    ]
