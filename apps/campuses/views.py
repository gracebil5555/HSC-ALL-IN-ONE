from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.users.permissions import IsSuperSuperAdmin
from .models import Campus
from .serializers import CampusSerializer

class CampusViewSet(viewsets.ModelViewSet):
    """
    Gestion des Églises et Extensions HSC.
    Lecture accessible à tous les membres connectés.
    Création d'une nouvelle extension strictement réservée au Super Super Admin (Section 5 & 10).
    """
    queryset = Campus.objects.all().select_related("parent", "lead_pastor")
    serializer_class = CampusSerializer

    def get_permissions(self):
        if self.action in ("create", "destroy"):
            return [IsAuthenticated(), IsSuperSuperAdmin()]
        if self.action in ("update", "partial_update"):
            return [IsAuthenticated()]
        return [AllowAny()]

