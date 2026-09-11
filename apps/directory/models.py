from django.db import models
from apps.core.models import TenantBoundModel
from apps.members.models import Member

class BusinessProfile(TenantBoundModel):
    CATEGORY_CHOICES = [
        ('SERVICES', 'Services Professionnels'),
        ('TRADE', 'Commerce et Vente'),
        ('TECH', 'Informatique & Tech'),
        ('HEALTH', 'Santé & Bien-être'),
        ('ART', 'Arts & Créativité'),
        ('OTHER', 'Autre'),
    ]

    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='businesses')
    business_name = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField()
    whatsapp_number = models.CharField(max_length=30)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_whatsapp_link(self):
        """
        Génère automatiquement le lien WhatsApp direct avec un message pré-rempli.
        """
        base_url = "https://wa.me/"
        # Nettoyage du numéro (suppression des espaces, +, etc.)
        clean_number = "".join(filter(str.isdigit, self.whatsapp_number))
        message = f"?text=Bonjour, je vous contacte depuis l'annuaire d'entraide HSC au sujet de {self.business_name}."
        return f"{base_url}{clean_number}{message}"

    def __str__(self):
        return f"{self.business_name} ({self.member})"
