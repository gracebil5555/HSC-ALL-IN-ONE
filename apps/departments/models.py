from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.core.models import TenantBoundModel

class DepartmentCatalog(models.Model):
    """
    Référentiel global des structures et départements recommandés par HSC :
    Ex: Secrétariat, Accueil, Social, Chorale/Musique, Finances, Patrimoine,
    GDC, Brigade, Communication, Jeunesse, Évangélisation, etc.
    Géré par le Super Super Admin.
    """
    name = models.CharField(max_length=150, unique=True)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default="Users", help_text="Nom de l'icône Lucide")
    is_default = models.BooleanField(default=True, help_text="Proposé par défaut à l'activation d'une Église")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        verbose_name = "Catalogue de Structure"
        verbose_name_plural = "Catalogue des Structures"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class Department(TenantBoundModel):
    """
    Département activé ou créé librement par une Église / Extension.
    Chaque Église peut activer ou non les départements selon ses besoins réels,
    ou créer ses propres structures spécifiques sans modification de code.
    Possède un Admin titulaire et peut avoir un Adjoint.
    """
    catalog_item = models.ForeignKey(
        DepartmentCatalog,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='activated_departments',
        help_text="Référence au catalogue global (si créé depuis le catalogue)"
    )
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, default="Users")
    
    # Responsables de structure (Section 8 du document)
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='administered_departments',
        help_text="Administrateur titulaire du département"
    )
    deputy = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deputy_departments',
        help_text="Adjoint du département"
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)


    class Meta:
        verbose_name = "Département d'Église"
        verbose_name_plural = "Départements d'Église"
        unique_together = ('campus', 'name')
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.campus.name}"

