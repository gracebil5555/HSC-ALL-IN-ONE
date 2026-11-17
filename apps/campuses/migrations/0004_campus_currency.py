from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('campuses', '0003_alter_campus_options_campus_address_campus_code_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='campus',
            name='currency',
            field=models.CharField(
                choices=[
                    ('XAF', 'Franc CFA (XAF)'),
                    ('CAD', 'Dollar Canadien (CAD)'),
                    ('EUR', 'Euro (EUR)'),
                    ('USD', 'Dollar US (USD)'),
                ],
                default='XAF',
                help_text='Devise locale du campus (XAF pour Congo, CAD pour Canada, EUR, USD).',
                max_length=3,
            ),
        ),
    ]
