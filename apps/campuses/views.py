from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from apps.users.permissions import IsSuperSuperAdmin, IsSuperAdminOfCampus
from .models import Campus
from .serializers import CampusSerializer

class CampusViewSet(viewsets.ModelViewSet):
    """
    Gestion des Églises et Extensions HSC (Sections 5, 6, 10, 14, 15).
    - Lecture accessible pour le chargement initial des campus.
    - Création / suppression d'une nouvelle extension : strictement réservée au Super Super Admin.
    - Modification : Super Super Admin ou Super Admin du campus concerné.
    """
    queryset = Campus.objects.all().select_related("parent", "lead_pastor")
    serializer_class = CampusSerializer

    def get_permissions(self):
        if self.action in ("create", "destroy"):
            return [IsAuthenticated(), IsSuperSuperAdmin()]
        if self.action in ("update", "partial_update"):
            return [IsAuthenticated(), IsSuperAdminOfCampus()]
        return [AllowAny()]

    def perform_create(self, serializer):
        campus = serializer.save()
        if campus.lead_pastor:
            pastor = campus.lead_pastor
            pastor.campus = campus
            if pastor.role not in ("SUPER_SUPER_ADMIN", "SUPER_ADMIN"):
                pastor.role = "SUPER_ADMIN"
            pastor.save()

    def perform_update(self, serializer):
        campus = serializer.save()
        if campus.lead_pastor:
            pastor = campus.lead_pastor
            pastor.campus = campus
            if pastor.role not in ("SUPER_SUPER_ADMIN", "SUPER_ADMIN"):
                pastor.role = "SUPER_ADMIN"
            pastor.save()


