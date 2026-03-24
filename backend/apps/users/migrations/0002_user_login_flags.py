from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="access_status",
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name="user",
            name="due_fees_login_blocked",
            field=models.BooleanField(default=False),
        ),
    ]
