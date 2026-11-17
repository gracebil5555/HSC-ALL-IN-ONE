from django.conf import settings
from django.db import models
from apps.core.models import TenantBoundModel


class MessageTemplate(models.Model):
    CATEGORY_CHOICES = [
        ('BIENVENUE', 'Bienvenue (Nouveau Venu)'),
        ('INVITATION', 'Invitation'),
        ('RAPPEL', 'Rappel'),
        ('ANNIVERSAIRE', 'Anniversaire'),
        ('INFO_ACTIVITE', 'Info Activité'),
        ('RELANCE', 'Relance Inactifs'),
        ('AUTRE', 'Autre'),
    ]
    CHANNEL_CHOICES = [
        ('SMS', 'SMS'),
        ('WHATSAPP', 'WhatsApp'),
        ('BOTH', 'SMS & WhatsApp'),
    ]

    campus = models.ForeignKey(
        'campuses.Campus',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='message_templates',
        help_text="Null = modèle global réseau HSC.",
    )
    name = models.CharField(max_length=150)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='AUTRE')
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES, default='SMS')
    body = models.TextField(
        help_text="Variables supportées : {first_name}, {last_name}, {full_name}, {campus_name}"
    )
    is_active = models.BooleanField(default=True)
    is_auto_welcome = models.BooleanField(
        default=False,
        help_text="Si actif, ce modèle est déclenché automatiquement lors de l'accueil d'un nouveau venu.",
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_message_templates',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.name} [{self.category} - {self.channel}]"


class CommunicationCampaign(TenantBoundModel):
    AUDIENCE_CHOICES = [
        ('ALL_MEMBERS', 'Tous les membres'),
        ('NEW_MEMBERS', 'Nouveaux venus'),
        ('INACTIVE_MEMBERS', 'Membres inactifs'),
        ('BY_STATUS', 'Par statut d\'activité'),
        ('BY_FUNCTION', 'Par fonction ecclésiale'),
        ('BY_DEPARTMENT', 'Par département'),
        ('LEADERS_AND_DEPUTIES', 'Responsables de départements & Adjoints'),
    ]
    STATUS_CHOICES = [
        ('DRAFT', 'Brouillon'),
        ('SENT', 'Envoyée'),
        ('PARTIAL', 'Partielle'),
        ('FAILED', 'Échouée'),
    ]

    title = models.CharField(max_length=200)
    template = models.ForeignKey(
        MessageTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='campaigns',
    )
    channel = models.CharField(max_length=20, choices=MessageTemplate.CHANNEL_CHOICES, default='SMS')
    custom_body = models.TextField(blank=True)
    audience_type = models.CharField(max_length=30, choices=AUDIENCE_CHOICES, default='ALL_MEMBERS')
    target_status = models.CharField(max_length=30, blank=True)
    target_ecclesial_function = models.CharField(max_length=40, blank=True)
    target_department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='communication_campaigns',
    )
    include_deputies = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    total_recipients = models.PositiveIntegerField(default=0)
    sent_count = models.PositiveIntegerField(default=0)
    failed_count = models.PositiveIntegerField(default=0)
    sent_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_campaigns',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.status})"


class MessageLog(TenantBoundModel):
    CHANNEL_CHOICES = [
        ('SMS', 'SMS'),
        ('WHATSAPP', 'WhatsApp'),
    ]
    STATUS_CHOICES = [
        ('QUEUED', 'En file'),
        ('SENT', 'Envoyé'),
        ('DELIVERED', 'Délivré'),
        ('FAILED', 'Échoué'),
        ('SIMULATED', 'Simulé'),
    ]

    campaign = models.ForeignKey(
        CommunicationCampaign,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logs',
    )
    template = models.ForeignKey(
        MessageTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='logs',
    )
    recipient_member = models.ForeignKey(
        'members.Member',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='message_logs',
    )
    recipient_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='message_logs',
    )
    recipient_name = models.CharField(max_length=200)
    recipient_phone = models.CharField(max_length=30)
    channel = models.CharField(max_length=20, choices=CHANNEL_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='QUEUED')
    rendered_content = models.TextField()
    provider_message_id = models.CharField(max_length=150, blank=True)
    error_message = models.TextField(blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-sent_at']

    def __str__(self):
        return f"[{self.channel}] {self.recipient_name} ({self.status})"
