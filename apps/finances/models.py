import os
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.db import models

from apps.core.models import TenantBoundModel

CURRENCY_CHOICES = [
    ('XAF', 'Franc CFA (XAF)'),
    ('CAD', 'Dollar Canadien (CAD)'),
    ('EUR', 'Euro (EUR)'),
    ('USD', 'Dollar US (USD)'),
]

DEFAULT_HQ_RATES = {
    'XAF': Decimal('1.000000'),
    'CAD': Decimal('445.000000'),
    'EUR': Decimal('655.957000'),
    'USD': Decimal('605.000000'),
}

FINANCE_DOUBLE_VALIDATION_THRESHOLD_HQ = Decimal(
    os.getenv('FINANCE_DOUBLE_VALIDATION_THRESHOLD_HQ', '500000.00')
)


class ExchangeRate(models.Model):
    """
    Taux de change vers la devise du Siège Mondial (XAF par défaut) pour la consolidation multi-pays.
    """
    from_currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES)
    to_currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='XAF')
    rate = models.DecimalField(max_digits=14, decimal_places=6)
    effective_date = models.DateField(default=date.today)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_exchange_rates',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-effective_date', '-created_at']
        verbose_name = "Taux de Change"
        verbose_name_plural = "Taux de Change"

    @classmethod
    def get_rate_to_hq(cls, from_currency: str, hq_currency: str = 'XAF', on_date=None) -> Decimal:
        code = (from_currency or 'XAF').upper()
        hq = (hq_currency or 'XAF').upper()
        if code == hq:
            return Decimal('1.000000')
        ref_date = on_date or date.today()
        entry = (
            cls.objects.filter(
                from_currency=code,
                to_currency=hq,
                is_active=True,
                effective_date__lte=ref_date,
            )
            .order_by('-effective_date', '-created_at')
            .first()
        )
        if entry:
            return Decimal(entry.rate)
        return DEFAULT_HQ_RATES.get(code, Decimal('1.000000'))

    @classmethod
    def convert_to_hq(cls, amount, from_currency: str, hq_currency: str = 'XAF', on_date=None):
        rate = cls.get_rate_to_hq(from_currency, hq_currency=hq_currency, on_date=on_date)
        amt = Decimal(amount or '0')
        converted = (amt * rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        return rate, converted

    def __str__(self):
        return f"1 {self.from_currency} = {self.rate} {self.to_currency} ({self.effective_date})"


class AccountingPeriodClose(TenantBoundModel):
    """
    Clôture mensuelle verrouillée par campus : bloque toute nouvelle écriture ou décaissement
    sur une période déjà clôturée.
    """
    year = models.PositiveIntegerField()
    month = models.PositiveIntegerField()
    is_closed = models.BooleanField(default=True)
    closed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='closed_accounting_periods',
    )
    closed_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ('campus', 'year', 'month')
        ordering = ['-year', '-month']
        verbose_name = "Clôture Mensuelle"
        verbose_name_plural = "Clôtures Mensuelles"

    @classmethod
    def is_date_closed(cls, campus_id: int, target_date) -> bool:
        if not campus_id or not target_date:
            return False
        return cls.objects.filter(
            campus_id=campus_id,
            year=target_date.year,
            month=target_date.month,
            is_closed=True,
        ).exists()

    def __str__(self):
        state = "Clôturée" if self.is_closed else "Ouverte"
        return f"{self.campus.name} - {self.month:02d}/{self.year} ({state})"


class Register(TenantBoundModel):
    REGISTER_TYPES = [
        ('CASH', 'Caisse Espèces'),
        ('BANK', 'Compte Bancaire'),
        ('MOBILE_MONEY', 'Mobile Money (Airtel/MoMo)'),
    ]

    name = models.CharField(max_length=100)
    register_type = models.CharField(max_length=20, choices=REGISTER_TYPES)
    current_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_register_type_display()}) - {self.campus.name}"


class Voucher(TenantBoundModel):
    STATUS_CHOICES = [
        ('PENDING', 'En attente'),
        ('PENDING_SECOND_APPROVAL', 'En attente de 2e validation'),
        ('APPROVED', 'Approuvé (Par Pasteur)'),
        ('DISBURSED', 'Décaissé (Par Trésorier)'),
        ('REJECTED', 'Rejeté'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='XAF')
    exchange_rate_to_hq = models.DecimalField(max_digits=14, decimal_places=6, default=Decimal('1.000000'))
    amount_in_hq_currency = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))

    register = models.ForeignKey(Register, on_delete=models.PROTECT, related_name='vouchers')

    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='requested_vouchers'
    )
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='PENDING')

    # Double validation au-dessus du plafond
    requires_double_validation = models.BooleanField(default=False)
    first_approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='first_approved_vouchers',
    )
    first_approved_at = models.DateTimeField(null=True, blank=True)
    second_approver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='second_approved_vouchers',
    )
    second_approved_at = models.DateTimeField(null=True, blank=True)

    # Justificatif / Reçu final signé
    receipt_file = models.FileField(upload_to='vouchers/receipts/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.currency or (self.campus_id and self.currency == 'XAF' and getattr(self.campus, 'currency', 'XAF') != 'XAF'):
            if self.campus_id:
                self.currency = self.campus.currency or 'XAF'
        rate, converted = ExchangeRate.convert_to_hq(self.amount, self.currency)
        self.exchange_rate_to_hq = rate
        self.amount_in_hq_currency = converted
        self.requires_double_validation = self.amount_in_hq_currency >= FINANCE_DOUBLE_VALIDATION_THRESHOLD_HQ
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Voucher #{self.id} - {self.title} ({self.amount} {self.currency})"


class VoucherHistory(models.Model):
    """
    Traçabilité des changements de statuts sur une pièce de caisse.
    """
    voucher = models.ForeignKey(Voucher, on_delete=models.CASCADE, related_name='history')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    old_status = models.CharField(max_length=30, choices=Voucher.STATUS_CHOICES)
    new_status = models.CharField(max_length=30, choices=Voucher.STATUS_CHOICES)
    changed_at = models.DateTimeField(auto_now_add=True)
    comments = models.TextField(blank=True)

    def __str__(self):
        return f"Voucher #{self.voucher.id}: {self.old_status} -> {self.new_status} by {self.user}"


class Transaction(TenantBoundModel):
    ENTRY_TYPES = [
        ('CREDIT', 'Entrée (+)'),
        ('DEBIT', 'Sortie (-)'),
    ]

    register = models.ForeignKey(Register, on_delete=models.CASCADE, related_name='transactions')
    reference = models.CharField(max_length=100, blank=True)
    entry_type = models.CharField(max_length=20, choices=ENTRY_TYPES)
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='XAF')
    exchange_rate_to_hq = models.DecimalField(max_digits=14, decimal_places=6, default=Decimal('1.000000'))
    amount_in_hq_currency = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal('0.00'))
    description = models.TextField()

    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    # Lien optionnel vers la pièce justificative s'il y a lieu
    voucher = models.ForeignKey(Voucher, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.currency or (self.campus_id and self.currency == 'XAF' and getattr(self.campus, 'currency', 'XAF') != 'XAF'):
            if self.campus_id:
                self.currency = self.campus.currency or 'XAF'
        rate, converted = ExchangeRate.convert_to_hq(self.amount, self.currency)
        self.exchange_rate_to_hq = rate
        self.amount_in_hq_currency = converted
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.entry_type} {self.amount} {self.currency} - {self.reference}"
