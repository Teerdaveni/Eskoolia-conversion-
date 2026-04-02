from django.db import migrations


PERMISSIONS = [
    ("admin_section.postal_receive.add", "Postal Receive Add", "admin_section"),
    ("admin_section.postal_receive.edit", "Postal Receive Edit", "admin_section"),
    ("admin_section.postal_receive.delete", "Postal Receive Delete", "admin_section"),
    ("admin_section.postal_dispatch.add", "Postal Dispatch Add", "admin_section"),
    ("admin_section.postal_dispatch.edit", "Postal Dispatch Edit", "admin_section"),
    ("admin_section.postal_dispatch.delete", "Postal Dispatch Delete", "admin_section"),
    ("admin_section.phone_call_log.add", "Phone Call Log Add", "admin_section"),
    ("admin_section.phone_call_log.edit", "Phone Call Log Edit", "admin_section"),
    ("admin_section.phone_call_log.delete", "Phone Call Log Delete", "admin_section"),
    ("admin_section.admin_setup.add", "Admin Setup Add", "admin_section"),
    ("admin_section.admin_setup.edit", "Admin Setup Edit", "admin_section"),
    ("admin_section.admin_setup.delete", "Admin Setup Delete", "admin_section"),
    ("admin_section.id_card.add", "ID Card Add", "admin_section"),
    ("admin_section.id_card.edit", "ID Card Edit", "admin_section"),
    ("admin_section.id_card.delete", "ID Card Delete", "admin_section"),
    ("admin_section.certificate.add", "Certificate Add", "admin_section"),
    ("admin_section.certificate.edit", "Certificate Edit", "admin_section"),
    ("admin_section.certificate.delete", "Certificate Delete", "admin_section"),
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
        ("access_control", "0004_seed_behaviour_permissions"),
    ]

    operations = [
        migrations.RunPython(seed_permissions, noop_reverse),
    ]
