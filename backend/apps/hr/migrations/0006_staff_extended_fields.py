# Generated migration for staff extended fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('hr', '0005_leave_define_class_section_scope'),
    ]

    operations = [
        migrations.AddField(
            model_name='staff',
            name='bank_mobile_no',
            field=models.CharField(blank=True, max_length=32),
        ),
        migrations.AddField(
            model_name='staff',
            name='tenth_certificate',
            field=models.CharField(blank=True, max_length=300),
        ),
        migrations.AddField(
            model_name='staff',
            name='eleventh_certificate',
            field=models.CharField(blank=True, max_length=300),
        ),
        migrations.AddField(
            model_name='staff',
            name='aadhar_card',
            field=models.CharField(blank=True, max_length=300),
        ),
        migrations.AddField(
            model_name='staff',
            name='driving_license_doc',
            field=models.CharField(blank=True, max_length=300),
        ),
    ]
