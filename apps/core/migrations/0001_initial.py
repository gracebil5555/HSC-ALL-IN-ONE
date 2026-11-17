from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('campuses', '0003_alter_campus_options_campus_address_campus_code_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SystemAuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('actor_username', models.CharField(blank=True, max_length=150)),
                ('action', models.CharField(db_index=True, max_length=80)),
                ('target_model', models.CharField(db_index=True, max_length=100)),
                ('target_id', models.CharField(blank=True, max_length=64)),
                ('description', models.TextField(blank=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='audit_logs', to=settings.AUTH_USER_MODEL)),
                ('campus', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='audit_logs', to='campuses.campus')),
            ],
            options={
                'verbose_name': "Journal d'Audit Système",
                'verbose_name_plural': "Journaux d'Audit Système",
                'ordering': ['-created_at'],
            },
        ),
    ]
