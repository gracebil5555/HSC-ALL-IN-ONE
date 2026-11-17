import datetime
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('campuses', '0004_campus_currency'),
        ('finances', '0003_transaction'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ExchangeRate',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('from_currency', models.CharField(choices=[('XAF', 'Franc CFA (XAF)'), ('CAD', 'Dollar Canadien (CAD)'), ('EUR', 'Euro (EUR)'), ('USD', 'Dollar US (USD)')], max_length=3)),
                ('to_currency', models.CharField(choices=[('XAF', 'Franc CFA (XAF)'), ('CAD', 'Dollar Canadien (CAD)'), ('EUR', 'Euro (EUR)'), ('USD', 'Dollar US (USD)')], default='XAF', max_length=3)),
                ('rate', models.DecimalField(decimal_places=6, max_digits=14)),
                ('effective_date', models.DateField(default=datetime.date.today)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_exchange_rates', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Taux de Change',
                'verbose_name_plural': 'Taux de Change',
                'ordering': ['-effective_date', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='AccountingPeriodClose',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.PositiveIntegerField()),
                ('month', models.PositiveIntegerField()),
                ('is_closed', models.BooleanField(default=True)),
                ('closed_at', models.DateTimeField(auto_now_add=True)),
                ('notes', models.TextField(blank=True)),
                ('campus', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='finances_accountingperiodclose_related', to='campuses.campus')),
                ('closed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='closed_accounting_periods', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Clôture Mensuelle',
                'verbose_name_plural': 'Clôtures Mensuelles',
                'ordering': ['-year', '-month'],
                'unique_together': {('campus', 'year', 'month')},
            },
        ),
        migrations.AddField(
            model_name='voucher',
            name='amount_in_hq_currency',
            field=models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=14),
        ),
        migrations.AddField(
            model_name='voucher',
            name='currency',
            field=models.CharField(choices=[('XAF', 'Franc CFA (XAF)'), ('CAD', 'Dollar Canadien (CAD)'), ('EUR', 'Euro (EUR)'), ('USD', 'Dollar US (USD)')], default='XAF', max_length=3),
        ),
        migrations.AddField(
            model_name='voucher',
            name='exchange_rate_to_hq',
            field=models.DecimalField(decimal_places=6, default=Decimal('1.000000'), max_digits=14),
        ),
        migrations.AddField(
            model_name='voucher',
            name='first_approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='voucher',
            name='first_approver',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='first_approved_vouchers', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='voucher',
            name='requires_double_validation',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='voucher',
            name='second_approved_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='voucher',
            name='second_approver',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='second_approved_vouchers', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AlterField(
            model_name='voucher',
            name='amount',
            field=models.DecimalField(decimal_places=2, max_digits=12),
        ),
        migrations.AlterField(
            model_name='voucher',
            name='status',
            field=models.CharField(choices=[('PENDING', 'En attente'), ('PENDING_SECOND_APPROVAL', 'En attente de 2e validation'), ('APPROVED', 'Approuvé (Par Pasteur)'), ('DISBURSED', 'Décaissé (Par Trésorier)'), ('REJECTED', 'Rejeté')], default='PENDING', max_length=30),
        ),
        migrations.AlterField(
            model_name='voucherhistory',
            name='old_status',
            field=models.CharField(choices=[('PENDING', 'En attente'), ('PENDING_SECOND_APPROVAL', 'En attente de 2e validation'), ('APPROVED', 'Approuvé (Par Pasteur)'), ('DISBURSED', 'Décaissé (Par Trésorier)'), ('REJECTED', 'Rejeté')], max_length=30),
        ),
        migrations.AlterField(
            model_name='voucherhistory',
            name='new_status',
            field=models.CharField(choices=[('PENDING', 'En attente'), ('PENDING_SECOND_APPROVAL', 'En attente de 2e validation'), ('APPROVED', 'Approuvé (Par Pasteur)'), ('DISBURSED', 'Décaissé (Par Trésorier)'), ('REJECTED', 'Rejeté')], max_length=30),
        ),
        migrations.AddField(
            model_name='transaction',
            name='amount_in_hq_currency',
            field=models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=14),
        ),
        migrations.AddField(
            model_name='transaction',
            name='currency',
            field=models.CharField(choices=[('XAF', 'Franc CFA (XAF)'), ('CAD', 'Dollar Canadien (CAD)'), ('EUR', 'Euro (EUR)'), ('USD', 'Dollar US (USD)')], default='XAF', max_length=3),
        ),
        migrations.AddField(
            model_name='transaction',
            name='exchange_rate_to_hq',
            field=models.DecimalField(decimal_places=6, default=Decimal('1.000000'), max_digits=14),
        ),
    ]
