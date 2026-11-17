from django.core.exceptions import ValidationError
from django.db import models

class Campus(models.Model):
    """
    Modèle d'Église / Extension avec hiérarchie parent/enfant.
    Mpita est l'Église mère (racine, parent=None).
    Les extensions sont rattachées à une Église parent.
    """
    CAMPUS_TYPES = [
        ('HQ', 'Église Mère (Siège Mondial)'),
        ('EXTENSION', 'Extension'),
        ('FOYER', "Foyer d'Implantation"),
    ]
    CURRENCY_CHOICES = [
        ('XAF', 'Franc CFA (XAF)'),
        ('CAD', 'Dollar Canadien (CAD)'),
        ('EUR', 'Euro (EUR)'),
        ('USD', 'Dollar US (USD)'),
    ]
    name = models.CharField(max_length=120)
    code = models.CharField(max_length=30, unique=True, blank=True, null=True)
    campus_type = models.CharField(
        max_length=20,
        choices=CAMPUS_TYPES,
        default='EXTENSION'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sub_extensions'
    )
    country = models.CharField(max_length=60, default='Congo')
    city = models.CharField(max_length=60, default='Pointe-Noire')
    address = models.CharField(max_length=255, blank=True)
    currency = models.CharField(
        max_length=3,
        choices=CURRENCY_CHOICES,
        default='XAF',
        help_text="Devise locale du campus (XAF pour Congo, CAD pour Canada, EUR, USD)."
    )
    lead_pastor = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='led_campuses'
    )
    
    # Feature Flags
    enable_brigades = models.BooleanField(default=True)
    enable_patrimoine = models.BooleanField(default=True)
    enable_finances = models.BooleanField(default=True)
    enable_ai_voice = models.BooleanField(default=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Église / Extension"
        verbose_name_plural = "Églises & Extensions"
        ordering = ['name']

    def clean(self):
        super().clean()
        if self.parent_id:
            if self.pk and self.parent_id == self.pk:
                raise ValidationError({"parent": "Un campus ne peut pas être son propre parent."})
            visited = {self.pk} if self.pk else set()
            curr = self.parent
            while curr is not None:
                if curr.pk in visited:
                    raise ValidationError({"parent": "Hiérarchie invalide : cycle détecté dans les campus parents."})
                visited.add(curr.pk)
                curr = curr.parent

    def __str__(self):
        return f"{self.name} ({self.get_campus_type_display()})"

