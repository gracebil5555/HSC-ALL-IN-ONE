from django.db import models

class TenantBoundModel(models.Model):
    """
    Modèle abstrait pour la multi-ténance.
    Filtre les données par campus.
    """
    campus = models.ForeignKey(
        'campuses.Campus',
        on_delete=models.CASCADE,
        related_name="%(app_label)s_%(class)s_related"
    )

    class Meta:
        abstract = True
