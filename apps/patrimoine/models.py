from django.db import models
from django.conf import settings
from apps.core.models import TenantBoundModel
import uuid

class Asset(TenantBoundModel):
    CONDITION_CHOICES = [
        ('NEW', 'Neuf'),
        ('GOOD', 'Bon état'),
        ('FAIR', 'État moyen'),
        ('DAMAGED', 'Endommagé'),
        ('LOST', 'Perdu/Volé'),
    ]

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    qr_code = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    purchase_date = models.DateField(null=True, blank=True)
    purchase_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
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

    def __str__(self):
        return f"{self.name} ({self.qr_code})"


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
