from django.db import models
from django.conf import settings
from apps.core.models import TenantBoundModel

class AILog(TenantBoundModel):
    TASK_TYPES = [
        ('VOICE_MEMO', 'Mémo Vocal (Whisper)'),
        ('OCR_ATTENDANCE', 'Feuille de Présence (Vision)'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'En attente'),
        ('PROCESSING', 'En cours de traitement'),
        ('SUCCESS', 'Succès'),
        ('FAILED', 'Échec'),
    ]

    task_type = models.CharField(max_length=50, choices=TASK_TYPES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Fichier source envoyé à l'IA (audio ou image)
    source_file = models.FileField(upload_to='ai_engine/sources/')
    
    # Données extraites sous format JSON structuré
    extracted_data = models.JSONField(null=True, blank=True)
    
    # Utilisateur ayant initié la requête
    initiated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"AI Task #{self.id} - {self.get_task_type_display()} ({self.status})"
