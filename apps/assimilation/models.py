from django.db import models
from django.conf import settings
from apps.core.models import TenantBoundModel
from apps.members.models import Member

class AssimilationProfile(models.Model):
    STAGE_CHOICES = [
        ('CONTACT', 'Contact Initial'),
        ('M1', 'Cours M1'),
        ('M2', 'Cours M2'),
        ('BAPTISM', 'Préparation Baptême'),
        ('INTEGRATED', 'Intégré'),
    ]

    member = models.OneToOneField(Member, on_delete=models.CASCADE, related_name='assimilation_profile')
    current_stage = models.CharField(max_length=20, choices=STAGE_CHOICES, default='CONTACT')
    started_at = models.DateTimeField(auto_now_add=True)
    last_advanced_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Parcours: {self.member.first_name} {self.member.last_name} - {self.current_stage}"


class ClassSession(TenantBoundModel):
    CLASS_TYPE_CHOICES = [
        ('M1', 'Module 1'),
        ('M2', 'Module 2'),
    ]
    
    class_type = models.CharField(max_length=10, choices=CLASS_TYPE_CHOICES)
    date = models.DateField()
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    attendees = models.ManyToManyField(Member, related_name='attended_classes', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.class_type} - {self.date}"


class BaptismInterview(TenantBoundModel):
    STATUS_CHOICES = [
        ('SCHEDULED', 'Programmé'),
        ('APPROVED', 'Approuvé pour Baptême'),
        ('POSTPONED', 'Ajourné'),
    ]

    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='baptism_interviews')
    pastor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    interview_date = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')
    notes = models.TextField(blank=True)
    scheduled_baptism_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Entretien {self.member} - {self.status}"
