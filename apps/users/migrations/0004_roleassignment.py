from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('campuses', '0004_campus_currency'),
        ('departments', '0001_initial'),
        ('members', '0004_ecclesialfunctioncatalog_memberstatuscatalog_and_more'),
        ('users', '0003_user_delegated_permissions_user_deputy_of_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='RoleAssignment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('SUPER_SUPER_ADMIN', 'Super Super Admin (Global HSC)'), ('SUPER_ADMIN', 'Super Admin (Église / Extension)'), ('ADMIN_DEPT', 'Admin (Département / Structure)'), ('ADJOINT', 'Adjoint (Délégué)'), ('MEMBRE', 'Membre / Fidèle')], max_length=30)),
                ('ecclesial_function', models.CharField(blank=True, choices=[('APOTRE', 'Apôtre'), ('PASTEUR', 'Pasteur'), ('ANCIEN', 'Ancien'), ('DIACRE', 'Diacre'), ('EVANGELISTE', 'Évangéliste'), ('DOCTEUR', 'Docteur'), ('PROPHETE', 'Prophète'), ('BERGER', 'Berger'), ('RESPONSABLE', 'Responsable de Département'), ('ADJOINT_DEPT', 'Adjoint de Département'), ('OUVRIER', 'Ouvrier'), ('FIDELE', 'Fidèle / Membre')], max_length=40)),
                ('delegated_permissions', models.JSONField(blank=True, default=list)),
                ('start_date', models.DateField()),
                ('end_date', models.DateField(blank=True, null=True)),
                ('is_active', models.BooleanField(default=True)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('appointed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='appointed_role_assignments', to=settings.AUTH_USER_MODEL)),
                ('brigade', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='role_assignments', to='members.brigade')),
                ('campus', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='role_assignments', to='campuses.campus')),
                ('department', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='role_assignments', to='departments.department')),
                ('deputy_of', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='deputy_assignments', to=settings.AUTH_USER_MODEL)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='role_assignments', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Affectation de Mandat',
                'verbose_name_plural': 'Affectations de Mandats',
                'ordering': ['-is_active', '-start_date', '-created_at'],
            },
        ),
    ]
