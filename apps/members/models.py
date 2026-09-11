from django.db import models
from django.conf import settings
from apps.core.models import TenantBoundModel

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

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    phone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='NOUVEAU')
    
    # Brigade is optional (non affecté)
    brigade = models.ForeignKey(
        Brigade,
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
