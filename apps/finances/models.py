from django.db import models
from django.conf import settings
from apps.core.models import TenantBoundModel

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
        ('APPROVED', 'Approuvé (Par Pasteur)'),
        ('DISBURSED', 'Décaissé (Par Trésorier)'),
        ('REJECTED', 'Rejeté'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    register = models.ForeignKey(Register, on_delete=models.PROTECT, related_name='vouchers')
    
    requester = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='requested_vouchers'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Justificatif / Reçu final signé
    receipt_file = models.FileField(upload_to='vouchers/receipts/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Voucher #{self.id} - {self.title} ({self.amount})"


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
    old_status = models.CharField(max_length=20, choices=Voucher.STATUS_CHOICES)
    new_status = models.CharField(max_length=20, choices=Voucher.STATUS_CHOICES)
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
    description = models.TextField()
    
    registered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    
    # Lien optionnel vers la pièce justificative s'il y a lieu
    voucher = models.ForeignKey(Voucher, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.entry_type} {self.amount} - {self.reference}"
