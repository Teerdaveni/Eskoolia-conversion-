from django.core.management.base import BaseCommand
from apps.access_control.models import Permission


PERMISSIONS = [
    ("access_control.permission.read", "View permission catalog", "access_control"),
    ("access_control.role.manage", "Create and update roles", "access_control"),
    ("access_control.user_role.manage", "Assign roles to users", "access_control"),
    ("admissions.inquiry.read", "View admission inquiries", "admissions"),
    ("admissions.inquiry.manage", "Create and update admission inquiries", "admissions"),
]


class Command(BaseCommand):
    help = "Seed base permission catalog"

    def handle(self, *args, **options):
        created = 0
        updated = 0

        for code, name, module in PERMISSIONS:
            obj, is_created = Permission.objects.update_or_create(
                code=code,
                defaults={"name": name, "module": module},
            )
            if is_created:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Permissions seeded. Created={created}, Updated={updated}"))
