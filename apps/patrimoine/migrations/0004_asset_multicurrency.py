from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patrimoine', '0003_asset_enhancements_assetmovement'),
    ]

    operations = [
        migrations.AddField(
            model_name='asset',
            name='amount_in_hq_currency',
            field=models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=14),
        ),
        migrations.AddField(
            model_name='asset',
            name='currency',
            field=models.CharField(
                choices=[('XAF', 'Franc CFA (XAF)'), ('CAD', 'Dollar Canadien (CAD)'), ('EUR', 'Euro (EUR)'), ('USD', 'Dollar US (USD)')],
                default='XAF',
                max_length=3,
            ),
        ),
        migrations.AddField(
            model_name='asset',
            name='exchange_rate_to_hq',
            field=models.DecimalField(decimal_places=6, default=Decimal('1.000000'), max_digits=14),
        ),
    ]
