from django.conf import settings
from django.core.exceptions import ValidationError
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


class SystemAuditLog(models.Model):
    """
    Journal d'audit immuable (append-only) pour tracer les actions critiques :
    délégations d'adjoint, suppressions, modifications financières/patrimoniales,
    clôtures mensuelles et transferts inter-églises.
    """
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
    )
    actor_username = models.CharField(max_length=150, blank=True)
    campus = models.ForeignKey(
        'campuses.Campus',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
    )
    action = models.CharField(max_length=80, db_index=True)
    target_model = models.CharField(max_length=100, db_index=True)
    target_id = models.CharField(max_length=64, blank=True)
    description = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Journal d'Audit Système"
        verbose_name_plural = "Journaux d'Audit Système"

    def save(self, *args, **kwargs):
        if self.pk is not None:
            raise ValidationError("SystemAuditLog est immuable (append-only) et ne peut pas être modifié.")
        if self.actor and not self.actor_username:
            self.actor_username = self.actor.username
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValidationError("SystemAuditLog est immuable (append-only) et ne peut pas être supprimé.")

    def __str__(self):
        return f"[{self.created_at}] {self.action} by {self.actor_username or 'system'} ({self.target_model}#{self.target_id})"


def log_audit_event(
    *,
    actor=None,
    action: str,
    target_model: str,
    target_id="",
    campus=None,
    description: str = "",
    metadata: dict = None,
    request=None,
):
    """Helper sûr pour enregistrer un événement d'audit immuable."""
    ip_address = None
    if request is not None:
        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        if xff:
            ip_address = xff.split(",")[0].strip()
        else:
            ip_address = request.META.get("REMOTE_ADDR")

    actor_obj = actor if (actor and getattr(actor, "is_authenticated", True) and getattr(actor, "pk", None)) else None
    username = getattr(actor, "username", "") if actor else ""

    return SystemAuditLog.objects.create(
        actor=actor_obj,
        actor_username=username,
        campus=campus,
        action=action,
        target_model=target_model,
        target_id=str(target_id) if target_id is not None else "",
        description=description,
        metadata=metadata or {},
        ip_address=ip_address,
    )
