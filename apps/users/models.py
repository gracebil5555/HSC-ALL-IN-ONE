from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    """
    Modèle utilisateur pour le système RBAC HSC selon les spécifications fonctionnelles :
    - Distinction stricte entre Rôle technique (Super Super Admin, Super Admin, Admin, Adjoint)
      et Fonction ecclésiale (Pasteur, Ancien, Diacre, Berger, etc.).
    - Système d'Adjoint à chaque niveau avec délégation de permissions.
    """
    # 1. Rôles Techniques
    ROLE_CHOICES = [
        ("SUPER_SUPER_ADMIN", "Super Super Admin (Global HSC)"),
        ("SUPER_ADMIN", "Super Admin (Église / Extension)"),
        ("ADMIN_DEPT", "Admin (Département / Structure)"),
        ("ADJOINT", "Adjoint (Délégué)"),
        ("MEMBRE", "Membre / Fidèle"),
    ]

    # 2. Fonctions Ecclésiales (Distinctes du rôle technique)
    ECCLESIAL_FUNCTION_CHOICES = [
        ("APOTRE", "Apôtre"),
        ("PASTEUR", "Pasteur"),
        ("ANCIEN", "Ancien"),
        ("DIACRE", "Diacre"),
        ("EVANGELISTE", "Évangéliste"),
        ("DOCTEUR", "Docteur"),
        ("PROPHETE", "Prophète"),
        ("BERGER", "Berger"),
        ("RESPONSABLE", "Responsable de Département"),
        ("ADJOINT_DEPT", "Adjoint de Département"),
        ("OUVRIER", "Ouvrier"),
        ("FIDELE", "Fidèle / Membre"),
    ]

    phone = models.CharField(max_length=30, blank=True)
    title = models.CharField(max_length=50, blank=True) # Titre honorifique libre ou affichage
    ecclesial_function = models.CharField(
        max_length=40,
        choices=ECCLESIAL_FUNCTION_CHOICES,
        default="FIDELE"
    )
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default="MEMBRE")
    campus = models.ForeignKey(
        'campuses.Campus', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='users'
    )
    avatar = models.URLField(blank=True, null=True)

    # Système d'Adjoint / Délégation
    is_deputy = models.BooleanField(
        default=False, 
        help_text="Indique si cet utilisateur agit comme adjoint d'un titulaire."
    )
    deputy_of = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deputies',
        help_text="Le responsable titulaire dont cet utilisateur est l'adjoint."
    )
    delegated_permissions = models.JSONField(
        default=list, 
        blank=True, 
        help_text="Liste des permissions accordées à cet adjoint (ex: ['voir', 'valider', 'creer'])."
    )
    
    def __str__(self):
        title_str = f" - {self.get_ecclesial_function_display()}" if self.ecclesial_function else ""
        return f"{self.get_full_name() or self.username} ({self.get_role_display()}{title_str})"

