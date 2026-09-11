from django.db import models

class Campus(models.Model):
    CAMPUS_TYPES = [
        ('HQ', 'Siège Mondial'),
        ('EXTENSION', 'Extension'),
        ('FOYER', "Foyer d'Implantation"),
    ]
    name = models.CharField(max_length=120)
    campus_type = models.CharField(
        max_length=20,
        choices=CAMPUS_TYPES,
        default='EXTENSION'
    )
    country = models.CharField(max_length=60, default='Congo')
    city = models.CharField(max_length=60, default='Pointe-Noire')
    lead_pastor = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='led_campuses'
    )
    
    # Feature Flags
    enable_brigades = models.BooleanField(default=True)
    enable_patrimoine = models.BooleanField(default=True)
    enable_finances = models.BooleanField(default=True)
    enable_ai_voice = models.BooleanField(default=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.get_campus_type_display()})"
