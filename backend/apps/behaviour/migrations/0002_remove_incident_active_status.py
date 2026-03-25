# Generated migration

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('behaviour', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='incident',
            name='active_status',
        ),
    ]
