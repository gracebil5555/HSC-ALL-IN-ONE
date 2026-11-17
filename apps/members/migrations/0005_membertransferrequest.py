from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('campuses', '0004_campus_currency'),
        ('members', '0004_ecclesialfunctioncatalog_memberstatuscatalog_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='MemberTransferRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('PENDING', 'En attente'), ('APPROVED', 'Approuvé'), ('REJECTED', 'Rejeté'), ('CANCELLED', 'Annulé')], default='PENDING', max_length=20)),
                ('reason', models.TextField(blank=True)),
                ('review_notes', models.TextField(blank=True)),
                ('preserve_assimilation', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('from_campus', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='outgoing_transfers', to='campuses.campus')),
                ('member', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='transfer_requests', to='members.member')),
                ('requested_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='requested_transfers', to=settings.AUTH_USER_MODEL)),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_transfers', to=settings.AUTH_USER_MODEL)),
                ('to_campus', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='incoming_transfers', to='campuses.campus')),
            ],
            options={
                'verbose_name': 'Demande de Transfert Inter-Églises',
                'verbose_name_plural': 'Demandes de Transfert Inter-Églises',
                'ordering': ['-created_at'],
            },
        ),
    ]
