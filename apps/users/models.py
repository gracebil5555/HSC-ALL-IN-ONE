from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Modèle utilisateur personnalisé pour le système RBAC HSC.
    """
    ROLE_CHOICES = [
        ("SUPER_SUPER_ADMIN", "Super Super Admin"),
        ("SUPER_ADMIN_CAMPUS", "Super Admin Campus"),
        ("GESTIONNAIRE_CAISSE", "Gestionnaire de Caisse"),
        ("RESPONSABLE_PATRIMOINE", "Responsable Patrimoine"),
        ("CHEF_BRIGADE", "Chef de Brigade"),
        ("RESPONSABLE_DEPARTEMENT", "Responsable de Département"),
        ("FIDELE", "Fidèle"),
    ]

    phone = models.CharField(max_length=30, blank=True)
    title = models.CharField(max_length=50, blank=True)
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="FIDELE")
    campus = models.ForeignKey(
        'campuses.Campus', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users'
    )
    avatar = models.URLField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.username})"
