from django.db import models
from django.conf import settings
from apps.core.models import TenantBoundModel


class EcclesialFunctionCatalog(models.Model):
    """
    Catalogue configurable des fonctions ecclésiales (Sections 22, 25, 26).
    """
    code = models.CharField(max_length=40, unique=True)
    label = models.CharField(max_length=120)
    rank_order = models.PositiveIntegerField(default=100)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['rank_order', 'label']

    def __str__(self):
        return f"{self.label} ({self.code})"


class MemberStatusCatalog(models.Model):
    """
    Catalogue configurable des statuts de membres (Sections 22, 25, 26).
    """
    code = models.CharField(max_length=30, unique=True)
    label = models.CharField(max_length=100)
    color = models.CharField(max_length=30, default='slate')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id', 'label']

    def __str__(self):
        return f"{self.label} ({self.code})"


class Brigade(TenantBoundModel):
    name = models.CharField(max_length=120)
    neighborhood = models.CharField(max_length=120, blank=True)
    leader = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='led_brigades'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.campus.name}"


class Member(TenantBoundModel):
    STATUS_CHOICES = [
        ('NOUVEAU', 'Nouveau Venu'),
        ('ACTIF', 'Actif'),
        ('INACTIF', 'Inactif'),
        ('SUSPENDU', 'Suspendu'),
    ]

    # Fonctions ecclésiales configurables (Section 22 & 25)
    ECCLESIAL_FUNCTION_CHOICES = [
        ("PASTEUR", "Pasteur"),
        ("ANCIEN", "Ancien"),
        ("DIACRE", "Diacre"),
        ("EVANGELISTE", "Évangéliste"),
        ("DOCTEUR", "Docteur"),
        ("PROPHETE", "Prophète"),
        ("BERGER", "Berger"),
        ("RESPONSABLE_DEPT", "Responsable de Département"),
        ("ADJOINT_DEPT", "Adjoint de Département"),
        ("OUVRIER", "Ouvrier"),
        ("MEMBRE", "Membre"),
    ]

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='NOUVEAU')
    ecclesial_function = models.CharField(
        max_length=40,
        choices=ECCLESIAL_FUNCTION_CHOICES,
        default='MEMBRE'
    )

    # Consentements Marketing Relationnel (Sections 22, 23, 26)
    sms_opt_in = models.BooleanField(default=True)
    whatsapp_opt_in = models.BooleanField(default=True)
    unsubscribed_at = models.DateTimeField(null=True, blank=True)
    
    # Brigade / GDC
    brigade = models.ForeignKey(
        Brigade,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='members'
    )
    # Département de service
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='members'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Attendance(TenantBoundModel):
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    event_type = models.CharField(max_length=100, default='Culte Dominical')
    is_present = models.BooleanField(default=True)
    scanned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.member} - {self.date}"


class PastoralAlert(TenantBoundModel):
    STATUS_CHOICES = [
        ('OPEN', 'Ouvert'),
        ('IN_PROGRESS', 'En cours de traitement'),
        ('RESOLVED', 'Résolu'),
    ]
    
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='alerts')
    title = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    assigned_pastor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_alerts'
    )
    resolution_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Alerte: {self.member} - {self.status}"


class MemberTransferRequest(models.Model):
    """
    Demande de transfert inter-églises d'un membre en conservant son historique spirituel
    et son parcours d'assimilation.
    """
    STATUS_CHOICES = [
        ('PENDING', 'En attente'),
        ('APPROVED', 'Approuvé'),
        ('REJECTED', 'Rejeté'),
        ('CANCELLED', 'Annulé'),
    ]

    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='transfer_requests')
    from_campus = models.ForeignKey(
        'campuses.Campus',
        on_delete=models.PROTECT,
        related_name='outgoing_transfers',
    )
    to_campus = models.ForeignKey(
        'campuses.Campus',
        on_delete=models.PROTECT,
        related_name='incoming_transfers',
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='requested_transfers',
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_transfers',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    reason = models.TextField(blank=True)
    review_notes = models.TextField(blank=True)
    preserve_assimilation = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Demande de Transfert Inter-Églises"
        verbose_name_plural = "Demandes de Transfert Inter-Églises"

    def __str__(self):
        return f"Transfert {self.member} : {self.from_campus.name} -> {self.to_campus.name} ({self.status})"

