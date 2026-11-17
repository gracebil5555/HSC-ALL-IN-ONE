# Generated manually for TenantBoundModel on AssimilationProfile

import django.db.models.deletion
from django.db import migrations, models


def backfill_assimilation_campus(apps, schema_editor):
    AssimilationProfile = apps.get_model('assimilation', 'AssimilationProfile')
    for profile in AssimilationProfile.objects.select_related('member').all():
        if profile.campus_id is None and profile.member_id and profile.member.campus_id:
            profile.campus_id = profile.member.campus_id
            profile.save(update_fields=['campus'])


class Migration(migrations.Migration):

    dependencies = [
        ('assimilation', '0003_initial'),
        ('campuses', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='assimilationprofile',
            name='campus',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='%(app_label)s_%(class)s_related',
                to='campuses.campus',
            ),
        ),
        migrations.RunPython(backfill_assimilation_campus, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='assimilationprofile',
            name='campus',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name='%(app_label)s_%(class)s_related',
                to='campuses.campus',
            ),
        ),
    ]
