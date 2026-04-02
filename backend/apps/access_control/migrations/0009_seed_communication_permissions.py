from django.db import migrations


PERMISSIONS = [
    ("utilities.communication.view", "Communication", "utilities"),
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
        ("access_control", "0008_seed_utilities_submodule_permissions"),
    ]

    operations = [
        migrations.RunPython(seed_permissions, noop_reverse),
    ]