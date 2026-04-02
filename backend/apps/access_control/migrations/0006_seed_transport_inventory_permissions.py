from django.db import migrations


PERMISSIONS = [
    ("transport.vehicle.view", "Vehicle", "transport"),
    ("transport.route.view", "Transport Route", "transport"),
    ("transport.assign_vehicle.view", "Assign Vehicle", "transport"),
    ("transport.student_report.view", "Student Transport Report", "transport"),
    ("inventory.item_category.view", "Item Category", "inventory"),
    ("inventory.item_store.view", "Item Store", "inventory"),
    ("inventory.supplier.view", "Supplier", "inventory"),
    ("inventory.item.view", "Item", "inventory"),
    ("inventory.item_receive.view", "Item Receive", "inventory"),
    ("inventory.item_issue.view", "Item Issue", "inventory"),
    ("inventory.item_sell.view", "Item Sell", "inventory"),
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
        ("access_control", "0005_seed_missing_admin_section_permissions"),
    ]

    operations = [
        migrations.RunPython(seed_permissions, noop_reverse),
    ]
