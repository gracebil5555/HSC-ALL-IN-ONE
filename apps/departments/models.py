from django.db import models
from apps.core.models import TenantBoundModel

class Department(TenantBoundModel):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name
