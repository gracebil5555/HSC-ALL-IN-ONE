from datetime import date
from decimal import Decimal, ROUND_HALF_UP
import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.core.models import TenantBoundModel


class Asset(TenantBoundModel):
    CONDITION_CHOICES = [
        ('NEW', 'Neuf'),
        ('GOOD', 'Bon état'),
        ('FAIR', 'État moyen'),
        ('MAINTENANCE', 'En réparation'),
        ('DAMAGED', 'Endommagé'),
        ('BROKEN', 'Hors service'),
        ('LOST', 'Perdu/Volé'),
    ]

    asset_code = models.CharField(max_length=50, blank=True)
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=100, blank=True, default='Général')
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assets',
    )
    location = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    qr_code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    purchase_date = models.DateField(null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(
        max_length=3,
        choices=[('XAF', 'Franc CFA (XAF)'), ('CAD', 'Dollar Canadien (CAD)'), ('EUR', 'Euro (EUR)'), ('USD', 'Dollar US (USD)')],
        default='XAF',
    )
    exchange_rate_to_hq = models.DecimalField(max_digits=14, decimal_places=6, default=Decimal('1.000000'))
    amount_in_hq_currency = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    useful_life_years = models.PositiveIntegerField(default=5)
    depreciation_rate = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default='GOOD')
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_assets'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        from apps.finances.models import ExchangeRate
        if not self.currency or (self.campus_id and self.currency == 'XAF' and getattr(self.campus, 'currency', 'XAF') != 'XAF'):
            if self.campus_id:
                self.currency = self.campus.currency or 'XAF'
        if self.purchase_price is not None:
            rate, converted = ExchangeRate.convert_to_hq(self.purchase_price, self.currency)
            self.exchange_rate_to_hq = rate
            self.amount_in_hq_currency = converted
        else:
            self.exchange_rate_to_hq = ExchangeRate.get_rate_to_hq(self.currency)
            self.amount_in_hq_currency = Decimal('0.00')
        if self.depreciation_rate is None and self.useful_life_years and self.useful_life_years > 0:
            self.depreciation_rate = (Decimal('100.00') / Decimal(self.useful_life_years)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
        super().save(*args, **kwargs)
        if not self.asset_code and self.pk:
            self.asset_code = f"HSC-ACT-{self.pk:04d}"
            Asset.objects.filter(pk=self.pk).update(asset_code=self.asset_code)

    @property
    def effective_depreciation_rate(self) -> Decimal:
        if self.depreciation_rate is not None:
            return Decimal(self.depreciation_rate)
        if self.useful_life_years and self.useful_life_years > 0:
            return (Decimal('100.00') / Decimal(self.useful_life_years)).quantize(
                Decimal('0.01'), rounding=ROUND_HALF_UP
            )
        return Decimal('0.00')

    @property
    def accumulated_depreciation(self) -> Decimal:
        """
        Amortissement linéaire prorata temporis plafonné à purchase_price.
        """
        if not self.purchase_price or self.purchase_price <= 0:
            return Decimal('0.00')
        if not self.purchase_date:
            return Decimal('0.00')
        today = timezone.now().date()
        if self.purchase_date >= today:
            return Decimal('0.00')
        days_elapsed = (today - self.purchase_date).days
        years_elapsed = Decimal(days_elapsed) / Decimal('365.0')
        rate = self.effective_depreciation_rate
        if rate <= 0:
            return Decimal('0.00')
        annual_dep = Decimal(self.purchase_price) * (rate / Decimal('100.00'))
        accumulated = (annual_dep * years_elapsed).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        return min(Decimal(self.purchase_price), max(Decimal('0.00'), accumulated))

    @property
    def net_book_value(self) -> Decimal:
        """
        Valeur Nette Comptable = purchase_price - accumulated_depreciation.
        """
        if not self.purchase_price or self.purchase_price <= 0:
            return Decimal('0.00')
        nbv = (Decimal(self.purchase_price) - self.accumulated_depreciation).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )
        return max(Decimal('0.00'), nbv)

    def __str__(self):
        return f"{self.name} ({self.asset_code or self.qr_code})"


class AssetMovement(TenantBoundModel):
    MOVEMENT_TYPE_CHOICES = [
        ('ASSIGNMENT', 'Affectation'),
        ('TRANSFER', 'Déplacement'),
        ('MAINTENANCE', 'Maintenance'),
        ('INSPECTION', 'Contrôle périodique'),
    ]

    asset = models.ForeignKey(Asset, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=20, choices=MOVEMENT_TYPE_CHOICES)
    from_location = models.CharField(max_length=200, blank=True)
    to_location = models.CharField(max_length=200, blank=True)
    observed_condition = models.CharField(max_length=20, choices=Asset.CONDITION_CHOICES, default='GOOD')
    movement_date = models.DateField(default=date.today)
    responsible = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='asset_movements',
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-movement_date', '-created_at']

    def __str__(self):
        return f"{self.get_movement_type_display()} - {self.asset.name} ({self.movement_date})"


class ConsumableItem(TenantBoundModel):
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    quantity_in_stock = models.PositiveIntegerField(default=0)
    alert_threshold = models.PositiveIntegerField(default=10)
    unit_measure = models.CharField(max_length=50, default='unités')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class StockMovement(TenantBoundModel):
    MOVEMENT_CHOICES = [
        ('IN', 'Entrée de stock'),
        ('OUT', 'Sortie de stock'),
        ('ADJUST', 'Ajustement d\'inventaire'),
    ]

    item = models.ForeignKey(ConsumableItem, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=10, choices=MOVEMENT_CHOICES)
    quantity = models.IntegerField(help_text="Utilisez des valeurs négatives pour les sorties si nécessaire, ou gardez positif et le code s'en chargera.")
    reason = models.CharField(max_length=200)
    performed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.get_movement_type_display()} - {self.item.name} ({self.quantity})"
